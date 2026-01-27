package ia.controllers;

import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.model.chat.ChatLanguageModel;
import ia.services.ChatbotService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*") // Permitir peticiones desde el frontend (localhost:3000)
public class ChatController {

    private final ChatAssistant chatAssistant;

    public ChatController(ChatLanguageModel chatLanguageModel, ChatbotService chatbotService) {
        this.chatAssistant = AiServices.builder(ChatAssistant.class)
                .chatLanguageModel(chatLanguageModel)
                .contentRetriever(chatbotService.getContentRetriever())
                .build();
    }

    @PostMapping
    public Map<String, String> chat(@RequestBody Map<String, String> payload) {
        String userMessage = payload.get("message");
        String module = payload.get("module");

        String response = chatAssistant.chat(module, userMessage);

        return Map.of("response", response);
    }

    interface ChatAssistant {
        @SystemMessage("Eres un asistente experto en la aplicación MyCFO. " +
                "El usuario está navegando en el módulo: {{module}}. " +
                "Responde a sus preguntas basándote EXCLUSIVAMENTE en la siguiente información proporcionada. " +
                "Si la información no está en el contexto, di amablemente que no tienes esa información en el manual.")
        String chat(@V("module") String module, @UserMessage String userMessage);
    }
}
