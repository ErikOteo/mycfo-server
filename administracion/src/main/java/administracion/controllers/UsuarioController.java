package administracion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import administracion.dtos.ActualizarUsuarioDTO;
import administracion.dtos.UsuarioDTO;
import administracion.services.UsuarioService;
import administracion.services.PermissionService;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final PermissionService permissionService;

    @GetMapping("/perfil")
    public ResponseEntity<UsuarioDTO> obtenerPerfil(
            @RequestHeader(value = "X-Usuario-Sub") String sub) {
        UsuarioDTO usuario = usuarioService.obtenerUsuarioPorSub(sub);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping("/{sub}")
    public ResponseEntity<UsuarioDTO> obtenerUsuario(@PathVariable String sub) {
        UsuarioDTO usuario = usuarioService.obtenerUsuarioPorSub(sub);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> crearOActualizarUsuario(@RequestBody UsuarioDTO usuarioDTO) {
        UsuarioDTO guardado = usuarioService.crearOActualizarUsuario(usuarioDTO);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/perfil")
    public ResponseEntity<UsuarioDTO> actualizarPerfil(
            @RequestHeader(value = "X-Usuario-Sub") String sub,
            @RequestBody ActualizarUsuarioDTO dto) {
        UsuarioDTO actualizado = usuarioService.actualizarPerfil(sub, dto);
        return ResponseEntity.ok(actualizado);
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<UsuarioDTO>> obtenerEmpleados(@PathVariable Long empresaId) {
        List<UsuarioDTO> empleados = usuarioService.obtenerEmpleadosPorEmpresa(empresaId);
        return ResponseEntity.ok(empleados);
    }

    @PutMapping("/{sub}")
    public ResponseEntity<UsuarioDTO> actualizarEmpleado(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuarioActual,
            @PathVariable String sub,
            @RequestBody ActualizarUsuarioDTO dto) {

        try {
            UsuarioDTO actualizado = usuarioService.actualizarEmpleado(sub, dto, subUsuarioActual);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(null);
        }
    }

    @DeleteMapping("/{sub}")
    public ResponseEntity<Void> eliminarEmpleado(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuarioActual,
            @PathVariable String sub) {

        try {
            usuarioService.eliminarEmpleado(sub, subUsuarioActual);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PutMapping("/{sub}/desactivar")
    public ResponseEntity<UsuarioDTO> desactivarEmpleado(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuarioActual,
            @PathVariable String sub) {

        try {
            UsuarioDTO desactivado = usuarioService.desactivarEmpleado(sub, subUsuarioActual);
            return ResponseEntity.ok(desactivado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PutMapping("/{sub}/activar")
    public ResponseEntity<UsuarioDTO> activarEmpleado(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuarioActual,
            @PathVariable String sub) {

        try {
            UsuarioDTO activado = usuarioService.activarEmpleado(sub, subUsuarioActual);
            return ResponseEntity.ok(activado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(
            @RequestHeader("Authorization") String token,
            @RequestBody administracion.dtos.CambiarPasswordDTO dto) {
        usuarioService.cambiarPassword(token, dto.getOldPassword(), dto.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
