package pronostico.schedulers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pronostico.repositories.PresupuestoDetalleRepository;
import pronostico.repositories.PresupuestoLineaRepository;
import pronostico.repositories.PresupuestoMesCategoriaRepository;
import pronostico.repositories.PresupuestoRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class PresupuestoCleanupScheduler {

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoLineaRepository lineaRepository;
    private final PresupuestoDetalleRepository detalleRepository;
    private final PresupuestoMesCategoriaRepository mesCategoriaRepository;

    @Value("${presupuesto.retention.days:${PRESUPUESTO_RETENTION_DAYS:90}}")
    private int retentionDays;

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeSoftDeletedPresupuestos() {
        if (retentionDays <= 0) {
            log.debug("Retención configurada en {} días, omitiendo purga", retentionDays);
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        List<Long> ids = presupuestoRepository.findIdsDeletedBefore(cutoff);
        if (ids.isEmpty()) {
            return;
        }
        log.info("Purgando {} presupuestos eliminados antes de {}", ids.size(), cutoff);
        mesCategoriaRepository.deleteByPresupuestoIds(ids);
        detalleRepository.deleteByPresupuestoIds(ids);
        lineaRepository.deleteByPresupuestoIds(ids);
        presupuestoRepository.deleteAllByIdInBatch(ids);
    }
}
