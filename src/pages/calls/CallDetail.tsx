import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Headset as HeadsetIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import callService, { CallWithDetails, Transcript, Alert as CallAlert } from '../../services/callService';
import { useWebSocket } from '../../contexts/WebSocketContext';

const CallDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, addMessageListener, removeMessageListener } = useWebSocket();
  
  const [call, setCall] = useState<CallWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const callId = parseInt(id, 10);
        const callData = await callService.getCallById(callId);
        setCall(callData);
        
        // Check if call is in progress for real-time updates
        if (callData.status === 'in-progress') {
          setIsLive(true);
        }
      } catch (err) {
        console.error('Error fetching call details:', err);
        setError('Failed to load call details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [id]);

  // Real-time updates for in-progress calls
  useEffect(() => {
    if (!isLive || !call || !isConnected) return;

    const handleResponse = (data: any) => {
      if (data.type === 'response' && data.call_id === call.call_sid) {
        // Add new transcript entries
        if (data.transcript) {
          const newTranscript: Transcript = {
            id: Date.now(),
            call_id: call.id,
            text: data.transcript,
            speaker: 'caller',
            timestamp: new Date().toISOString(),
          };
          setCall(prev => prev ? {
            ...prev,
            transcripts: [...(prev.transcripts || []), newTranscript]
          } : null);
        }

        if (data.response) {
          const newTranscript: Transcript = {
            id: Date.now() + 1,
            call_id: call.id,
            text: data.response,
            speaker: 'agent',
            timestamp: new Date().toISOString(),
          };
          setCall(prev => prev ? {
            ...prev,
            transcripts: [...(prev.transcripts || []), newTranscript]
          } : null);
        }

        // Add new alerts
        if (data.scam_detected) {
          const newAlert: CallAlert = {
            id: Date.now(),
            call_id: call.id,
            alert_type: 'potential_scam',
            description: data.scam_description || 'Potential scam detected',
            confidence: data.scam_confidence || 0,
            created_at: new Date().toISOString(),
          };
          setCall(prev => prev ? {
            ...prev,
            alerts: [...(prev.alerts || []), newAlert]
          } : null);
        }
      }
    };

    addMessageListener('response', handleResponse);

    return () => {
      removeMessageListener('response', handleResponse);
    };
  }, [isLive, call, isConnected, addMessageListener, removeMessageListener]);

  const handleBack = () => {
    navigate('/calls');
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'failed':
        return 'error';
      case 'busy':
        return 'warning';
      case 'no-answer':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    
    // This is a simple formatter for US numbers, adjust as needed
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `+1 (${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    
    return phoneNumber;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => navigate(0)} />;
  }

  if (!call) {
    return <ErrorMessage message="Call not found" />;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Calls
        </Button>
        <PageHeader
          title={`Call Details: ${formatPhoneNumber(call.from_number)} → ${formatPhoneNumber(call.to_number)}`}
          subtitle={`Call ID: ${call.call_sid}`}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Call Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Call Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={call.status}
                  color={getStatusChipColor(call.status) as any}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography>{formatDuration(call.duration)}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  From
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography>{formatPhoneNumber(call.from_number)}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  To
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography>{formatPhoneNumber(call.to_number)}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography sx={{ mt: 0.5 }}>
                  {new Date(call.created_at).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Call SID
                </Typography>
                <Typography sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                  {call.call_sid}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Transcript */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Call Transcript
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {call.transcripts && call.transcripts.length > 0 ? (
              <List>
                {call.transcripts.map((transcript: Transcript) => (
                  <ListItem
                    key={transcript.id}
                    alignItems="flex-start"
                    sx={{
                      bgcolor: transcript.speaker === 'agent' ? 'background.default' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          mr: 2,
                        }}
                      >
                        <IconButton
                          sx={{
                            bgcolor: transcript.speaker === 'agent' ? 'primary.light' : 'secondary.light',
                            color: transcript.speaker === 'agent' ? 'primary.main' : 'secondary.main',
                            mb: 1,
                          }}
                          size="small"
                          disableRipple
                        >
                          {transcript.speaker === 'agent' ? <HeadsetIcon /> : <PersonIcon />}
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(transcript.timestamp)}
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            color={transcript.speaker === 'agent' ? 'primary' : 'secondary'}
                          >
                            {transcript.speaker === 'agent' ? 'Agent' : 'Caller'}
                          </Typography>
                        }
                        secondary={transcript.text}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No transcript available for this call.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alerts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {call.alerts && call.alerts.length > 0 ? (
              <Grid container spacing={2}>
                {call.alerts.map((alert: CallAlert) => (
                  <Grid item xs={12} key={alert.id}>
                    <Alert
                      severity={alert.alert_type === 'potential_scam' ? 'error' : 'warning'}
                      icon={<WarningIcon />}
                    >
                      <AlertTitle>
                        {alert.alert_type === 'potential_scam'
                          ? 'Potential Scam Detected'
                          : 'Suspicious Activity'}
                        {alert.confidence && ` (${Math.round(alert.confidence * 100)}% confidence)`}
                      </AlertTitle>
                      {alert.description}
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">
                No alerts detected for this call.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default CallDetail;
