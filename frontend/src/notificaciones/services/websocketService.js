import { Client } from "@stomp/stompjs";
import API_CONFIG from "../../config/api-config";

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = API_CONFIG.WEBSOCKET ? 5 : 0;
    this.reconnectDelay = 1000; // 1 segundo
  }

  connect(userId) {
    // Si no hay endpoint WebSocket configurado, no intentamos conectar
    if (!API_CONFIG.WEBSOCKET) {
      return Promise.resolve();
    }
    if (this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Crear cliente STOMP con WebSocket nativo
        this.stompClient = new Client({
          brokerURL: API_CONFIG.WEBSOCKET + '/notifications',
          debug: (str) => {
            console.log("STOMP Debug:", str);
          },
          onConnect: () => {
            console.log("WebSocket conectado");
            this.connected = true;
            this.reconnectAttempts = 0;
            resolve();
          },
          onStompError: (error) => {
            console.error("Error STOMP:", error);
            this.connected = false;
            reject(error);
          },
          onWebSocketClose: () => {
            console.log("WebSocket desconectado");
            this.connected = false;
            this.handleReconnect(userId);
          },
        });

        // Activar el cliente
        this.stompClient.activate();
      } catch (error) {
        console.error("Error conectando WebSocket:", error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      // Desuscribirse de todas las suscripciones
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Desactivar el cliente
      this.stompClient.deactivate();
      this.connected = false;
      console.log("WebSocket desconectado");
    }
  }

  subscribeToNotifications(userId, callback) {
    if (!this.connected || !this.stompClient) {
      console.error("WebSocket no conectado");
      return null;
    }

    const destination = `/user/${userId}/queue/notifications`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const notification = JSON.parse(message.body);
        console.log("Nueva notificación recibida:", notification);
        callback(notification);
      } catch (error) {
        console.error("Error procesando notificación:", error);
      }
    });

    this.subscriptions.set("notifications", subscription);
    console.log(`Suscrito a notificaciones: ${destination}`);
    return subscription;
  }

  subscribeToUnreadCount(userId, callback) {
    if (!this.connected || !this.stompClient) {
      console.error("WebSocket no conectado");
      return null;
    }

    const destination = `/user/${userId}/queue/unread-count`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log("Actualización de contador recibida:", data);
        callback(data.unreadCount);
      } catch (error) {
        console.error("Error procesando contador:", error);
      }
    });

    this.subscriptions.set("unreadCount", subscription);
    console.log(`Suscrito a contador: ${destination}`);
    return subscription;
  }

  handleReconnect(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Máximo número de intentos de reconexión alcanzado");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Backoff exponencial

    console.log(
      `Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(userId)
        .then(() => {
          console.log("Reconexión exitosa");
          // Re-suscribirse a las notificaciones
          this.subscribeToNotifications(userId, (notification) => {
            // Re-emitir evento de notificación
            window.dispatchEvent(
              new CustomEvent("notificationReceived", { detail: notification })
            );
          });
          this.subscribeToUnreadCount(userId, (count) => {
            // Re-emitir evento de contador
            window.dispatchEvent(
              new CustomEvent("unreadCountUpdated", { detail: count })
            );
          });
        })
        .catch((error) => {
          console.error("Error en reconexión:", error);
        });
    }, delay);
  }

  isConnected() {
    return this.connected && this.stompClient;
  }
}

// Instancia singleton
const websocketService = new WebSocketService();

export default websocketService;
