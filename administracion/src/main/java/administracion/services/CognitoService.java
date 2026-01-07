package administracion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private static final String USER_POOL_ID = System.getenv("COGNITO_USER_POOL_ID") != null 
            ? System.getenv("COGNITO_USER_POOL_ID") 
            : "sa-east-1_lTMNrWW7R";
    private static final String CLIENT_ID = System.getenv("COGNITO_CLIENT_ID") != null
            ? System.getenv("COGNITO_CLIENT_ID")
            : "3ksssqtg3r49rf6js1t1177hrd";

    /**
     * Registra un nuevo usuario en Cognito con todos sus atributos
     */
    public String registrarUsuario(String email, String password, String nombre, String apellido, String nombreEmpresa) {
        try {
            SignUpRequest signUpRequest = SignUpRequest.builder()
                    .clientId(CLIENT_ID)
                    .username(email)
                    .password(password)
                    .userAttributes(
                            AttributeType.builder().name("email").value(email).build(),
                            AttributeType.builder().name("name").value(nombre).build(),
                            AttributeType.builder().name("family_name").value(apellido).build(),
                            AttributeType.builder().name("custom:organizacion").value(nombreEmpresa).build()
                    )
                    .build();

            SignUpResponse response = cognitoClient.signUp(signUpRequest);
            return response.userSub(); // Retorna el sub del usuario creado
        } catch (Exception e) {
            throw new RuntimeException("Error al registrar usuario en Cognito: " + e.getMessage(), e);
        }
    }

    /**
     * Reenvía el código de confirmación al email del usuario
     */
    public void reenviarCodigoConfirmacion(String email) {
        try {
            ResendConfirmationCodeRequest request = ResendConfirmationCodeRequest.builder()
                    .clientId(CLIENT_ID)
                    .username(email)
                    .build();

            cognitoClient.resendConfirmationCode(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al reenviar código de confirmación: " + e.getMessage(), e);
        }
    }

    /**
     * Confirma el código de verificación enviado por email
     */
    public void confirmarRegistro(String email, String codigo) {
        try {
            ConfirmSignUpRequest confirmRequest = ConfirmSignUpRequest.builder()
                    .clientId(CLIENT_ID)
                    .username(email)
                    .confirmationCode(codigo)
                    .build();

            cognitoClient.confirmSignUp(confirmRequest);
        } catch (CodeMismatchException e) {
            throw new RuntimeException("Código de verificación incorrecto", e);
        } catch (Exception e) {
            throw new RuntimeException("Error al confirmar registro: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica si un usuario existe en Cognito por su email
     */
    public boolean existeUsuarioEnCognito(String email) {
        try {
            AdminGetUserRequest request = AdminGetUserRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(email)
                    .build();

            cognitoClient.adminGetUser(request);
            return true; // Si no lanza excepción, el usuario existe
        } catch (UserNotFoundException e) {
            return false; // Usuario no encontrado
        } catch (Exception e) {
            throw new RuntimeException("Error al verificar usuario en Cognito: " + e.getMessage(), e);
        }
    }

    /**
     * Obtiene el sub de un usuario por su email
     */
    public String obtenerSubPorEmail(String email) {
        try {
            AdminGetUserRequest request = AdminGetUserRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(email)
                    .build();

            AdminGetUserResponse response = cognitoClient.adminGetUser(request);
            
            // El sub está en los atributos del usuario
            return response.userAttributes().stream()
                    .filter(attr -> attr.name().equals("sub"))
                    .findFirst()
                    .map(AttributeType::value)
                    .orElseThrow(() -> new RuntimeException("No se encontró el sub del usuario"));
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener sub del usuario: " + e.getMessage(), e);
        }
    }

    /**
     * Valida si un número de teléfono tiene formato internacional válido
     * Formato: +[código país][número] (ej: +541234567890)
     */
    private boolean esFormatoTelefonoValido(String telefono) {
        if (telefono == null || telefono.isEmpty()) {
            return false;
        }
        // Debe empezar con + y tener al menos 10 dígitos
        return telefono.matches("^\\+\\d{10,15}$");
    }

    /**
     * Actualiza los atributos de un usuario en Cognito
     */
    public void actualizarUsuarioEnCognito(String sub, String nombre, String email, String telefono) {
        try {
            Map<String, String> attributes = new HashMap<>();
            attributes.put("name", nombre);
            attributes.put("email", email);
            
            // Solo agregar teléfono si tiene formato válido
            if (telefono != null && !telefono.isEmpty()) {
                if (esFormatoTelefonoValido(telefono)) {
                    attributes.put("phone_number", telefono);
                } else {
                    System.out.println("⚠️  Teléfono con formato inválido, se omite en Cognito: " + telefono);
                    System.out.println("💡 Formato esperado: +[código país][número] (ej: +541234567890)");
                }
            }

            AdminUpdateUserAttributesRequest request = AdminUpdateUserAttributesRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(sub)
                    .userAttributes(
                            attributes.entrySet().stream()
                                    .map(entry -> AttributeType.builder()
                                            .name(entry.getKey())
                                            .value(entry.getValue())
                                            .build())
                                    .toList()
                    )
                    .build();

            cognitoClient.adminUpdateUserAttributes(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar usuario en Cognito: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina un usuario de Cognito
     */
    public void eliminarUsuarioEnCognito(String sub) {
        try {
            AdminDeleteUserRequest request = AdminDeleteUserRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(sub)
                    .build();

            cognitoClient.adminDeleteUser(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar usuario en Cognito: " + e.getMessage(), e);
        }
    }

    /**
     * Desactiva un usuario en Cognito
     */
    public void desactivarUsuarioEnCognito(String sub) {
        try {
            AdminDisableUserRequest request = AdminDisableUserRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(sub)
                    .build();

            cognitoClient.adminDisableUser(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al desactivar usuario en Cognito: " + e.getMessage(), e);
        }
    }

    /**
     * Activa un usuario en Cognito
     */
    public void activarUsuarioEnCognito(String sub) {
        try {
            AdminEnableUserRequest request = AdminEnableUserRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .username(sub)
                    .build();

            cognitoClient.adminEnableUser(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al activar usuario en Cognito: " + e.getMessage(), e);
        }
    }
}
