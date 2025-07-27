import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  IconButton,
  Grid,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Warning as WarningIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

interface TranscriptEntry {
  id: string;
  speaker: 'caller' | 'agent';
  text: string;
  timestamp: Date;
}

interface ScamAlert {
  id: string;
  description: string;
  confidence: number;
  timestamp: Date;
}

const VoiceAgent: React.FC = () => {
  const { isConnected, connect, sendMessage, addMessageListener, removeMessageListener } = useWebSocket();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<string | null>(null);
  const [animatedPartial, setAnimatedPartial] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Helper to play base64 audio
  const playBase64Audio = async (base64: string, mimeType = 'audio/mp3') => {
    const audioSrc = `data:${mimeType};base64,${base64}`;
    const audio = new Audio(audioSrc);
    try {
      await audio.play();
    } catch (e) {
      // Ignore playback errors (e.g., user gesture required)
    }
  };

  useEffect(() => {
    // Connect to WebSocket on component mount
    if (!isConnected) {
      connect();
    }

    // Set up message listeners
    const handleResponse = (data: any) => {
      if (data.type === 'response') {
        // Add caller transcript
        if (data.transcript) {
          setTranscripts(prev => [...prev, {
            id: Date.now().toString(),
            speaker: 'caller',
            text: data.transcript,
            timestamp: new Date(),
          }]);
        }

        // Add agent response
        if (data.response) {
          setTranscripts(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            speaker: 'agent',
            text: data.response,
            timestamp: new Date(),
          }]);
        }

        // Handle scam alerts
        if (data.scam_detected) {
          setAlerts(prev => [...prev, {
            id: Date.now().toString(),
            description: data.scam_description || 'Potential scam detected',
            confidence: data.scam_confidence || 0,
            timestamp: new Date(),
          }]);
        }

        // Play agent TTS audio if present
        if (data.audio_data) {
          playBase64Audio(data.audio_data);
        }
        // Hide listening indicator when response arrives
        setIsListening(false);
        setPartialTranscript(null); // Clear partial transcript on final response
      }
    };

    const handleError = (data: any) => {
      if (data.type === 'error') {
        setError(data.message || 'An error occurred');
      }
    };

    const handlePartial = (data: any) => {
      if (data.type === 'partial_transcript') {
        setPartialTranscript(data.transcript);
      }
    };

    addMessageListener('response', handleResponse);
    addMessageListener('error', handleError);
    addMessageListener('partial_transcript', handlePartial);

    return () => {
      removeMessageListener('response', handleResponse);
      removeMessageListener('error', handleError);
      removeMessageListener('partial_transcript', handlePartial);
    };
  }, [isConnected, connect, addMessageListener, removeMessageListener]);

  // Animate dots for '[Processing...]' partial transcript
  useEffect(() => {
    if (partialTranscript === '[Processing...]') {
      let i = 0;
      const dots = ['', '.', '..', '...'];
      setAnimatedPartial('Processing');
      const interval = setInterval(() => {
        setAnimatedPartial(`Processing${dots[i % dots.length]}`);
        i++;
      }, 500);
      return () => clearInterval(interval);
    } else if (partialTranscript) {
      setAnimatedPartial(partialTranscript); // Show real interim text if present
    } else {
      setAnimatedPartial(null);
    }
  }, [partialTranscript]);

  const startCall = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate a call ID for this session
      const callId = `call-${Date.now()}`;
      setCurrentCallId(callId);
      setCallStatus('connecting');
      
      // Initialize call in backend (you might want to create a call record)
      // For now, we'll just set the status to active
      setTimeout(() => {
        setCallStatus('active');
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setError('Failed to start call');
      setLoading(false);
    }
  };

  const endCall = () => {
    setCallStatus('ended');
    setCurrentCallId(null);
    setIsRecording(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Stream audio chunks every 250ms
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send each chunk immediately as base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (currentCallId && isConnected && base64data) {
              sendMessage('audio', {
                audio_data: base64data,
                call_id: currentCallId,
              });
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(250); // Emit data every 250ms
      setIsRecording(true);
      setIsListening(true); // Show listening indicator
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Optionally keep listening true until response arrives
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getSpeakerColor = (speaker: 'caller' | 'agent') => {
    return speaker === 'caller' ? 'primary' : 'secondary';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Voice Agent" 
        subtitle="Real-time AI-powered call interaction"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Call Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Controls
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={callStatus.toUpperCase()} 
                  color={callStatus === 'active' ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {callStatus === 'idle' && (
                  <Button
                    variant="contained"
                    startIcon={<PhoneIcon />}
                    onClick={startCall}
                    fullWidth
                  >
                    Start Call
                  </Button>
                )}

                {callStatus === 'active' && (
                  <>
                    <Button
                      variant={isRecording ? "contained" : "outlined"}
                      color={isRecording ? "error" : "primary"}
                      startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                      onClick={isRecording ? stopRecording : startRecording}
                      fullWidth
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<PhoneDisabledIcon />}
                      onClick={endCall}
                      fullWidth
                    >
                      End Call
                    </Button>
                  </>
                )}

                {callStatus === 'ended' && (
                  <Button
                    variant="contained"
                    onClick={() => setCallStatus('idle')}
                    fullWidth
                  >
                    Start New Call
                  </Button>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Transcript */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Transcript
              </Typography>
              
              {isListening && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="primary">
                    Agent is listening...
                  </Typography>
                </Box>
              )}

              {animatedPartial && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {animatedPartial}
                  </Typography>
                </Box>
              )}

              {transcripts.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No conversation yet. Start a call to begin.
                </Typography>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {transcripts.map((entry) => (
                    <ListItem key={entry.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <Chip
                          label={entry.speaker}
                          color={getSpeakerColor(entry.speaker)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(entry.timestamp)}
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={entry.text}
                        sx={{ 
                          backgroundColor: entry.speaker === 'caller' ? 'grey.100' : 'primary.50',
                          p: 1,
                          borderRadius: 1,
                          width: '100%'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Scam Alerts */}
        {alerts.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scam Alerts
                </Typography>
                
                <List>
                  {alerts.map((alert) => (
                    <ListItem key={alert.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color="error" />
                            <Typography variant="body1">
                              {alert.description}
                            </Typography>
                            <Chip
                              label={`${(alert.confidence * 100).toFixed(1)}%`}
                              color="error"
                              size="small"
                            />
                          </Box>
                        }
                        secondary={formatTimestamp(alert.timestamp)}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default VoiceAgent; 