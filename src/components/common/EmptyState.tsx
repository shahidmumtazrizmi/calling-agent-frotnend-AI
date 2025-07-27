import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  icon, 
  actionText, 
  onAction 
}) => {
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px dashed',
        borderColor: 'divider',
        minHeight: 200,
        gap: 2
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', '& svg': { fontSize: 48 } }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      
      {actionText && onAction && (
        <Button 
          variant="contained" 
          color="primary"
          onClick={onAction}
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
