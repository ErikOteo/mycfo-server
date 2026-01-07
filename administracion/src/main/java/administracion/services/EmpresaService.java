package administracion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import administracion.dtos.EmpresaDTO;
import administracion.models.Empresa;
import administracion.models.Usuario;
import administracion.repositories.EmpresaRepository;
import administracion.repositories.UsuarioRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;

    public EmpresaDTO obtenerEmpresa(Long id) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return convertirADTO(empresa);
    }

    public EmpresaDTO crearEmpresa(EmpresaDTO empresaDTO) {
        Empresa empresa = new Empresa();
        empresa.setNombre(empresaDTO.getNombre());
        empresa.setDescripcion(empresaDTO.getDescripcion());
        empresa.setCuit(empresaDTO.getCuit());
        empresa.setCondicionIVA(empresaDTO.getCondicionIVA());
        empresa.setDomicilio(empresaDTO.getDomicilio());
        
        Empresa guardada = empresaRepository.save(empresa);
        return convertirADTO(guardada);
    }

    public EmpresaDTO actualizarEmpresa(Long id, EmpresaDTO empresaDTO) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        empresa.setNombre(empresaDTO.getNombre());
        empresa.setDescripcion(empresaDTO.getDescripcion());
        empresa.setCuit(empresaDTO.getCuit());
        empresa.setCondicionIVA(empresaDTO.getCondicionIVA());
        empresa.setDomicilio(empresaDTO.getDomicilio());
        
        Empresa actualizada = empresaRepository.save(empresa);
        return convertirADTO(actualizada);
    }

    public List<EmpresaDTO> listarEmpresas() {
        return empresaRepository.findAll().stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene la empresa del usuario por su sub (Cognito)
     * Usado por otros microservicios para obtener el ID de empresa automáticamente
     */
    public EmpresaDTO obtenerEmpresaPorUsuarioSub(String sub) {
        Usuario usuario = usuarioRepository.findBySub(sub)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con sub: " + sub));
        
        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene una empresa asociada");
        }
        
        return convertirADTO(usuario.getEmpresa());
    }

    /**
     * Obtiene solo el ID de empresa del usuario por su sub
     * Optimizado para llamadas rápidas desde otros microservicios
     */
    public Long obtenerEmpresaIdPorUsuarioSub(String sub) {
        System.out.println("🔍 [EMPRESA-SERVICE] Buscando usuario con sub: " + sub);
        
        Usuario usuario = usuarioRepository.findBySub(sub)
                .orElseThrow(() -> {
                    System.out.println("❌ [EMPRESA-SERVICE] Usuario no encontrado con sub: " + sub);
                    return new RuntimeException("Usuario no encontrado con sub: " + sub);
                });
        
        System.out.println("✅ [EMPRESA-SERVICE] Usuario encontrado: " + usuario.getNombre() + " (" + usuario.getEmail() + ")");
        
        if (usuario.getEmpresa() == null) {
            System.out.println("❌ [EMPRESA-SERVICE] Usuario sin empresa asociada: " + sub);
            throw new RuntimeException("El usuario no tiene una empresa asociada");
        }
        
        System.out.println("✅ [EMPRESA-SERVICE] Empresa encontrada: " + usuario.getEmpresa().getNombre() + " (ID: " + usuario.getEmpresa().getId() + ")");
        return usuario.getEmpresa().getId();
    }

    /**
     * Obtiene solo el nombre de empresa del usuario por su sub
     * Optimizado para llamadas rápidas desde otros microservicios
     */
    public String obtenerNombreEmpresaPorUsuario(String sub) {
        Usuario usuario = usuarioRepository.findBySub(sub)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con sub: " + sub));
        
        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene una empresa asociada");
        }
        
        return usuario.getEmpresa().getNombre();
    }

    public List<Usuario> listarTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    private EmpresaDTO convertirADTO(Empresa empresa) {
        EmpresaDTO dto = new EmpresaDTO();
        dto.setId(empresa.getId());
        dto.setNombre(empresa.getNombre());
        dto.setDescripcion(empresa.getDescripcion());
        dto.setCuit(empresa.getCuit());
        dto.setCondicionIVA(empresa.getCondicionIVA());
        dto.setDomicilio(empresa.getDomicilio());
        return dto;
    }
}
