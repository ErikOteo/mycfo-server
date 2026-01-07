package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import registro.cargarDatos.dtos.DocumentoComercialResponseDTO;
import registro.cargarDatos.models.DocumentoComercial;
import registro.cargarDatos.repositories.FacturaRepository;
import registro.cargarDatos.repositories.PagareRepository;
import registro.cargarDatos.repositories.ReciboRepository;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/documentos-comerciales")
@RequiredArgsConstructor
public class DocumentoComercialController {

    private final FacturaRepository facturaRepository;
    private final ReciboRepository reciboRepository;
    private final PagareRepository pagareRepository;

    @GetMapping
    public List<DocumentoComercialResponseDTO> listarDocumentosComerciales() {
        List<DocumentoComercial> todos = new ArrayList<>();
        todos.addAll(facturaRepository.findAll());
        todos.addAll(reciboRepository.findAll());
        todos.addAll(pagareRepository.findAll());

        List<DocumentoComercialResponseDTO> respuesta = new ArrayList<>();
        for (DocumentoComercial d : todos) {
            respuesta.add(new DocumentoComercialResponseDTO(
                    d.getIdDocumento(),
                    d.getTipoDocumento(),
                    d.getCategoria(),
                    d.getMontoTotal(),
                    d.getFechaEmision() != null ? d.getFechaEmision().toLocalDate() : null
            ));
        }
        return respuesta;
    }
}
