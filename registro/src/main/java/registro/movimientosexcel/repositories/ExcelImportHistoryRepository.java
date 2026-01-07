package registro.movimientosexcel.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import registro.movimientosexcel.models.ExcelImportHistory;

import java.util.List;
import java.util.UUID;

public interface ExcelImportHistoryRepository extends JpaRepository<ExcelImportHistory, Long> {
    List<ExcelImportHistory> findByUsuarioOrderByFechaImportacionDesc(UUID usuario);
}
