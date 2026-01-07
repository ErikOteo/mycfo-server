package notificacion.controllers;

import notificacion.models.CustomReminder;
import notificacion.services.AdministracionService;
import notificacion.services.CustomReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/reminders")
public class CustomReminderController {

    private final CustomReminderService reminderService;
    private final AdministracionService administracionService;

    public CustomReminderController(CustomReminderService reminderService,
                                    AdministracionService administracionService) {
        this.reminderService = reminderService;
        this.administracionService = administracionService;
    }

    @GetMapping
    public ResponseEntity<List<CustomReminder>> getUserReminders(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        List<CustomReminder> reminders = reminderService.getUserReminders(empresaId, usuarioSub);
        return ResponseEntity.ok(reminders);
    }

    @PostMapping
    public ResponseEntity<CustomReminder> createReminder(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody CreateReminderRequest request) {

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        CustomReminder reminder = reminderService.createReminder(
            empresaId,
            usuarioSub,
            request.title(),
            request.message(),
            request.scheduledFor(),
            request.isRecurring(),
            request.recurrencePattern()
        );

        return ResponseEntity.ok(reminder);
    }

    @GetMapping("/{reminderId}")
    public ResponseEntity<CustomReminder> getReminder(
            @PathVariable String userId,
            @PathVariable Long reminderId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        CustomReminder reminder = reminderService.getReminder(empresaId, usuarioSub, reminderId);
        return ResponseEntity.ok(reminder);
    }

    @PutMapping("/{reminderId}")
    public ResponseEntity<CustomReminder> updateReminder(
            @PathVariable String userId,
            @PathVariable Long reminderId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody UpdateReminderRequest request) {

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        reminderService.updateReminder(
            empresaId,
            usuarioSub,
            reminderId,
            request.title(),
            request.message(),
            request.scheduledFor(),
            request.isRecurring(),
            request.recurrencePattern()
        );

        CustomReminder updated = reminderService.getReminder(empresaId, usuarioSub, reminderId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{reminderId}")
    public ResponseEntity<Void> deleteReminder(
            @PathVariable String userId,
            @PathVariable Long reminderId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        reminderService.deleteReminder(empresaId, usuarioSub, reminderId);
        return ResponseEntity.noContent().build();
    }

    public record CreateReminderRequest(
        String title,
        String message,
        Instant scheduledFor,
        boolean isRecurring,
        CustomReminder.RecurrencePattern recurrencePattern
    ) {}

    public record UpdateReminderRequest(
        String title,
        String message,
        Instant scheduledFor,
        boolean isRecurring,
        CustomReminder.RecurrencePattern recurrencePattern
    ) {}
}
