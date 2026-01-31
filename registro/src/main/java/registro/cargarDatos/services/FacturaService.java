package registro.cargarDatos.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import registro.cargarDatos.models.EstadoDocumentoComercial;
import registro.cargarDatos.models.EstadoPago;
import registro.cargarDatos.models.Factura;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.repositories.FacturaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final EmpresaDataService empresaDataService;

    /**
     * Guarda una nueva factura
     */
    @Transactional
    public Factura guardarFactura(Factura factura) {
        // Establecer fecha de creación
        factura.setFechaCreacion(LocalDateTime.now());
        factura.setFechaActualizacion(LocalDateTime.now());
        
        // Cargar datos de la empresa automáticamente si hay usuarioId
        if (factura.getUsuarioId() != null && !factura.getUsuarioId().isEmpty()) {
            empresaDataService.cargarDatosEmpresaEnFactura(factura, factura.getUsuarioId());
        }
        
        // Setear estado de documento comercial inicial
        if (factura.getEstadoDocumentoComercial() == null) {
            factura.setEstadoDocumentoComercial(EstadoDocumentoComercial.PagoPendiente);
        }
        
        // Setear estado de pago inicial
        if (factura.getEstadoPago() == null) {
            factura.setEstadoPago(EstadoPago.NO_PAGADO);
        }
        
        return facturaRepository.save(factura);
    }

    /**
     * Obtiene una factura por ID
     */
    public Factura obtenerFactura(Long id) {
        return facturaRepository.findById(id).orElse(null);
    }

    /**
     * Lista todas las facturas
     */
    public List<Factura> listarFacturas() {
        return facturaRepository.findAll();
    }

    /**
     * Lista facturas por organización
     */
    public List<Factura> listarPorOrganizacion(Long organizacionId) {
        return facturaRepository.findByOrganizacionId(organizacionId);
    }

    /**
     * Lista facturas por usuario
     */
    public List<Factura> listarPorUsuario(String usuarioId) {
        return facturaRepository.findByUsuarioId(usuarioId);
    }

    public org.springframework.data.domain.Page<Factura> listarPaginadasPorOrganizacion(Long organizacionId,
                                                                                       org.springframework.data.domain.Pageable pageable) {
        return listarPaginadasPorOrganizacion(organizacionId, null, pageable);
    }

    public org.springframework.data.domain.Page<Factura> listarPaginadasPorOrganizacion(Long organizacionId,
                                                                                       TipoMoneda moneda,
                                                                                       org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Factura> page = (moneda == null)
                ? facturaRepository.findByOrganizacionId(organizacionId, pageable)
                : facturaRepository.buscarFacturas(
                        organizacionId,
                        null,
                        null,
                        null,
                        null,
                        null,
                        moneda,
                        null,
                        null,
                        null,
                        null,
                        pageable
                );

        if (moneda == null) {
            return page;
        }

        // Salvaguarda adicional en caso de que el filtro JPA no se aplique (compatibilidad con despliegues previos)
        java.util.List<Factura> filtradas = page.getContent().stream()
                .filter(f -> moneda.equals(f.getMoneda()))
                .collect(java.util.stream.Collectors.toList());
        // ajustar el total al filtrado para que la paginación coincida
        return new org.springframework.data.domain.PageImpl<>(filtradas, pageable, filtradas.size());
    }

    /**
     * Busca factura por número de documento
     */
    public List<Factura> buscarPorNumeroDocumento(String numeroDocumento) {
        return facturaRepository.findByNumeroDocumento(numeroDocumento);
    }

    /**
     * Actualiza una factura existente
     */
    @Transactional
    public Factura actualizarFactura(Long id, Factura datosActualizados) {
        Optional<Factura> optional = facturaRepository.findById(id);

        if (optional.isEmpty()) {
            throw new RuntimeException("Factura no encontrada con id " + id);
        }

        Factura factura = optional.get();

        // Actualizar campos comunes de documento comercial
        factura.setNumeroDocumento(datosActualizados.getNumeroDocumento());
        factura.setFechaEmision(datosActualizados.getFechaEmision());
        factura.setMontoTotal(datosActualizados.getMontoTotal());
        factura.setMoneda(datosActualizados.getMoneda());
        factura.setCategoria(datosActualizados.getCategoria());
        factura.setEstadoDocumentoComercial(datosActualizados.getEstadoDocumentoComercial());

        // Actualizar campos específicos de factura
        factura.setTipoFactura(datosActualizados.getTipoFactura());
        factura.setVendedorNombre(datosActualizados.getVendedorNombre());
        factura.setVendedorCuit(datosActualizados.getVendedorCuit());
        factura.setVendedorCondicionIVA(datosActualizados.getVendedorCondicionIVA());
        factura.setVendedorDomicilio(datosActualizados.getVendedorDomicilio());
        factura.setCompradorNombre(datosActualizados.getCompradorNombre());
        factura.setCompradorCuit(datosActualizados.getCompradorCuit());
        factura.setCompradorCondicionIVA(datosActualizados.getCompradorCondicionIVA());
        factura.setCompradorDomicilio(datosActualizados.getCompradorDomicilio());
        factura.setEstadoPago(datosActualizados.getEstadoPago());

        factura.setFechaActualizacion(LocalDateTime.now());

        return facturaRepository.save(factura);
    }

    /**
     * Elimina una factura
     */
    @Transactional
    public void eliminarFactura(Long id) {
        facturaRepository.deleteById(id);
    }

    public org.springframework.data.domain.Page<Factura> buscarFacturas(
            Long organizacionId,
            String usuarioId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta,
            String tipoFactura,
            EstadoPago estadoPago,
            TipoMoneda moneda,
            Double montoMin,
            Double montoMax,
            org.springframework.data.domain.Pageable pageable
    ) {
        return buscarFacturas(organizacionId, usuarioId, fechaDesde, fechaHasta, tipoFactura, estadoPago, moneda, montoMin, montoMax, null, null, pageable);
    }

    public List<Factura> buscarFacturas(
            Long organizacionId,
            String usuarioId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta,
            String tipoFactura,
            EstadoPago estadoPago,
            TipoMoneda moneda,
            Double montoMin,
            Double montoMax
    ) {
        return buscarFacturas(organizacionId, usuarioId, fechaDesde, fechaHasta, tipoFactura, estadoPago, moneda, montoMin, montoMax, null, null);
    }

    public List<Factura> buscarFacturas(
            Long organizacionId,
            String usuarioId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta,
            String tipoFactura,
            EstadoPago estadoPago,
            String search,
            java.time.LocalDate searchDate
    ) {
        return buscarFacturas(organizacionId, usuarioId, fechaDesde, fechaHasta, tipoFactura, estadoPago, null, null, null, search, searchDate);
    }

    public List<Factura> buscarFacturas(
            Long organizacionId,
            String usuarioId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta,
            String tipoFactura,
            EstadoPago estadoPago,
            TipoMoneda moneda,
            Double montoMin,
            Double montoMax,
            String search,
            java.time.LocalDate searchDate
    ) {
        java.time.LocalDateTime desde = fechaDesde != null ? fechaDesde.atStartOfDay() : null;
        java.time.LocalDateTime hasta = fechaHasta != null ? fechaHasta.plusDays(1).atStartOfDay().minusNanos(1) : null;

        java.util.List<Factura> result = facturaRepository.buscarFacturas(
                organizacionId,
                usuarioId,
                desde,
                hasta,
                tipoFactura,
                estadoPago,
                moneda,
                montoMin,
                montoMax,
                search,
                searchDate
        );

        if (moneda == null) {
            return result;
        }

        // Salvaguarda por si el filtro no se aplicó a nivel query
        return result.stream()
                .filter(f -> moneda.equals(f.getMoneda()))
                .collect(java.util.stream.Collectors.toList());
    }

    public org.springframework.data.domain.Page<Factura> buscarFacturas(
            Long organizacionId,
            String usuarioId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta,
            String tipoFactura,
            EstadoPago estadoPago,
            TipoMoneda moneda,
            Double montoMin,
            Double montoMax,
            String search,
            java.time.LocalDate searchDate,
            org.springframework.data.domain.Pageable pageable
    ) {
        java.time.LocalDateTime desde = fechaDesde != null ? fechaDesde.atStartOfDay() : null;
        java.time.LocalDateTime hasta = fechaHasta != null ? fechaHasta.plusDays(1).atStartOfDay().minusNanos(1) : null;

        org.springframework.data.domain.Page<Factura> page = facturaRepository.buscarFacturas(
                organizacionId,
                usuarioId,
                desde,
                hasta,
                tipoFactura,
                estadoPago,
                moneda,
                montoMin,
                montoMax,
                search,
                searchDate,
                pageable
        );

        if (moneda == null) {
            return page;
        }

        java.util.List<Factura> filtradas = page.getContent().stream()
                .filter(f -> moneda.equals(f.getMoneda()))
                .collect(java.util.stream.Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(filtradas, pageable, filtradas.size());
    }

    public Map<java.time.YearMonth, List<Factura>> agruparFacturasPorMes(
            Long organizacionId,
            java.time.LocalDate fechaDesde,
            java.time.LocalDate fechaHasta
    ) {
        return buscarFacturas(organizacionId, null, fechaDesde, fechaHasta, null, null, null, null, null, null, null).stream()
                .collect(Collectors.groupingBy(
                        factura -> java.time.YearMonth.from(factura.getFechaEmision() != null
                                ? factura.getFechaEmision()
                                : java.time.LocalDate.now())
                ));
    }
}
