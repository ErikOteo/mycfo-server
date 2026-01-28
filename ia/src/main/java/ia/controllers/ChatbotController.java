package ia.controllers;

import ia.services.ChatbotVertexService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/")
public class ChatbotController {

    private final ChatbotVertexService chatbotVertexService;

    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> chat(@RequestBody ChatRequest request) {
        ChatbotVertexService.ChatbotResult result = chatbotVertexService.chat(
                request != null ? request.message() : null,
                request != null ? request.module() : null,
                request != null ? request.context() : null);
        return Map.of(
                "response", result.responseText(),
                "raw", result.rawText());
    }

    public record ChatRequest(String message, String module, Map<String, Object> context) {
    }
}
