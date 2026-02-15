package administracion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import administracion.dtos.*;
import administracion.models.Empresa;
import administracion.models.Usuario;
import administracion.repositories.EmpresaRepository;
import administracion.repositories.UsuarioRepository;
import administracion.services.CognitoService;
import administracion.services.UsuarioService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CognitoService cognitoService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final administracion.services.SolicitudAccesoService solicitudAccesoService;

    /**
     * Registra un nuevo usuario completo (Cognito + BD)
     */
    @PostMapping("/registro")
    @Transactional
    public ResponseEntity<Map<String, String>> registrar(@RequestBody RegistroDTO dto) {
        try {
            // 1. Verificar si el email ya existe en la base de datos
            if (usuarioService.existeEmailEnBD(dto.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("error",
                        "Este correo electrónico ya está registrado. Por favor, ingresa un correo diferente o inicia sesión.");
                return ResponseEntity.badRequest().body(error);
            }

            // 2. Verificar si el email ya existe en Cognito
            if (cognitoService.existeUsuarioEnCognito(dto.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("error",
                        "Este correo electrónico ya está registrado en el sistema. Por favor, ingresa un correo diferente o inicia sesión.");
                return ResponseEntity.badRequest().body(error);
            }

            // 3. PRIMERO: Crear usuario en Cognito con todos los atributos
            String sub = cognitoService.registrarUsuario(
                    dto.getEmail(),
                    dto.getPassword(),
                    dto.getNombre(),
                    dto.getApellido(),
                    dto.getNombreEmpresa());

            // 4. SEGUNDO: Verificar si la empresa ya existe
            java.util.Optional<Empresa> empresaExistente = empresaRepository
                    .findByNombreIgnoreCase(dto.getNombreEmpresa());

            // 5. Crear usuario en BD
            Usuario usuario = new Usuario();
            usuario.setSub(sub);
            usuario.setNombre(dto.getNombre() + " " + dto.getApellido());
            usuario.setEmail(dto.getEmail());
            usuario.setActivo(true);

            boolean esInvitacion = dto.getEsInvitacion() != null && dto.getEsInvitacion();

            if (empresaExistente.isPresent()) {
                // CASO 1: Empresa EXISTE -> Crear usuario huerfano + Solicitud de Acceso
                // A MENOS que sea una invitacion explicita, en cuyo caso lo unimos directo

                if (esInvitacion) {
                    // Si es invitación, lo unimos directo como COLABORADOR
                    usuario.setRol("COLABORADOR");
                    usuario.setEsPropietario(false);
                    usuario.setEmpresa(empresaExistente.get());
                    usuarioRepository.save(usuario);
                } else {
                    // Si NO es invitación (se unió por buscador), creamos solicitud
                    usuario.setRol("COLABORADOR");
                    usuario.setEsPropietario(false);
                    usuario.setEmpresa(null); // Sin empresa asignada aún
                    usuarioRepository.save(usuario);

                    // Crear solicitud de acceso
                    try {
                        solicitudAccesoService.crearSolicitud(
                                usuario.getSub(),
                                usuario.getNombre(),
                                usuario.getEmail(),
                                empresaExistente.get().getId());
                    } catch (Exception ex) {
                        System.err.println("Error creando solicitud automática: " + ex.getMessage());
                        // No fallamos el registro, el usuario podrá pedirla manualmente después
                    }
                }

            } else {
                // CASO 2: Empresa NUEVA -> Crear empresa + Usuario ADMIN
                Empresa nuevaEmpresa = new Empresa();
                nuevaEmpresa.setNombre(dto.getNombreEmpresa());
                nuevaEmpresa.setDescripcion("Empresa creada desde registro");
                Empresa empresaGuardada = empresaRepository.save(nuevaEmpresa);

                usuario.setRol("ADMINISTRADOR");
                usuario.setEsPropietario(true);
                usuario.setEmpresa(empresaGuardada);
                usuarioRepository.save(usuario);
            }

            // 6. Retornar éxito (código enviado automáticamente por Cognito)
            Map<String, String> response = new HashMap<>();
            response.put("mensaje",
                    "Usuario registrado exitosamente. Verifica tu email para obtener el código de confirmación.");
            response.put("email", dto.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            String rawMessage = e.getMessage() != null ? e.getMessage() : "";
            String friendly = mapCognitoRegistrationError(rawMessage);
            error.put("error", friendly);
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Normaliza los mensajes técnicos de Cognito en el registro a textos claros en
     * español.
     *
     * Nota: se basa en fragmentos del mensaje original, pero siempre devuelve algo
     * entendible para el usuario final y sin IDs ni detalles internos.
     */
    private String mapCognitoRegistrationError(String raw) {
        if (raw == null) {
            return "No pudimos crear la cuenta. Intentá nuevamente en unos segundos.";
        }

        String msg = raw;

        // Reglas típicas de contraseña de Cognito
        if (msg.contains("Password did not conform with policy") || msg.contains("Password not long enough")) {
            return "La contraseña no cumple con los requisitos de seguridad. Usá al menos 8 caracteres y combiná mayúsculas, minúsculas, números y un símbolo.";
        }
        if (msg.contains("must have uppercase characters")) {
            return "La contraseña debe incluir al menos una letra mayúscula.";
        }
        if (msg.contains("must have lowercase characters")) {
            return "La contraseña debe incluir al menos una letra minúscula.";
        }
        if (msg.contains("must have numeric characters")) {
            return "La contraseña debe incluir al menos un número.";
        }
        if (msg.contains("must have symbol characters") || msg.contains("symbol characters")) {
            return "La contraseña debe incluir al menos un símbolo (por ejemplo: !, ?, #, @).";
        }

        // Usuario ya existente en Cognito (fallback por si no se capturó antes)
        if (msg.contains("UsernameExistsException") || msg.toLowerCase().contains("already exists")) {
            return "Este correo electrónico ya está registrado en el sistema. Iniciá sesión o usá otro correo.";
        }

        // Fallback genérico
        return "No pudimos crear la cuenta. Revisá los datos e intentá nuevamente.";
    }

    /**
     * Reenvía el código de confirmación
     */
    @PostMapping("/reenviar-codigo")
    public ResponseEntity<Map<String, String>> reenviarCodigo(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            cognitoService.reenviarCodigoConfirmacion(email);

            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Código de confirmación reenviado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Confirma el código de verificación
     */
    @PostMapping("/confirmar")
    public ResponseEntity<Map<String, String>> confirmar(@RequestBody ConfirmarCodigoDTO dto) {
        try {
            cognitoService.confirmarRegistro(dto.getEmail(), dto.getCodigo());

            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Cuenta confirmada exitosamente. Ya puedes iniciar sesión.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Verifica si un usuario tiene perfil completo
     */
    @GetMapping("/verificar-perfil/{sub}")
    public ResponseEntity<Map<String, Boolean>> verificarPerfil(@PathVariable String sub) {
        boolean tienePerfilCompleto = usuarioService.tienePerfilCompleto(sub);
        Map<String, Boolean> response = new HashMap<>();
        response.put("perfilCompleto", tienePerfilCompleto);
        return ResponseEntity.ok(response);
    }
}
