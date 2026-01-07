package registro.mercadopago.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Converter
public class CryptoConverter implements AttributeConverter<String, String> {
    private final SecretKeySpec key;
    public CryptoConverter() {
        String secret = System.getenv().getOrDefault("APP_ENCRYPT_SECRET", "0123456789ABCDEF0123456789ABCDEF");
        key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "AES");
    }
    @Override public String convertToDatabaseColumn(String raw) {
        if (raw == null) return null;
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            byte[] iv = SecureRandom.getInstanceStrong().generateSeed(12);
            c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] enc = c.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length+enc.length).put(iv).put(enc).array());
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    @Override public String convertToEntityAttribute(String db) {
        if (db == null) return null;
        try {
            byte[] all = Base64.getDecoder().decode(db);
            byte[] iv = new byte[12]; System.arraycopy(all, 0, iv, 0, 12);
            byte[] enc = new byte[all.length-12]; System.arraycopy(all, 12, enc, 0, enc.length);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            return new String(c.doFinal(enc), StandardCharsets.UTF_8);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
