package administracion.services;

import administracion.models.Usuario;
import administracion.repositories.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Verifica si el usuario actual es administrador
     * 
     * @param subUsuarioActual Sub del usuario que está haciendo la petición
     * @return true si es administrador, false en caso contrario
     */
    public boolean esAdministrador(String subUsuarioActual) {
        Usuario usuario = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return usuario.getRol() != null && usuario.getRol().startsWith("ADMINISTRADOR");
    }

    /**
     * Verifica si el usuario actual puede editar el usuario objetivo
     * Un administrador puede editar cualquier usuario de su empresa
     * Un colaborador solo puede editar su propio perfil
     * 
     * @param subUsuarioActual   Sub del usuario que está haciendo la petición
     * @param subUsuarioObjetivo Sub del usuario que se quiere editar
     * @return true si puede editar, false en caso contrario
     */
    public boolean puedeEditarUsuario(String subUsuarioActual, String subUsuarioObjetivo) {
        // Si es el mismo usuario, puede editar su perfil
        if (subUsuarioActual.equals(subUsuarioObjetivo)) {
            return true;
        }

        // Si es otro usuario, solo puede si tiene permiso de edición en el módulo admin
        if (tienePermiso(subUsuarioActual, "admin", "edit")) {
            Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                    .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));
            Usuario usuarioObjetivo = usuarioRepository.findBySub(subUsuarioObjetivo)
                    .orElseThrow(() -> new RuntimeException("Usuario objetivo no encontrado"));

            // Verificar que ambos usuarios pertenezcan a la misma empresa
            if (usuarioActual.getEmpresa() != null && usuarioObjetivo.getEmpresa() != null) {
                return usuarioActual.getEmpresa().getId().equals(usuarioObjetivo.getEmpresa().getId());
            }
        }

        return false;
    }

    /**
     * Verifica si el usuario pertenece a la empresa especificada
     * 
     * @param subUsuarioActual Sub del usuario
     * @param empresaId        ID de la empresa
     * @return true si pertenece
     */
    public boolean perteneceAEmpresa(String subUsuarioActual, Long empresaId) {
        Usuario usuario = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return usuario.getEmpresa() != null && usuario.getEmpresa().getId().equals(empresaId);
    }

    /**
     * Verifica si el usuario actual puede editar la empresa
     * Solo los administradores con permiso pueden editar datos de la empresa
     * 
     * @param subUsuarioActual Sub del usuario que está haciendo la petición
     * @param empresaId        ID de la empresa que se quiere editar
     * @return true si puede editar, false en caso contrario
     */
    public boolean puedeEditarEmpresa(String subUsuarioActual, Long empresaId) {
        // Solo administradores con permiso 'edit' en el módulo admin
        if (!tienePermiso(subUsuarioActual, "admin", "edit")) {
            return false;
        }

        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));

        // Verificar que el usuario pertenezca a la empresa que quiere editar
        if (usuarioActual.getEmpresa() != null) {
            return usuarioActual.getEmpresa().getId().equals(empresaId);
        }

        return false;
    }

    /**
     * Verifica si el usuario tiene un permiso granular específico
     * 
     * @param subUsuarioActual Sub del usuario
     * @param modulo           Nombre del módulo (dashboard, carga, movs, etc)
     * @param accion           Accion (view, edit)
     * @return true si tiene el permiso
     */
    public boolean tienePermiso(String subUsuarioActual, String modulo, String accion) {
        Usuario usuario = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String rolRaw = usuario.getRol();
        if (rolRaw == null)
            return false;

        // GOD MODE: Si es ADMINISTRADOR, tiene acceso a todo por defecto
        if (rolRaw.startsWith("ADMINISTRADOR")) {
            return true;
        }

        // Si es COLABORADOR y tiene el formato de permisos JSON
        if (rolRaw.contains("|PERM:")) {
            try {
                String jsonPart = rolRaw.split("\\|PERM:")[1];
                // El split puede incluir el COLOR, así que tomamos solo hasta el siguiente pipe
                // si existe
                String jsonOnly = jsonPart.contains("|") ? jsonPart.split("\\|")[0] : jsonPart;

                JsonNode root = objectMapper.readTree(jsonOnly);
                JsonNode moduloNode = root.get(modulo);
                if (moduloNode != null && moduloNode.has(accion)) {
                    return moduloNode.get(accion).asBoolean();
                }
            } catch (Exception e) {
                // Si falla el parseo de un colaborador, denegamos por seguridad
                return false;
            }
        }

        // Caso por defecto para usuarios COLABORADOR sin JSON o sin ese permiso
        // específico
        return false;
    }
}
