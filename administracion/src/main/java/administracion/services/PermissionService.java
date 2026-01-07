package administracion.services;

import administracion.models.Rol;
import administracion.models.Usuario;
import administracion.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UsuarioRepository usuarioRepository;

    /**
     * Verifica si el usuario actual es administrador
     * @param subUsuarioActual Sub del usuario que está haciendo la petición
     * @return true si es administrador, false en caso contrario
     */
    public boolean esAdministrador(String subUsuarioActual) {
        Usuario usuario = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        return usuario.getRol() == Rol.ADMINISTRADOR;
    }

    /**
     * Verifica si el usuario actual puede editar el usuario objetivo
     * Un administrador puede editar cualquier usuario de su empresa
     * Un usuario normal solo puede editar su propio perfil
     * @param subUsuarioActual Sub del usuario que está haciendo la petición
     * @param subUsuarioObjetivo Sub del usuario que se quiere editar
     * @return true si puede editar, false en caso contrario
     */
    public boolean puedeEditarUsuario(String subUsuarioActual, String subUsuarioObjetivo) {
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));
        
        // Si es el mismo usuario, puede editar su perfil
        if (subUsuarioActual.equals(subUsuarioObjetivo)) {
            return true;
        }
        
        // Si es administrador, puede editar cualquier usuario de su empresa
        if (usuarioActual.getRol() == Rol.ADMINISTRADOR) {
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
     * Solo los administradores pueden editar datos de la empresa
     * @param subUsuarioActual Sub del usuario que está haciendo la petición
     * @param empresaId ID de la empresa que se quiere editar
     * @return true si puede editar, false en caso contrario
     */
    public boolean puedeEditarEmpresa(String subUsuarioActual, Long empresaId) {
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));
        
        // Solo administradores pueden editar empresa
        if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
            return false;
        }
        
        // Verificar que el usuario pertenezca a la empresa que quiere editar
        if (usuarioActual.getEmpresa() != null) {
            return usuarioActual.getEmpresa().getId().equals(empresaId);
        }
        
        return false;
    }
}
