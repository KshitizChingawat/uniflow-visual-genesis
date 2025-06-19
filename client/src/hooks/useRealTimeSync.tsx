import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';
import { toast } from 'sonner';

export const useRealTimeSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  const { currentDevice } = useDevices();

  // Initialize WebSocket connection
  const initializeConnection = () => {
    if (!user || !currentDevice) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setSyncStatus('idle');
        
        // Send authentication
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('auth_token'),
          deviceId: currentDevice.id
        }));

        toast.success('Real-time sync connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setSyncStatus('error');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (user && currentDevice) {
            initializeConnection();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSyncStatus('error');
      };

    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setSyncStatus('error');
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'clipboard_sync':
        handleClipboardSync(message.data);
        break;
      case 'file_transfer':
        handleFileTransferUpdate(message.data);
        break;
      case 'device_update':
        handleDeviceUpdate(message.data);
        break;
      case 'ai_suggestion':
        handleAISuggestion(message.data);
        break;
      case 'sync_complete':
        setSyncStatus('idle');
        setLastSyncTime(new Date());
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Handle clipboard sync
  const handleClipboardSync = (data: any) => {
    if (data.deviceId !== currentDevice?.id) {
      toast.info(`Clipboard updated from ${data.deviceName}`);
      
      // Update local clipboard if supported
      if (navigator.clipboard && data.content) {
        navigator.clipboard.writeText(data.content).catch(console.error);
      }
    }
  };

  // Handle file transfer updates
  const handleFileTransferUpdate = (data: any) => {
    const { transferId, status, progress } = data;
    
    switch (status) {
      case 'completed':
        toast.success(`File transfer completed: ${data.fileName}`);
        break;
      case 'failed':
        toast.error(`File transfer failed: ${data.fileName}`);
        break;
      case 'in_progress':
        if (progress) {
          toast.info(`Transfer progress: ${Math.round(progress)}%`);
        }
        break;
    }
  };

  // Handle device updates
  const handleDeviceUpdate = (data: any) => {
    const { deviceName, status } = data;
    
    switch (status) {
      case 'online':
        toast.info(`${deviceName} came online`);
        break;
      case 'offline':
        toast.info(`${deviceName} went offline`);
        break;
    }
  };

  // Handle AI suggestions
  const handleAISuggestion = (data: any) => {
    if (data.confidence > 0.8) {
      toast.info(`AI Suggestion: ${data.description}`);
    }
  };

  // Send real-time sync message
  const sendSyncMessage = (type: string, data: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue message if not connected
      setSyncQueue(prev => [...prev, { type, data, timestamp: Date.now() }]);
      return;
    }

    setSyncStatus('syncing');
    
    wsRef.current.send(JSON.stringify({
      type,
      data: {
        ...data,
        deviceId: currentDevice?.id,
        timestamp: Date.now()
      }
    }));
  };

  // Sync clipboard content
  const syncClipboard = (content: string, contentType: string = 'text') => {
    sendSyncMessage('clipboard_sync', {
      content,
      contentType,
      deviceName: currentDevice?.deviceName
    });
  };

  // Sync file transfer
  const syncFileTransfer = (transferData: any) => {
    sendSyncMessage('file_transfer', transferData);
  };

  // Sync device status
  const syncDeviceStatus = (status: 'online' | 'offline' | 'busy') => {
    sendSyncMessage('device_status', {
      status,
      deviceName: currentDevice?.deviceName
    });
  };

  // Process queued messages
  const processQueuedMessages = () => {
    if (syncQueue.length > 0 && isConnected) {
      const queue = [...syncQueue];
      setSyncQueue([]);
      
      queue.forEach(({ type, data }) => {
        sendSyncMessage(type, data);
      });
    }
  };

  // Get sync statistics
  const getSyncStats = () => {
    return {
      isConnected,
      status: syncStatus,
      lastSync: lastSyncTime,
      queuedItems: syncQueue.length,
      uptime: lastSyncTime ? Date.now() - lastSyncTime.getTime() : 0
    };
  };

  // Manual sync trigger
  const triggerManualSync = async () => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setSyncStatus('syncing');
      
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: currentDevice?.id
        })
      });

      if (response.ok) {
        setLastSyncTime(new Date());
        toast.success('Manual sync completed');
      } else {
        toast.error('Manual sync failed');
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      toast.error('Manual sync failed');
    } finally {
      setSyncStatus('idle');
    }
  };

  // Cleanup WebSocket connection
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setSyncStatus('idle');
  };

  // Initialize connection when user and device are available
  useEffect(() => {
    if (user && currentDevice) {
      initializeConnection();
    }

    return () => {
      disconnect();
    };
  }, [user, currentDevice]);

  // Process queued messages when connected
  useEffect(() => {
    if (isConnected) {
      processQueuedMessages();
    }
  }, [isConnected]);

  // Send periodic heartbeat
  useEffect(() => {
    if (isConnected && currentDevice) {
      const interval = setInterval(() => {
        sendSyncMessage('heartbeat', {
          deviceName: currentDevice.deviceName
        });
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, currentDevice]);

  return {
    isConnected,
    syncStatus,
    lastSyncTime,
    syncQueue: syncQueue.length,
    syncClipboard,
    syncFileTransfer,
    syncDeviceStatus,
    triggerManualSync,
    getSyncStats,
    disconnect
  };
};