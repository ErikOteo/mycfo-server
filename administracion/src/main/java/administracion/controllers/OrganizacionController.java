package administracion.controllers;

import administracion.dtos.EmpresaDTO;
import administracion.dtos.OrganizacionInfoResponse;
import administracion.dtos.UsuarioDTO;
import administracion.services.EmpresaService;
import administracion.services.UsuarioService;
import administracion.services.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/organizacion")
@RequiredArgsConstructor
public class OrganizacionController {

    private final UsuarioService usuarioService;
    private final EmpresaService empresaService;
    private final PermissionService permissionService;

    @GetMapping("/info-completa")
    public ResponseEntity<OrganizacionInfoResponse> obtenerInfoCompletaOrganizacion(
            @RequestHeader("X-Usuario-Sub") String sub) {
        try {
            UsuarioDTO perfil = usuarioService.obtenerUsuarioPorSub(sub);

            if (perfil.getEmpresaId() == null) {
                // El usuario no tiene empresa asociada
                OrganizacionInfoResponse sinEmpresa = OrganizacionInfoResponse.builder()
                        .perfil(perfil)
                        .empresa(null)
                        .empleados(List.of())
                        .build();
                return ResponseEntity.ok(sinEmpresa);
            }

            EmpresaDTO empresa = empresaService.obtenerEmpresa(perfil.getEmpresaId());

            // Solo incluimos la lista de empleados si el usuario tiene permiso admin.view
            List<UsuarioDTO> empleados = List.of();
            boolean tienePermisoAdmin = permissionService.tienePermiso(sub, "admin", "view");
            System.out.println("🔍 [DEBUG-ORGANIZACION] Sub: " + sub);
            System.out.println("🔍 [DEBUG-ORGANIZACION] EmpresaId: " + perfil.getEmpresaId());
            System.out.println("🔍 [DEBUG-ORGANIZACION] Tiene permiso admin.view: " + tienePermisoAdmin);

            if (tienePermisoAdmin) {
                empleados = usuarioService.obtenerEmpleadosPorEmpresa(perfil.getEmpresaId());
                System.out.println("🔍 [DEBUG-ORGANIZACION] Empleados encontrados: " + empleados.size());
            }

            OrganizacionInfoResponse respuesta = OrganizacionInfoResponse.builder()
                    .perfil(perfil)
                    .empresa(empresa)
                    .empleados(empleados)
                    .build();

            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
