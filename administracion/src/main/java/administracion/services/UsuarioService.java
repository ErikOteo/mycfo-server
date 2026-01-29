package administracion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import administracion.dtos.ActualizarUsuarioDTO;
import administracion.dtos.UsuarioDTO;
import administracion.models.Empresa;
import administracion.models.Rol;
import administracion.models.Usuario;
import administracion.repositories.EmpresaRepository;
import administracion.repositories.UsuarioRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final CognitoService cognitoService;

    public UsuarioDTO obtenerUsuarioPorSub(String sub) {
        Usuario usuario = usuarioRepository.findBySub(sub)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return convertirADTO(usuario);
    }

    public UsuarioDTO obtenerUsuarioPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return convertirADTO(usuario);
    }

    /**
     * Verifica si un usuario tiene perfil completo en la BD
     */
    public boolean tienePerfilCompleto(String sub) {
        return usuarioRepository.findBySub(sub).isPresent();
    }

    /**
     * Verifica si un email ya está registrado en la BD
     */
    public boolean existeEmailEnBD(String email) {
        return usuarioRepository.findByEmail(email).isPresent();
    }

    public List<UsuarioDTO> obtenerEmpleadosPorEmpresa(Long empresaId) {
        List<Usuario> usuarios = usuarioRepository.findByEmpresaId(empresaId);
        return usuarios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioDTO crearOActualizarUsuario(UsuarioDTO usuarioDTO) {
        Usuario usuario = usuarioRepository.findBySub(usuarioDTO.getSub())
                .orElse(new Usuario());

        usuario.setSub(usuarioDTO.getSub());
        usuario.setNombre(usuarioDTO.getNombre());
        usuario.setEmail(usuarioDTO.getEmail());
        usuario.setTelefono(usuarioDTO.getTelefono());

        // REGLA: Solo asignar rol ADMINISTRADOR si viene explícitamente y es válido
        // Por defecto, todos los usuarios nuevos empiezan como NORMAL
        if (usuarioDTO.getRol() != null) {
            usuario.setRol(usuarioDTO.getRol());
        } else {
            usuario.setRol(Rol.NORMAL); // Rol por defecto para usuarios nuevos
        }

        usuario.setActivo(true);

        if (usuarioDTO.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(usuarioDTO.getEmpresaId())
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
            usuario.setEmpresa(empresa);
        }

        Usuario guardado = usuarioRepository.save(usuario);
        return convertirADTO(guardado);
    }

    @Transactional
    public UsuarioDTO actualizarPerfil(String sub, ActualizarUsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findBySub(sub)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());

        if (dto.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(dto.getEmpresaId())
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
            usuario.setEmpresa(empresa);
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        cognitoService.actualizarUsuarioEnCognito(sub, dto.getNombre(), dto.getEmail(), dto.getTelefono());

        return convertirADTO(actualizado);
    }

    @Transactional
    public UsuarioDTO actualizarEmpleado(String subEmpleado, ActualizarUsuarioDTO dto, String subUsuarioActual) {
        Usuario usuario = usuarioRepository.findBySub(subEmpleado)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario actual es administrador
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));

        if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
            throw new RuntimeException("Solo los administradores pueden actualizar empleados");
        }

        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());

        // Solo un administrador puede asignar rol de administrador
        if (dto.getRol() != null) {
            if (dto.getRol() == Rol.ADMINISTRADOR && usuarioActual.getRol() != Rol.ADMINISTRADOR) {
                throw new RuntimeException("Solo un administrador puede asignar el rol de administrador");
            }

            // Validación adicional: no permitir que un usuario normal cambie roles
            if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
                throw new RuntimeException("Solo los administradores pueden cambiar roles de usuarios");
            }

            usuario.setRol(dto.getRol());
        }

        if (dto.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(dto.getEmpresaId())
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
            usuario.setEmpresa(empresa);
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        cognitoService.actualizarUsuarioEnCognito(subEmpleado, dto.getNombre(), dto.getEmail(), dto.getTelefono());

        return convertirADTO(actualizado);
    }

    @Transactional
    public void eliminarEmpleado(String subEmpleado, String subUsuarioActual) {
        // Verificar que no se está eliminando a sí mismo
        if (subEmpleado.equals(subUsuarioActual)) {
            throw new RuntimeException("No puedes eliminar tu propia cuenta. Debe hacerlo otro administrador.");
        }

        Usuario usuario = usuarioRepository.findBySub(subEmpleado)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario actual es administrador
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));

        if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
            throw new RuntimeException("Solo los administradores pueden eliminar empleados");
        }

        usuarioRepository.delete(usuario);
        cognitoService.eliminarUsuarioEnCognito(subEmpleado);
    }

    @Transactional
    public UsuarioDTO desactivarEmpleado(String subEmpleado, String subUsuarioActual) {
        // Verificar que no se está desactivando a sí mismo
        if (subEmpleado.equals(subUsuarioActual)) {
            throw new RuntimeException("No puedes desactivar tu propia cuenta. Debe hacerlo otro administrador.");
        }

        Usuario usuario = usuarioRepository.findBySub(subEmpleado)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario actual es administrador
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));

        if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
            throw new RuntimeException("Solo los administradores pueden desactivar empleados");
        }

        usuario.setActivo(false);
        Usuario actualizado = usuarioRepository.save(usuario);
        cognitoService.desactivarUsuarioEnCognito(subEmpleado);

        return convertirADTO(actualizado);
    }

    @Transactional
    public UsuarioDTO activarEmpleado(String subEmpleado, String subUsuarioActual) {
        Usuario usuario = usuarioRepository.findBySub(subEmpleado)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario actual es administrador
        Usuario usuarioActual = usuarioRepository.findBySub(subUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));

        if (usuarioActual.getRol() != Rol.ADMINISTRADOR) {
            throw new RuntimeException("Solo los administradores pueden activar empleados");
        }

        usuario.setActivo(true);
        Usuario actualizado = usuarioRepository.save(usuario);
        cognitoService.activarUsuarioEnCognito(subEmpleado);

        return convertirADTO(actualizado);
    }

    private UsuarioDTO convertirADTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setSub(usuario.getSub());
        dto.setNombre(usuario.getNombre());
        dto.setEmail(usuario.getEmail());
        dto.setTelefono(usuario.getTelefono());
        dto.setRol(usuario.getRol());
        dto.setActivo(usuario.getActivo());

        if (usuario.getEmpresa() != null) {
            dto.setEmpresaId(usuario.getEmpresa().getId());
            dto.setEmpresaNombre(usuario.getEmpresa().getNombre());
            dto.setEmpresaCuit(usuario.getEmpresa().getCuit());
            dto.setEmpresaCondicionIVA(usuario.getEmpresa().getCondicionIVA());
            dto.setEmpresaDomicilio(usuario.getEmpresa().getDomicilio());
        }

        return dto;
    }

    public void cambiarPassword(String token, String oldPassword, String newPassword) {
        String accessToken = token;
        if (token != null && token.startsWith("Bearer ")) {
            accessToken = token.substring(7);
        }
        cognitoService.cambiarPassword(accessToken, oldPassword, newPassword);
    }
}
