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
     * Un usuario normal solo puede editar su propio perfil
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

        // Si es ADMINISTRADOR puro (sin JSON), tiene acceso total
        if (rolRaw.equals("ADMINISTRADOR") || rolRaw.startsWith("ADMINISTRADOR|")) {
            // Si tiene el pipe pero no el JSON (admin de legado modificado), o es admin
            // puro
            if (!rolRaw.contains("|PERM:")) {
                return true;
            }
        }

        // Si tiene el formato de permisos JSON
        if (rolRaw.contains("|PERM:")) {
            try {
                String jsonPart = rolRaw.split("\\|PERM:")[1];
                JsonNode root = objectMapper.readTree(jsonPart);
                JsonNode moduloNode = root.get(modulo);
                if (moduloNode != null && moduloNode.has(accion)) {
                    return moduloNode.get(accion).asBoolean();
                }
            } catch (Exception e) {
                // Si falla el parseo, pero empieza con ADMINISTRADOR, permitimos por seguridad
                return rolRaw.startsWith("ADMINISTRADOR");
            }
        }

        // Caso por defecto para usuarios NORMAL sin JSON o sin ese permiso específico
        return false;
    }
}
