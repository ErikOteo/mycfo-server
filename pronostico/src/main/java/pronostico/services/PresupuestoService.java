package pronostico.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pronostico.dtos.CrearPresupuestoRequest;
import pronostico.dtos.PresupuestoDTO;
import pronostico.models.Presupuesto;
import pronostico.models.PresupuestoLinea;
import pronostico.repositories.PresupuestoLineaRepository;
import pronostico.repositories.PresupuestoRepository;
import pronostico.services.AdministracionService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PresupuestoService {

    private static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int CURRENCY_SCALE = 2;
    private static final BigDecimal ZERO_AMOUNT = BigDecimal.ZERO.setScale(CURRENCY_SCALE);
    private static final Pattern YEAR_MONTH_PATTERN = Pattern.compile("^(\\d{4})[-/](\\d{1,2})");

    private final PresupuestoRepository repo;
    private final PresupuestoLineaRepository lineaRepo;
    private final PresupuestoEventService eventService;
    private final AdministracionService administracionService;

    public enum ListStatus {
        ACTIVE,
        DELETED,
        ALL;

        public static ListStatus from(String raw) {
            if (raw == null || raw.isBlank()) {
                return ACTIVE;
            }
            return switch (raw.trim().toLowerCase(Locale.ROOT)) {
                case "deleted", "trash", "papelera" -> DELETED;
                case "all", "todos" -> ALL;
                default -> ACTIVE;
            };
        }
    }


    private static String statusKey(ListStatus status) {
        return switch (status) {
            case ACTIVE -> "active";
            case DELETED -> "deleted";
            case ALL -> "all";
        };
    }

    private void backfillOrganizacionIdsIfNeeded() {
        List<Presupuesto> pendientes = repo.findTop100ByOrganizacionIdIsNullOrderByIdAsc();
        if (pendientes.isEmpty()) {
            return;
        }
        Map<String, Long> cache = new HashMap<>();
        List<Presupuesto> actualizados = pendientes.stream()
            .peek(presupuesto -> {
                if (presupuesto.getOrganizacionId() != null) {
                    return;
                }
                String owner = presupuesto.getOwnerSub();
                try {
                    Long resolved = cache.computeIfAbsent(owner, administracionService::obtenerEmpresaIdPorUsuarioSub);
                    presupuesto.setOrganizacionId(resolved);
                } catch (RuntimeException ex) {
                    log.warn("No se pudo asignar organizacion al presupuesto {} (ownerSub={})", presupuesto.getId(), owner);
                }
            })
            .filter(p -> p.getOrganizacionId() != null)
            .collect(Collectors.toList());
        if (!actualizados.isEmpty()) {
            repo.saveAll(actualizados);
        }
    }

    public Page<PresupuestoDTO> findByRange(LocalDate from,
                                            LocalDate to,
                                            Long organizacionId,
                                            ListStatus status,
                                            Pageable pageable) {
        backfillOrganizacionIdsIfNeeded();
        if (from == null || to == null) {
            throw new IllegalArgumentException("El rango debe incluir fechas 'from' y 'to'");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("'to' no puede ser anterior a 'from'");
        }
        Pageable safePageable = pageable != null ? pageable : Pageable.unpaged();
        Page<Presupuesto> result = repo.searchByOrganizacion(organizacionId, from, to, statusKey(status), safePageable);
        return result.map(this::toDto);
    }

    public List<PresupuestoDTO> findByRange(LocalDate from, LocalDate to, Long organizacionId) {
        return findByRange(from, to, organizacionId, ListStatus.ACTIVE, Pageable.unpaged()).getContent();
    }

    public List<PresupuestoDTO> findByRange(LocalDate from, LocalDate to, Long organizacionId, ListStatus status) {
        return findByRange(from, to, organizacionId, status, Pageable.unpaged()).getContent();
    }

    public Optional<Presupuesto> obtenerPresupuestoActualParaDashboard(Long organizacionId, LocalDate hoy) {
        backfillOrganizacionIdsIfNeeded();
        LocalDate referenceDate = hoy != null ? hoy : LocalDate.now();
        return repo.findCurrentByOrganizacionId(organizacionId, referenceDate).stream().findFirst();
    }

    public Optional<PresupuestoDTO> findByIdDTO(Long id, Long organizacionId) {
        return repo.findByIdAndOrganizacionIdAndDeletedFalse(id, organizacionId).map(this::toDto);
    }

    public PresupuestoDTO getOneForOrganizacion(Long id, Long organizacionId) {
        backfillOrganizacionIdsIfNeeded();
        return toDto(mustBelongToOrganizacion(id, organizacionId, true));
    }

    public Presupuesto updateOwned(Long id, Presupuesto payload, String ownerSub, Long organizacionId) {
        Presupuesto existing = mustOwnActive(id, ownerSub, organizacionId);
        existing.setNombre(payload.getNombre());
        existing.setDesde(payload.getDesde());
        existing.setHasta(payload.getHasta());
        return repo.save(existing);
    }

    @Transactional
    public void deleteOwned(Long id, String ownerSub, Long organizacionId) {
        Presupuesto existing = mustOwnIncludingDeleted(id, ownerSub, organizacionId);
        if (existing.isDeleted()) {
            log.debug("Presupuesto {} ya estaba eliminado por {}", id, ownerSub);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        int updated = repo.markDeletedIfActive(id, organizacionId, now, ownerSub);
        if (updated == 0) {
            log.debug("Otro proceso elimino previamente el presupuesto {}", id);
            return;
        }

        existing.setDeleted(true);
        existing.setDeletedAt(now);
        existing.setDeletedBy(ownerSub);
        log.info("Presupuesto {} marcado como eliminado por {}", id, ownerSub);
        eventService.sendBudgetDeletedEvent(existing);
    }

    @Transactional
    public PresupuestoDTO restoreOwned(Long id, String ownerSub, Long organizacionId) {
        Presupuesto presupuesto = mustOwnIncludingDeleted(id, ownerSub, organizacionId);
        if (!presupuesto.isDeleted()) {
            return toDto(presupuesto);
        }
        presupuesto.setDeleted(false);
        presupuesto.setDeletedAt(null);
        presupuesto.setDeletedBy(null);
        Presupuesto restored = repo.save(presupuesto);
        log.info("Presupuesto {} restaurado por {}", id, ownerSub);
        return toDto(restored);
    }

    public Page<PresupuestoDTO> listByStatus(Long organizacionId, ListStatus status, Pageable pageable) {
        backfillOrganizacionIdsIfNeeded();
        Pageable safePageable = pageable != null ? pageable : Pageable.unpaged();
        return selectByStatus(organizacionId, status, safePageable).map(this::toDto);
    }

    public List<PresupuestoDTO> listByStatus(Long organizacionId, ListStatus status) {
        return listByStatus(organizacionId, status, Pageable.unpaged()).getContent();
    }

    public List<PresupuestoDTO> listByStatus(Long organizacionId, String status) {
        return listByStatus(organizacionId, ListStatus.from(status));
    }

    public List<PresupuestoDTO> listActive(Long organizacionId) {
        return listByStatus(organizacionId, ListStatus.ACTIVE);
    }

    public List<PresupuestoDTO> listDeleted(Long organizacionId) {
        return listByStatus(organizacionId, ListStatus.DELETED);
    }

    private Page<Presupuesto> selectByStatus(Long organizacionId, ListStatus status, Pageable pageable) {
        return switch (status) {
            case ACTIVE -> repo.findByOrganizacionIdAndDeletedFalse(organizacionId, pageable);
            case DELETED -> repo.findByOrganizacionIdAndDeletedTrue(organizacionId, pageable);
            case ALL -> repo.findByOrganizacionId(organizacionId, pageable);
        };
    }

    private Presupuesto mustOwnActive(Long id, String ownerSub, Long organizacionId) {
        Presupuesto presupuesto = mustOwnIncludingDeleted(id, ownerSub, organizacionId);
        if (presupuesto.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Presupuesto no encontrado");
        }
        return presupuesto;
    }

    public Presupuesto mustOwn(Long id, String ownerSub, Long organizacionId) {
        return mustOwnActive(id, ownerSub, organizacionId);
    }

    public Presupuesto mustOwnIncludingDeleted(Long id, String ownerSub, Long organizacionId) {
        Presupuesto presupuesto = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Presupuesto no encontrado"));

        // Si el presupuesto no tiene organizacion asignada, intentar backfill
        if (presupuesto.getOrganizacionId() == null) {
            try {
                Long resolved = administracionService.obtenerEmpresaIdPorUsuarioSub(presupuesto.getOwnerSub());
                presupuesto.setOrganizacionId(resolved);
                repo.save(presupuesto);
            } catch (RuntimeException ex) {
                log.warn("No se pudo actualizar organizacion para el presupuesto {} (ownerSub={})", presupuesto.getId(), presupuesto.getOwnerSub());
            }
        }

        // Siempre se exige pertenecer a la misma organización
        if (!Objects.equals(presupuesto.getOrganizacionId(), organizacionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }

        // A partir de aquí no se valida el rol ni el owner: cualquier usuario de la
        // misma organización puede operar sobre el presupuesto. La restricción de
        // "solo administradores" se maneja exclusivamente en el frontend.

        return presupuesto;
    }

    public Presupuesto mustBelong(Long id, Long organizacionId) {
        return mustBelongToOrganizacion(id, organizacionId, true);
    }

    public Presupuesto mustBelongIncludingDeleted(Long id, Long organizacionId) {
        return mustBelongToOrganizacion(id, organizacionId, false);
    }

    private Presupuesto mustBelongToOrganizacion(Long id, Long organizacionId, boolean enforceActive) {
        Presupuesto presupuesto = repo.findByIdAndOrganizacionId(id, organizacionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Presupuesto no encontrado"));
        if (enforceActive && presupuesto.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Presupuesto no encontrado");
        }
        return presupuesto;
    }

    private PresupuestoDTO toDto(Presupuesto p) {
        return PresupuestoDTO.builder()
            .id(p.getId())
            .nombre(p.getNombre())
            .desde(formatStoredYm(p.getDesde()))
            .hasta(formatStoredYm(p.getHasta()))
            .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().format(ISO_DATE_TIME) : null)
            .deleted(p.isDeleted())
            .deletedAt(p.getDeletedAt() != null ? p.getDeletedAt().format(ISO_DATE_TIME) : null)
            .deletedBy(p.getDeletedBy())
            .build();
    }

    private static YearMonth parseYearMonth(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("El mes '" + fieldName + "' es requerido");
        }
        String trimmed = value.trim();
        try {
            return YearMonth.parse(trimmed);
        } catch (DateTimeParseException ignored) {
        }
        if (trimmed.length() >= 7) {
            String firstSeven = trimmed.substring(0, 7);
            try {
                return YearMonth.parse(firstSeven);
            } catch (DateTimeParseException ignored) {
            }
        }
        try {
            return YearMonth.from(LocalDate.parse(trimmed));
        } catch (DateTimeParseException ignored) {
        }
        java.util.regex.Matcher matcher = YEAR_MONTH_PATTERN.matcher(trimmed);
        if (matcher.find()) {
            int year = Integer.parseInt(matcher.group(1));
            int month = Integer.parseInt(matcher.group(2));
            if (month >= 1 && month <= 12) {
                return YearMonth.of(year, month);
            }
        }
        throw new IllegalArgumentException("Formato invalido para '" + fieldName + "' (usar YYYY-MM)");
    }

    private static String formatStoredYm(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String trimmed = value.trim();
        if (trimmed.length() >= 10) {
            try {
                return LocalDate.parse(trimmed).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            } catch (Exception ignored) {
                // formato distinto, seguimos abajo
            }
        }
        return trimmed.length() > 7 ? trimmed.substring(0, 7) : trimmed;
    }

    private static String formatYearMonthForStorage(YearMonth ym, boolean endOfMonth) {
        LocalDate date = endOfMonth ? ym.atEndOfMonth() : ym.atDay(1);
        return date.toString();
    }

    private static PresupuestoLinea.Tipo mapTipo(String v) {
        if (v == null) {
            throw new IllegalArgumentException("Tipo requerido");
        }
        return switch (v.trim().toUpperCase(Locale.ROOT)) {
            case "INGRESO" -> PresupuestoLinea.Tipo.INGRESO;
            case "EGRESO" -> PresupuestoLinea.Tipo.EGRESO;
            default -> throw new IllegalArgumentException("Tipo invalido: " + v);
        };
    }

    private static BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal calculateFactor(BigDecimal porcentaje) {
        if (porcentaje == null) {
            return null;
        }
        BigDecimal rate = porcentaje.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP);
        return BigDecimal.ONE.add(rate);
    }

    private static class PlantillaData {
        private final String categoria;
        private final PresupuestoLinea.Tipo tipo;
        private final BigDecimal defaultEstimado;
        private final BigDecimal defaultReal;
        private final Map<YearMonth, MesValor> valoresPorMes = new HashMap<>();
        private final BigDecimal factor;
        private BigDecimal pendingAmount;

        private PlantillaData(CrearPresupuestoRequest.PlantillaLinea linea) {
            this.categoria = (linea.getCategoria() != null && !linea.getCategoria().trim().isEmpty())
                ? linea.getCategoria().trim()
                : "Sin categoria";
            this.tipo = mapTipo(linea.getTipo());
            this.defaultEstimado = scale(linea.getMontoEstimado());
            this.defaultReal = scale(linea.getMontoReal());
            this.factor = calculateFactor(linea.getPorcentajeMensual());
            if (this.factor != null) {
                this.pendingAmount = this.defaultEstimado != null ? this.defaultEstimado : ZERO_AMOUNT;
            } else {
                this.pendingAmount = this.defaultEstimado;
            }
            if (linea.getMeses() != null) {
                for (CrearPresupuestoRequest.PlantillaMes mes : linea.getMeses()) {
                    if (mes == null || mes.getMes() == null || mes.getMes().isBlank()) {
                        continue;
                    }
                    try {
                        YearMonth ym = parseYearMonth(mes.getMes(), "mes");
                        valoresPorMes.put(ym, new MesValor(scale(mes.getMontoEstimado()), scale(mes.getMontoReal())));
                    } catch (IllegalArgumentException ex) {
                        log.debug("Mes de plantilla ignorado por formato invalido: {}", mes.getMes());
                    }
                }
            }
        }

        String getCategoria() {
            return categoria;
        }

        PresupuestoLinea.Tipo getTipo() {
            return tipo;
        }

        MesValor valorPara(YearMonth ym) {
            MesValor override = valoresPorMes.get(ym);
            BigDecimal estimado;

            if (override != null && override.estimado != null) {
                estimado = override.estimado;
                if (factor != null) {
                    pendingAmount = estimado.multiply(factor).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
                }
            } else if (factor != null) {
                BigDecimal base = pendingAmount;
                if (base == null) {
                    base = defaultEstimado != null ? defaultEstimado : ZERO_AMOUNT;
                    pendingAmount = base;
                }
                estimado = base;
                pendingAmount = estimado.multiply(factor).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
            } else if (defaultEstimado != null) {
                estimado = defaultEstimado;
            } else {
                estimado = ZERO_AMOUNT;
            }

            BigDecimal real;
            if (override != null && override.real != null) {
                real = override.real;
            } else {
                real = defaultReal;
            }
            return new MesValor(estimado, real);
        }
    }

    private static class MesValor {
        private final BigDecimal estimado;
        private final BigDecimal real;

        private MesValor(BigDecimal estimado, BigDecimal real) {
            this.estimado = estimado;
            this.real = real;
        }

        BigDecimal getEstimado() {
            return estimado;
        }

        BigDecimal getReal() {
            return real;
        }
    }

    @Transactional
    public Presupuesto crearPresupuesto(CrearPresupuestoRequest req, Long organizacionId, String ownerSub) {
        return crearPresupuesto(req, organizacionId, ownerSub, null);
    }

    @Transactional
    public Presupuesto crearPresupuesto(CrearPresupuestoRequest req, Long organizacionId, String ownerSub, String authorization) {
        YearMonth desde = parseYearMonth(req.getDesde(), "desde");
        YearMonth hasta = parseYearMonth(req.getHasta(), "hasta");
        if (hasta.isBefore(desde)) {
            throw new IllegalArgumentException("'hasta' no puede ser anterior a 'desde'");
        }

        Presupuesto presupuesto = Presupuesto.builder()
            .organizacionId(organizacionId)
            .ownerSub(ownerSub)
            .nombre(req.getNombre())
            .desde(formatYearMonthForStorage(desde, false))
            .hasta(formatYearMonthForStorage(hasta, true))
            .build();
        try {
            repo.save(presupuesto);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un presupuesto con el mismo nombre y periodo para esta organizacion",
                ex
            );
        }

        List<CrearPresupuestoRequest.PlantillaLinea> plantillaReq = req.getPlantilla();

        if (plantillaReq != null && !plantillaReq.isEmpty()) {
            List<PlantillaData> plantillas = plantillaReq.stream()
                .map(PlantillaData::new)
                .collect(Collectors.toList());

            YearMonth cursor = desde;
            while (!cursor.isAfter(hasta)) {
                String ym = formatYearMonthForStorage(cursor, false);
                for (PlantillaData data : plantillas) {
                    MesValor valor = data.valorPara(cursor);
                    BigDecimal estimado = valor.getEstimado();
                    BigDecimal real = valor.getReal();
                    log.debug("Guardando linea '{}' tipo {} mes {} estimado={} real={}",
                        data.getCategoria(), data.getTipo(), ym, estimado, real);
                    PresupuestoLinea linea = PresupuestoLinea.builder()
                        .presupuesto(presupuesto)
                        .mes(ym)
                        .categoria(data.getCategoria())
                        .tipo(data.getTipo())
                        .montoEstimado(estimado)
                        .montoReal(real)
                        .sourceType(PresupuestoLinea.SourceType.MANUAL)
                        .build();
                    lineaRepo.save(linea);
                }
                cursor = cursor.plusMonths(1);
            }
        } else if (req.isAutogenerarCeros()) {
            YearMonth cursor = desde;
            while (!cursor.isAfter(hasta)) {
                String ym = formatYearMonthForStorage(cursor, false);
                for (PresupuestoLinea.Tipo tipo : PresupuestoLinea.Tipo.values()) {
                    PresupuestoLinea linea = PresupuestoLinea.builder()
                        .presupuesto(presupuesto)
                        .mes(ym)
                        .categoria("Sin categoria")
                        .tipo(tipo)
                        .montoEstimado(ZERO_AMOUNT)
                        .montoReal(null)
                        .sourceType(PresupuestoLinea.SourceType.MANUAL)
                        .build();
                    lineaRepo.save(linea);
                }
                cursor = cursor.plusMonths(1);
            }
        }

        eventService.sendBudgetCreatedEvent(presupuesto);
        return presupuesto;
    }
}
