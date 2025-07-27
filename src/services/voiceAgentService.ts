import api from './api';
import { WebSocketService } from './websocket';

export interface CallRequest {
  to_number: string;
  from_number: string;
}

export interface CallResponse {
  call_sid: string;
  status: string;
  message: string;
}

export interface TranscriptMessage {
  call_id: number;
  text: string;
  speaker: 'agent' | 'caller';
  timestamp: string;
}

export interface ScamAlert {
  call_id: number;
  alert_type: string;
  description: string;
  confidence: number;
  created_at: string;
}

class VoiceAgentService {
  private websocketService: WebSocketService;
  
  constructor() {
    this.websocketService = WebSocketService.getInstance();
  }

  // Initialize the voice agent service
  initialize(): void {
    this.websocketService.connect();
    
    // Set up event listeners for incoming messages
    this.websocketService.onMessage('transcript', (data: TranscriptMessage) => {
      // Handle incoming transcript message
      console.log('Received transcript:', data);
      // Dispatch to any registered handlers
      this.transcriptHandlers.forEach(handler => handler(data));
    });
    
    this.websocketService.onMessage('alert', (data: ScamAlert) => {
      // Handle incoming alert
      console.log('Received alert:', data);
      // Dispatch to any registered handlers
      this.alertHandlers.forEach(handler => handler(data));
    });
    
    this.websocketService.onMessage('call_status', (data: any) => {
      // Handle call status updates
      console.log('Call status update:', data);
      // Dispatch to any registered handlers
      this.callStatusHandlers.forEach(handler => handler(data));
    });
  }

  // Clean up resources
  cleanup(): void {
    this.websocketService.disconnect();
    this.transcriptHandlers = [];
    this.alertHandlers = [];
    this.callStatusHandlers = [];
  }

  // Make an outbound call
  async makeCall(callRequest: CallRequest): Promise<CallResponse> {
    try {
      const response = await api.post('/api/calls/outbound', callRequest);
      return response.data;
    } catch (error) {
      console.error('Error making outbound call:', error);
      throw error;
    }
  }

  // End an active call
  async endCall(callSid: string): Promise<void> {
    try {
      await api.post(`/api/calls/${callSid}/end`);
    } catch (error) {
      console.error(`Error ending call with SID ${callSid}:`, error);
      throw error;
    }
  }

  // Send audio data through WebSocket
  sendAudioData(audioData: string, callId: number): void {
    this.websocketService.sendMessage('audio', { audio_data: audioData, call_id: callId });
  }

  // Event handlers
  private transcriptHandlers: Array<(data: TranscriptMessage) => void> = [];
  private alertHandlers: Array<(data: ScamAlert) => void> = [];
  private callStatusHandlers: Array<(data: any) => void> = [];

  // Register event handlers
  onTranscript(handler: (data: TranscriptMessage) => void): void {
    this.transcriptHandlers.push(handler);
  }

  onAlert(handler: (data: ScamAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  onCallStatus(handler: (data: any) => void): void {
    this.callStatusHandlers.push(handler);
  }

  // Remove event handlers
  offTranscript(handler: (data: TranscriptMessage) => void): void {
    this.transcriptHandlers = this.transcriptHandlers.filter(h => h !== handler);
  }

  offAlert(handler: (data: ScamAlert) => void): void {
    this.alertHandlers = this.alertHandlers.filter(h => h !== handler);
  }

  offCallStatus(handler: (data: any) => void): void {
    this.callStatusHandlers = this.callStatusHandlers.filter(h => h !== handler);
  }
}

// Create a singleton instance
const voiceAgentService = new VoiceAgentService();

export default voiceAgentService;
