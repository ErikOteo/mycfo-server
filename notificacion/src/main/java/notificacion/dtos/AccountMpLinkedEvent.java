package notificacion.dtos;

public record AccountMpLinkedEvent(
        String userId,
        Long accountId,
        String accountName
) {}
