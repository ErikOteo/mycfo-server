package ia.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import ia.config.VertexAiProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class ChatbotVertexServiceTest {

    private ChatbotVertexService service;

    @BeforeEach
    void setUp() {
        VertexAiProperties properties = new VertexAiProperties();
        properties.setProjectId("test-project");
        properties.setLocation("us-central1");
        properties.setModel("test-model");
        ObjectMapper mapper = new ObjectMapper();
        DataRetrievalService dataRetrievalService = mock(DataRetrievalService.class);
        service = new ChatbotVertexService(properties, mapper, dataRetrievalService);
    }

    private boolean isDateQuestion(String message) {
        return (boolean) ReflectionTestUtils.invokeMethod(service, "isDateQuestion", message);
    }

    private boolean isAmbiguousTemporal(String message) {
        return (boolean) ReflectionTestUtils.invokeMethod(service, "isAmbiguousTemporal", message);
    }

    private boolean needsPeriodClarification(String message) {
        return (boolean) ReflectionTestUtils.invokeMethod(service, "needsPeriodClarification", message);
    }

    private boolean hasMultipleDataIntents(String message) {
        return (boolean) ReflectionTestUtils.invokeMethod(service, "hasMultipleDataIntents", message);
    }

    private Object parseToolCall(String raw) {
        return ReflectionTestUtils.invokeMethod(service, "parseToolCall", raw);
    }

    private String toolCallName(Object toolCall) throws Exception {
        return (String) toolCall.getClass().getDeclaredMethod("name").invoke(toolCall);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toolCallParams(Object toolCall) throws Exception {
        return (Map<String, Object>) toolCall.getClass().getDeclaredMethod("params").invoke(toolCall);
    }

    @Nested
    @DisplayName("isDateQuestion")
    class DateQuestionTests {

        @ParameterizedTest
        @ValueSource(strings = {
                "que fecha es?",
                "que$$ fecha es",
                "que fecha es hoy?",
                "que dia es",
                "en que fecha estamos?",
                "en que dia estamos",
                "que hora es?",
                "hora actual",
                "fecha actual",
                "fecha de hoy",
                "dia de hoy",
                "fecha",
                "hora"
        })
        void detectsExplicitDateQuestions(String message) {
            assertTrue(isDateQuestion(message), () -> "Expected date question for: " + message);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "hoy",
                "ahora",
                "en este momento",
                "lo de hoy",
                "lo de ahora",
                "hoy que tengo"
        })
        void doesNotTreatAmbiguousTemporalAsDate(String message) {
            assertFalse(isDateQuestion(message), () -> "Should not treat as date question: " + message);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "hay alguna factura que se venza hoy?",
                "que facturas vencen hoy?",
                "cuanta plata tengo hoy?",
                "cuanto dinero tengo ahora?",
                "que presupuestos tengo hoy?",
                "movimientos de hoy",
                "ingresos de hoy",
                "egresos en este momento",
                "que ingresos tuve el dia de hoy?",
                "estado de resultados hoy",
                "que pagos vencen ahora?"
        })
        void ignoresTemporalWordsInsideDataRequests(String message) {
            assertFalse(isDateQuestion(message), () -> "Should not treat as date question: " + message);
        }
    }

    @Nested
    @DisplayName("Ambiguity and periods")
    class AmbiguityTests {

        @ParameterizedTest
        @ValueSource(strings = {
                "hoy",
                "ahora",
                "en este momento",
                "lo de hoy",
                "quiero saber lo de ahora",
                "hoy que tengo"
        })
        void detectsAmbiguousTemporal(String message) {
            assertTrue(isAmbiguousTemporal(message), () -> "Expected ambiguous temporal for: " + message);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "ingresos del ultimo mes",
                "pagos del trimestre pasado",
                "movimientos de la semana pasada",
                "dato del mes"
        })
        void asksForPeriodClarification(String message) {
            assertTrue(needsPeriodClarification(message), () -> "Expected period clarification for: " + message);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "saldo y movimientos recientes",
                "presupuesto y movimientos",
                "facturas y conciliacion"
        })
        void detectsMultipleIntents(String message) {
            assertTrue(hasMultipleDataIntents(message), () -> "Expected multiple intents for: " + message);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "flujo de caja hoy",
                "movimientos sin conciliar",
                "hay pendientes hoy"
        })
        void avoidsFalseMultipleIntent(String message) {
            assertFalse(hasMultipleDataIntents(message), () -> "Should not flag multiple intents for: " + message);
        }
    }

    @Nested
    @DisplayName("parseToolCall")
    class ToolCallTests {

        @Test
        void parsesToolCallWithUnderscore() throws Exception {
            Object toolCall = parseToolCall("@@CALL_TOOL:GET_BALANCE@@");
            assertNotNull(toolCall);
            assertEquals("GET_BALANCE", toolCallName(toolCall));
        }

        @Test
        void parsesToolCallWithoutUnderscore() throws Exception {
            Object toolCall = parseToolCall("@@CALLTOOL:GETBALANCE@@");
            assertNotNull(toolCall);
            assertEquals("GET_BALANCE", toolCallName(toolCall));
        }

        @Test
        void parsesToolCallLowercaseAndCodeFence() throws Exception {
            Object toolCall = parseToolCall("```@@calltool:getbalance@@```");
            assertNotNull(toolCall);
            assertEquals("GET_BALANCE", toolCallName(toolCall));
        }

        @Test
        void parsesToolCallWithTextAround() throws Exception {
            Object toolCall = parseToolCall("Claro, @@CALLTOOL:GETBALANCE@@ gracias");
            assertNotNull(toolCall);
            assertEquals("GET_BALANCE", toolCallName(toolCall));
        }

        @Test
        void parsesLooseToolCallWithoutDelimiters() throws Exception {
            Object toolCall = parseToolCall("CALLTOOL:GETBALANCE");
            assertNotNull(toolCall);
            assertEquals("GET_BALANCE", toolCallName(toolCall));
        }

        @Test
        void parsesToolCallWithParams() throws Exception {
            Object toolCall = parseToolCall("@@CALLTOOL:SEARCHMOVEMENTS {\"mes\":1,\"anio\":2025}@@");
            assertNotNull(toolCall);
            assertEquals("SEARCH_MOVEMENTS", toolCallName(toolCall));
            Map<String, Object> params = toolCallParams(toolCall);
            assertEquals(1, params.get("mes"));
            assertEquals(2025, params.get("anio"));
        }

        @Test
        void returnsNullWhenNoToolCall() {
            assertNull(parseToolCall("no hay tool call"));
        }
    }
}
