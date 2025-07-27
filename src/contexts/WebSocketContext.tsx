import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketService } from '../services/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: string, data: any) => void;
  addMessageListener: (type: string, callback: (data: any) => void) => void;
  removeMessageListener: (type: string, callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    // Set up connection status listener
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    wsService.onConnect(handleConnect);
    wsService.onDisconnect(handleDisconnect);

    // Update initial connection status
    setIsConnected(wsService.isConnected());

    // Clean up listeners on unmount
    return () => {
      wsService.offConnect(handleConnect);
      wsService.offDisconnect(handleDisconnect);
    };
  }, []);

  const connect = () => {
    wsService.connect();
  };

  const disconnect = () => {
    wsService.disconnect();
  };

  const sendMessage = (type: string, data: any) => {
    wsService.sendMessage(type, data);
  };

  const addMessageListener = (type: string, callback: (data: any) => void) => {
    wsService.onMessage(type, callback);
  };

  const removeMessageListener = (type: string, callback: (data: any) => void) => {
    wsService.offMessage(type, callback);
  };

  const value = {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    addMessageListener,
    removeMessageListener,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
