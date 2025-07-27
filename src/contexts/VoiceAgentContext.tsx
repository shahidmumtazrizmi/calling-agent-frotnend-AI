import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import voiceAgentService, { TranscriptMessage, ScamAlert } from '../services/voiceAgentService';
import { useWebSocket } from './WebSocketContext';

interface CallState {
  isActive: boolean;
  callId?: number;
  callSid?: string;
  status: 'idle' | 'connecting' | 'in-progress' | 'completed' | 'failed';
  fromNumber: string;
  toNumber: string;
  duration: number;
  startTime?: Date;
}

interface VoiceAgentContextType {
  callState: CallState;
  transcripts: TranscriptMessage[];
  alerts: ScamAlert[];
  isProcessing: boolean;
  error: string | null;
  makeCall: (fromNumber: string, toNumber: string) => Promise<void>;
  endCall: () => Promise<void>;
  sendAudio: (audioData: string) => void;
  clearTranscripts: () => void;
  clearAlerts: () => void;
}

const initialCallState: CallState = {
  isActive: false,
  status: 'idle',
  fromNumber: '',
  toNumber: '',
  duration: 0,
};

const VoiceAgentContext = createContext<VoiceAgentContextType | undefined>(undefined);

interface VoiceAgentProviderProps {
  children: ReactNode;
}

export const VoiceAgentProvider: React.FC<VoiceAgentProviderProps> = ({ children }) => {
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connect } = useWebSocket();

  // Initialize voice agent service
  useEffect(() => {
    voiceAgentService.initialize();

    // Set up event listeners
    voiceAgentService.onTranscript(handleTranscript);
    voiceAgentService.onAlert(handleAlert);
    voiceAgentService.onCallStatus(handleCallStatus);

    // Ensure WebSocket connection
    if (!isConnected) {
      connect();
    }

    // Clean up on unmount
    return () => {
      voiceAgentService.offTranscript(handleTranscript);
      voiceAgentService.offAlert(handleAlert);
      voiceAgentService.offCallStatus(handleCallStatus);
      voiceAgentService.cleanup();
    };
  }, [isConnected, connect]);

  // Handle incoming transcript
  const handleTranscript = (data: TranscriptMessage) => {
    setTranscripts(prev => [...prev, data]);
  };

  // Handle incoming alert
  const handleAlert = (data: ScamAlert) => {
    setAlerts(prev => [...prev, data]);
  };

  // Handle call status updates
  const handleCallStatus = (data: any) => {
    if (data.call_sid) {
      setCallState(prev => ({
        ...prev,
        callSid: data.call_sid,
        status: data.status,
        duration: data.duration || prev.duration,
        isActive: ['connecting', 'in-progress'].includes(data.status),
      }));

      // If call ended, reset after a delay
      if (['completed', 'failed'].includes(data.status)) {
        setTimeout(() => {
          setCallState(initialCallState);
        }, 5000);
      }
    }
  };

  // Make an outbound call
  const makeCall = async (fromNumber: string, toNumber: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Update call state to connecting
      setCallState({
        isActive: true,
        status: 'connecting',
        fromNumber,
        toNumber,
        duration: 0,
        startTime: new Date(),
      });

      // Clear previous transcripts and alerts
      setTranscripts([]);
      setAlerts([]);

      // Make the call
      const response = await voiceAgentService.makeCall({
        from_number: fromNumber,
        to_number: toNumber,
      });

      // Update call state with response data
      setCallState(prev => ({
        ...prev,
        callSid: response.call_sid,
        status: response.status === 'initiated' ? 'connecting' : response.status,
      }));
    } catch (err: any) {
      console.error('Error making call:', err);
      setError(err.response?.data?.detail || 'Failed to initiate call. Please try again.');
      setCallState({
        ...initialCallState,
        status: 'failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // End an active call
  const endCall = async () => {
    if (!callState.callSid) {
      setError('No active call to end');
      return;
    }

    setIsProcessing(true);
    try {
      await voiceAgentService.endCall(callState.callSid);
      setCallState(prev => ({
        ...prev,
        status: 'completed',
        isActive: false,
      }));
    } catch (err: any) {
      console.error('Error ending call:', err);
      setError(err.response?.data?.detail || 'Failed to end call. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Send audio data
  const sendAudio = (audioData: string) => {
    if (callState.callId && callState.isActive) {
      voiceAgentService.sendAudioData(audioData, callState.callId);
    }
  };

  // Clear transcripts
  const clearTranscripts = () => {
    setTranscripts([]);
  };

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  const value = {
    callState,
    transcripts,
    alerts,
    isProcessing,
    error,
    makeCall,
    endCall,
    sendAudio,
    clearTranscripts,
    clearAlerts,
  };

  return <VoiceAgentContext.Provider value={value}>{children}</VoiceAgentContext.Provider>;
};

export const useVoiceAgent = (): VoiceAgentContextType => {
  const context = useContext(VoiceAgentContext);
  if (context === undefined) {
    throw new Error('useVoiceAgent must be used within a VoiceAgentProvider');
  }
  return context;
};
