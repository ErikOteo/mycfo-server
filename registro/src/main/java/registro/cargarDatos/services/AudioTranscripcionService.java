package registro.cargarDatos.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.config.AwsTranscribeProperties;
import registro.cargarDatos.dtos.AudioAutocompletarResponse;
import registro.cargarDatos.models.TipoMovimiento;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.transcribe.TranscribeClient;
import software.amazon.awssdk.services.transcribe.model.GetTranscriptionJobRequest;
import software.amazon.awssdk.services.transcribe.model.GetTranscriptionJobResponse;
import software.amazon.awssdk.services.transcribe.model.LanguageCode;
import software.amazon.awssdk.services.transcribe.model.ListTranscriptionJobsRequest;
import software.amazon.awssdk.services.transcribe.model.ListTranscriptionJobsResponse;
import software.amazon.awssdk.services.transcribe.model.Media;
import software.amazon.awssdk.services.transcribe.model.MediaFormat;
import software.amazon.awssdk.services.transcribe.model.StartTranscriptionJobRequest;
import software.amazon.awssdk.services.transcribe.model.TranscribeException;
import software.amazon.awssdk.services.transcribe.model.TranscriptionJob;
import software.amazon.awssdk.services.transcribe.model.TranscriptionJobStatus;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class AudioTranscripcionService {

    private static final Map<String, MediaFormat> FORMATO_POR_EXTENSION = Map.ofEntries(
            Map.entry("mp3", MediaFormat.MP3),
            Map.entry("mp4", MediaFormat.MP4),
            Map.entry("wav", MediaFormat.WAV),
            Map.entry("flac", MediaFormat.FLAC),
            Map.entry("ogg", MediaFormat.OGG),
            Map.entry("webm", MediaFormat.WEBM),
            Map.entry("amr", MediaFormat.AMR),
            Map.entry("m4a", MediaFormat.MP4)
    );

    private static final Set<String> CAMPOS_MOVIMIENTO_OBLIGATORIOS = Set.of("montoTotal", "moneda", "fechaEmision");
    private static final Set<String> CAMPOS_FACTURA_OBLIGATORIOS = Set.of("montoTotal", "moneda", "fechaEmision", "numeroDocumento");

    private final TranscribeClient transcribeClient;
    private final S3Client s3Client;
    private final ObjectMapper objectMapper;
    private final AwsTranscribeProperties properties;
    private final AudioParserService audioParserService;

    @PostConstruct
    public void testAwsConnectivity() {
        try {
            testS3Access();
        } catch (Exception e) {
            log.error("❌ Error al verificar acceso S3: {}", e.getMessage(), e);
        }

        try {
            testTranscribeAccess();
        } catch (Exception e) {
            log.error("❌ Error al verificar acceso Transcribe: {}", e.getMessage(), e);
        }
    }

    private void testS3Access() {
        String bucket = properties.getBucket();
        if (!StringUtils.hasText(bucket)) {
            log.warn("Bucket S3 no configurado, se omite test de conectividad S3.");
            return;
        }
        try {
            ListObjectsV2Response response = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucket)
                            .maxKeys(5)
                            .build());
            log.info("✅ Conexión a S3 OK. Objetos encontrados en '{}':", bucket);
            response.contents().forEach(obj -> log.info(" - {} ({} bytes)", obj.key(), obj.size()));
        } catch (S3Exception e) {
            log.error("❌ Error al acceder al bucket S3 '{}': {}", bucket, e.awsErrorDetails().errorMessage());
            throw e;
        }
    }

    private void testTranscribeAccess() {
        try {
            ListTranscriptionJobsResponse jobs = transcribeClient.listTranscriptionJobs(
                    ListTranscriptionJobsRequest.builder()
                            .maxResults(5)
                            .build());
            log.info("✅ Conexión a Transcribe OK. Últimos jobs:");
            jobs.transcriptionJobSummaries().forEach(job ->
                    log.info(" - {} ({})", job.transcriptionJobName(), job.transcriptionJobStatus()));
        } catch (TranscribeException e) {
            log.error("❌ Error al conectar con Transcribe: {}", e.awsErrorDetails().errorMessage());
            throw e;
        }
    }

    public AudioAutocompletarResponse procesarMovimientoAudio(MultipartFile archivo, TipoMovimiento tipoMovimiento, String usuarioSub) {
        log.info("Iniciando transcripción de movimiento. Usuario: {}, TipoMovimiento: {}", usuarioSub, tipoMovimiento);
        String transcript = ejecutarTranscripcion(archivo, usuarioSub);
        Map<String, String> campos = audioParserService.parseMovimiento(transcript, tipoMovimiento);
        log.info("Campos detectados para movimiento: {}", campos);
        List<String> warnings = audioParserService.buildWarnings(campos, CAMPOS_MOVIMIENTO_OBLIGATORIOS);
        if (!warnings.isEmpty()) {
            log.warn("Warnings de parsing de movimiento: {}", warnings);
        }
        return AudioAutocompletarResponse.builder()
                .transcript(transcript)
                .campos(campos)
                .warnings(warnings)
                .build();
    }

    public AudioAutocompletarResponse procesarFacturaAudio(MultipartFile archivo, String usuarioSub) {
        log.info("Iniciando transcripción de factura. Usuario: {}", usuarioSub);
        String transcript = ejecutarTranscripcion(archivo, usuarioSub);
        Map<String, String> campos = audioParserService.parseFactura(transcript);
        log.info("Campos detectados para factura: {}", campos);
        List<String> warnings = audioParserService.buildWarnings(campos, CAMPOS_FACTURA_OBLIGATORIOS);
        if (!warnings.isEmpty()) {
            log.warn("Warnings de parsing de factura: {}", warnings);
        }
        return AudioAutocompletarResponse.builder()
                .transcript(transcript)
                .campos(campos)
                .warnings(warnings)
                .build();
    }

    private String ejecutarTranscripcion(MultipartFile archivo, String usuarioSub) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo de audio es obligatorio.");
        }

        if (!StringUtils.hasText(properties.getBucket())) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se configuró el bucket S3 para transcripciones (aws.transcribe.bucket).");
        }

        String objectKey = construirKey(usuarioSub, archivo.getOriginalFilename());

        try {
            log.info("Subiendo audio a S3. Bucket: {}, Key: {}", properties.getBucket(), objectKey);
            subirArchivoAS3(archivo, objectKey);
            MediaFormat mediaFormat = detectarFormato(archivo);
            log.info("Formato detectado para audio {}: {}", objectKey, mediaFormat);
            String jobName = generarNombreJob();
            String transcriptPrefix = "transcripts/" + jobName;
            log.info("Iniciando job de Transcribe. JobName: {}, TranscriptFolder: {}", jobName, transcriptPrefix);
            iniciarTrabajoTranscripcion(jobName, objectKey, mediaFormat, transcriptPrefix);
            esperarResultado(jobName);
            String transcriptKey = transcriptPrefix + "/" + jobName + ".json";

            log.info("Intentando descargar transcript desde S3. Bucket: {}, Key: {}", properties.getBucket(), transcriptKey);
            String json = descargarTranscriptDesdeS3(transcriptKey);
            JsonNode node = objectMapper.readTree(json);
            JsonNode transcriptNode = node.at("/results/transcripts/0/transcript");
            if (transcriptNode.isMissingNode() || transcriptNode.asText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AWS Transcribe no devolvió texto.");
            }
            return transcriptNode.asText();

        } catch (IOException e) {
            log.error("Error procesando archivo de audio", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al procesar el audio: " + e.getMessage());
        } finally {
            if (properties.isDeleteSourceObject()) {
                eliminarArchivo(objectKey);
            }
        }
    }

    private void subirArchivoAS3(MultipartFile archivo, String objectKey) throws IOException {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(objectKey)
                .contentType(archivo.getContentType())
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(archivo.getInputStream(), archivo.getSize()));
    }

    private void eliminarArchivo(String objectKey) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .build());
        } catch (Exception e) {
            log.warn("No se pudo eliminar el objeto {} del bucket {}", objectKey, properties.getBucket(), e);
        }
    }

    private void iniciarTrabajoTranscripcion(String jobName, String objectKey, MediaFormat mediaFormat, String transcriptPrefix) {

        // URI del archivo de audio en S3
        String mediaUri = String.format("s3://%s/%s", properties.getBucket(), objectKey);

        StartTranscriptionJobRequest.Builder builder = StartTranscriptionJobRequest.builder()
                .transcriptionJobName(jobName)
                .languageCode(resolverLanguageCode())
                .media(Media.builder().mediaFileUri(mediaUri).build())
                .mediaFormat(mediaFormat)
                .outputBucketName(properties.getBucket());

        // Prefijo directo (ya viene con "transcripts/" incluido)
        if (StringUtils.hasText(transcriptPrefix)) {
            builder.outputKey(transcriptPrefix + "/");
        }

        log.info("Iniciando Transcribe job: {}, MediaUri: {}, OutputBucket: {}, OutputKeyPrefix: {}/",
                jobName, mediaUri, properties.getBucket(), transcriptPrefix);

        transcribeClient.startTranscriptionJob(builder.build());
    }



    private String generarNombreJob() {
        return "audio-" + UUID.randomUUID();
    }

    private TranscriptionJob esperarResultado(String jobName) {
        Instant inicio = Instant.now();
        Duration maxWait = Duration.ofSeconds(properties.getMaxWaitSeconds());
        Duration intervalo = Duration.ofSeconds(Math.max(1, properties.getPollIntervalSeconds()));

        while (true) {
            GetTranscriptionJobResponse response = transcribeClient.getTranscriptionJob(
                    GetTranscriptionJobRequest.builder().transcriptionJobName(jobName).build());
            TranscriptionJob job = response.transcriptionJob();
            TranscriptionJobStatus status = job.transcriptionJobStatus();

            log.debug("Estado del job {}: {}", jobName, status);

            if (status == TranscriptionJobStatus.COMPLETED) {
                log.info("Job de Transcribe completado. JobName: {}", jobName);
                return job;
            }
            if (status == TranscriptionJobStatus.FAILED) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "La transcripción falló: " + job.failureReason());
            }

            if (Duration.between(inicio, Instant.now()).compareTo(maxWait) > 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "El servicio de transcripción demoró más de lo esperado.");
            }

            try {
                Thread.sleep(intervalo.toMillis());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "La transcripción fue interrumpida.");
            }
        }
    }

    private MediaFormat detectarFormato(MultipartFile archivo) {
        String extension = extraerExtension(archivo.getOriginalFilename());
        if (extension != null) {
            MediaFormat formato = FORMATO_POR_EXTENSION.get(extension);
            if (formato != null) {
                return formato;
            }
        }

        String contentType = archivo.getContentType();
        if (contentType != null) {
            if (contentType.contains("webm")) {
                return MediaFormat.WEBM;
            }
            if (contentType.contains("ogg")) {
                return MediaFormat.OGG;
            }
            if (contentType.contains("wav")) {
                return MediaFormat.WAV;
            }
            if (contentType.contains("mp3")) {
                return MediaFormat.MP3;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de audio no soportado para transcripción.");
    }

    private String extraerExtension(String nombreArchivo) {
        if (!StringUtils.hasText(nombreArchivo)) {
            return null;
        }
        String sanitized = nombreArchivo.toLowerCase(Locale.ROOT);
        int idx = sanitized.lastIndexOf('.');
        if (idx == -1) {
            return null;
        }
        return sanitized.substring(idx + 1);
    }

    private LanguageCode resolverLanguageCode() {
        try {
            return LanguageCode.fromValue(properties.getLanguageCode());
        } catch (Exception e) {
            log.warn("Código de idioma {} no reconocido, se usará es-ES", properties.getLanguageCode());
            return LanguageCode.ES_ES;
        }
    }

    private String construirKey(String usuarioSub, String nombreArchivo) {
        String extension = Optional.ofNullable(extraerExtension(nombreArchivo)).orElse("webm");
        String base = UUID.randomUUID() + "." + extension;
        if (StringUtils.hasText(usuarioSub)) {
            return "audio/" + usuarioSub + "/" + base;
        }
        return "audio/" + base;
    }

    private String descargarTranscriptDesdeS3(String transcriptKey) {
        int intentos = 0;
        int maxIntentos = properties.getDownloadMaxAttempts();
        Duration espera = Duration.ofSeconds(2);

        while (intentos < maxIntentos) {
            try {
                log.info("Descargando transcript (intento {}/{}): {}", intentos + 1, maxIntentos, transcriptKey);
                var response = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(properties.getBucket())
                        .key(transcriptKey)
                        .build());
                String contenido = response.asUtf8String();
                log.info("Transcript descargado correctamente desde S3: {}", transcriptKey);
                log.debug("Contenido del transcript: {}", contenido);
                return contenido;
            } catch (NoSuchKeyException e) {
                intentos++;
                if (intentos >= maxIntentos) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "El transcript no se encontró en el bucket configurado: " + transcriptKey);
                }
                try {
                    log.info("Transcript aún no disponible, reintentando en {} ms", espera.toMillis());
                    Thread.sleep(espera.toMillis());
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "La descarga del transcript fue interrumpida.");
                }
            } catch (Exception e) {
                log.error("Error descargando transcript {} desde S3", transcriptKey, e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Error al descargar el transcript desde S3: " + e.getMessage());
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "No fue posible descargar el transcript desde S3.");
    }
}

