package administracion.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import administracion.models.Usuario;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    
    Optional<Usuario> findByEmail(String email);
    
    List<Usuario> findByEmpresaId(Long empresaId);
    
    Optional<Usuario> findBySub(String sub);
    
    long countByEmpresa(administracion.models.Empresa empresa);
}
