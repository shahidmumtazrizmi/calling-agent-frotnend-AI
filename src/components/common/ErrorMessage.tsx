import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  title = 'Error', 
  onRetry 
}) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
