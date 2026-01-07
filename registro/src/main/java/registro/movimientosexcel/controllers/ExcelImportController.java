package registro.movimientosexcel.controllers;

import registro.cargarDatos.models.TipoMovimiento;
import registro.movimientosexcel.dtos.*;
import registro.movimientosexcel.services.CategorySuggestionService;
import registro.movimientosexcel.services.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ExcelImportController {

    @Autowired
    private ExcelImportService excelImportService;
    
    @Autowired
    private CategorySuggestionService categorySuggestionService;

    @PostMapping("/importar-excel")
    public ResponseEntity<ResumenCargaDTO> importarExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoOrigen") String tipoOrigen,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        ResumenCargaDTO resultado = excelImportService.procesarArchivo(file, tipoOrigen, usuarioSub);
        return ResponseEntity.ok(resultado);
    }
    
    @PostMapping("/preview-excel")
    public ResponseEntity<PreviewDataDTO> previewExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoOrigen") String tipoOrigen,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        PreviewDataDTO resultado = excelImportService.procesarArchivoParaPreview(file, tipoOrigen, usuarioSub);
        return ResponseEntity.ok(resultado);
    }
    
    @PostMapping("/guardar-seleccionados")
    public ResponseEntity<ResumenCargaDTO> guardarSeleccionados(
            @RequestBody SaveSelectedRequestDTO request,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        ResumenCargaDTO resultado = excelImportService.guardarRegistrosSeleccionados(request, usuarioSub);
        return ResponseEntity.ok(resultado);
    }
    
    @GetMapping("/historial-cargas")
    public ResponseEntity<java.util.List<registro.movimientosexcel.models.ExcelImportHistory>> obtenerHistorialCargas(
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        
        java.util.List<registro.movimientosexcel.models.ExcelImportHistory> historial = 
            excelImportService.obtenerHistorialCargas(usuarioSub);
        return ResponseEntity.ok(historial);
    }
    
    /**
     * Obtiene las categorías disponibles según el tipo de registro
     */
    @GetMapping("/categorias")
    public ResponseEntity<List<String>> obtenerCategorias(
            @RequestParam(required = false) String tipo) {
        
        List<String> categorias;
        if (tipo != null && !tipo.isEmpty()) {
            try {
                TipoMovimiento tipoRegistro = TipoMovimiento.valueOf(tipo);
                categorias = categorySuggestionService.obtenerCategorias(tipoRegistro);
            } catch (IllegalArgumentException e) {
                categorias = categorySuggestionService.obtenerTodasLasCategorias();
            }
        } else {
            categorias = categorySuggestionService.obtenerTodasLasCategorias();
        }
        
        return ResponseEntity.ok(categorias);
    }
}
