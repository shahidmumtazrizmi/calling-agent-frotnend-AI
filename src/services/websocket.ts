import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000';

class WebSocketService {
  private socket: Socket | null = null;
  private clientId: string;
  private messageListeners: Map<string, ((data: any) => void)[]> = new Map();
  private connectionListeners: ((connected: boolean) => void)[] = [];

  constructor() {
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    return `client-${Math.random().toString(36).substring(2, 9)}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.socket) {
          this.socket.close();
        }

        // Create a new WebSocket connection to FastAPI backend
        this.socket = io(WEBSOCKET_URL.replace('ws://', 'http://'), {
          path: `/ws/${this.clientId}`,
          transports: ['websocket'],
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected to backend');
          this.notifyConnectionListeners(true);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.notifyConnectionListeners(false);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.notifyConnectionListeners(false);
        });

        // Handle incoming messages from backend
        this.socket.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  sendMessage(type: string, data: any): void {
    if (this.socket && this.socket.connected) {
      const message = { type, ...data };
      this.socket.emit('message', JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendAudio(audioData: Blob, callId: string): void {
    if (this.socket && this.socket.connected) {
      // Convert Blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioData);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        
        this.sendMessage('audio', {
          audio_data: base64data,
          call_id: callId,
        });
      };
    } else {
      console.error('WebSocket not connected');
    }
  }

  private handleMessage(message: any): void {
    const messageType = message.type;
    const listeners = this.messageListeners.get(messageType);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    }
  }

  onMessage(type: string, callback: (data: any) => void): void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }
    this.messageListeners.get(type)!.push(callback);
  }

  offMessage(type: string, callback: (data: any) => void): void {
    const listeners = this.messageListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  onConnect(callback: () => void): void {
    this.connectionListeners.push(callback);
  }

  offConnect(callback: () => void): void {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  onDisconnect(callback: () => void): void {
    // For simplicity, we'll use the same callback for both connect and disconnect
    this.connectionListeners.push(callback);
  }

  offDisconnect(callback: () => void): void {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  ping(): void {
    if (this.socket && this.socket.connected) {
      this.sendMessage('ping', {});
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
