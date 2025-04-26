import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function WebSocketTest() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [message, setMessage] = useState<string>('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup function to close the socket when component unmounts
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const connectWebSocket = () => {
    try {
      setStatus('connecting');
      setError(null);
      
      // Get the correct protocol based on current connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Connecting to WebSocket at:', wsUrl);
      
      // Create a new WebSocket connection
      const newSocket = new WebSocket(wsUrl);
      
      // Setup event handlers
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        setMessage('Connection established. Send a message to test!');
      };
      
      newSocket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setMessage(event.data);
      };
      
      newSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setStatus('error');
        setError('Connection error. Check console for details.');
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket connection closed');
        setStatus('disconnected');
      };
      
      // Store the socket reference
      setSocket(newSocket);
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const disconnectWebSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setStatus('disconnected');
    }
  };

  const sendTestMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const testMessage = 'Hello WebSocket Server! Testing the connection.';
      socket.send(testMessage);
      console.log('Sent test message:', testMessage);
    } else {
      setError('WebSocket is not connected. Please connect first.');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">WebSocket Connection Test</h3>
      
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${status === 'connected' 
          ? 'bg-green-500' 
          : status === 'connecting' 
            ? 'bg-yellow-500' 
            : status === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400'
        }`}></div>
        <span className="text-sm">
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      {message && (
        <Alert className="mb-4 bg-gray-50">
          <AlertTitle>Message received</AlertTitle>
          <AlertDescription className="text-sm">{message}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2 mt-4">
        {status !== 'connected' ? (
          <Button onClick={connectWebSocket} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Connecting...' : 'Connect'}
          </Button>
        ) : (
          <Button onClick={disconnectWebSocket} variant="outline">
            Disconnect
          </Button>
        )}
        
        <Button 
          onClick={sendTestMessage} 
          disabled={status !== 'connected'}
          variant="secondary"
        >
          Send Test Message
        </Button>
      </div>
    </div>
  );
}