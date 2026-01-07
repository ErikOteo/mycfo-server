package notificacion.controllers;

import jakarta.validation.Valid;
import notificacion.dtos.*;
import notificacion.services.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping("/movements")
    public ResponseEntity<Void> onMovement(@RequestBody MovementCreatedEvent evt) {
        eventService.handleMovementCreated(evt);
        return ResponseEntity.accepted().build(); // 202
    }

    @PostMapping("/budget-created")
    public ResponseEntity<Void> onBudgetCreated(@RequestBody @Valid BudgetCreatedEvent evt) {
        eventService.handleBudgetCreated(evt);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/budget-deleted")
    public ResponseEntity<Void> onBudgetDeleted(@RequestBody @Valid BudgetDeletedEvent evt) {
        eventService.handleBudgetDeleted(evt);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/budget-exceeded")
    public ResponseEntity<Void> onBudgetExceeded(@RequestBody BudgetExceededEvent evt) {
        eventService.handleBudgetExceeded(evt);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/report-generated")
    public ResponseEntity<Void> onReportGenerated(@RequestBody ReportGeneratedEvent evt) {
        eventService.handleReportGenerated(evt);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/cashflow-alert")
    public ResponseEntity<Void> onCashFlowAlert(@RequestBody CashFlowAlertEvent evt) {
        eventService.handleCashFlowAlert(evt);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/custom-reminder")
    public ResponseEntity<Void> onCustomReminder(@RequestBody CustomReminderEvent evt) {
        eventService.handleCustomReminder(evt);
        return ResponseEntity.accepted().build();
    }
}

