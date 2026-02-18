package registro.cargarDatos.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Locale;

@Service
public class DocumentoConversionService {

    public String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        String lower = filename != null ? filename.toLowerCase(Locale.ROOT) : "";

        if (isPdf(contentType, lower)) {
            return extractPdfText(file);
        }
        if (isDocx(contentType, lower)) {
            return extractDocxText(file);
        }
        if (isDoc(contentType, lower)) {
            return extractDocText(file);
        }
        throw new IllegalArgumentException("Tipo de archivo no soportado. Solo PDF/DOC/DOCX.");
    }

    private boolean isPdf(String contentType, String lowerName) {
        return "application/pdf".equalsIgnoreCase(contentType) || lowerName.endsWith(".pdf");
    }

    private boolean isDocx(String contentType, String lowerName) {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equalsIgnoreCase(contentType)
                || lowerName.endsWith(".docx");
    }

    private boolean isDoc(String contentType, String lowerName) {
        return "application/msword".equalsIgnoreCase(contentType) || lowerName.endsWith(".doc");
    }

    private String extractDocxText(MultipartFile file) {
        try (InputStream input = file.getInputStream();
             XWPFDocument docx = new XWPFDocument(input);
             XWPFWordExtractor extractor = new XWPFWordExtractor(docx)) {
            return extractor.getText();
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer DOCX.", ex);
        }
    }

    private String extractDocText(MultipartFile file) {
        try (InputStream input = file.getInputStream();
             HWPFDocument doc = new HWPFDocument(input);
             WordExtractor extractor = new WordExtractor(doc)) {
            return extractor.getText();
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer DOC.", ex);
        }
    }

    private String extractPdfText(MultipartFile file) {
        try (InputStream input = file.getInputStream();
             PDDocument pdf = PDDocument.load(input)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(pdf);
            return StringUtils.hasText(text) ? text : "";
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer PDF.", ex);
        }
    }
}
