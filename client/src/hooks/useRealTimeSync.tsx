
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';
import { toast } from 'sonner';

export const useRealTimeSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  const { user } = useAuth();
  const { devices, currentDevice } = useDevices();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time presence tracking
  useEffect(() => {
    if (!user || !currentDevice) return;

    const channel = supabase.channel(`user-${user.id}`, {
      config: {
        presence: { key: currentDevice.id }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Presence sync:', newState);
        setSyncStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Device joined:', key, newPresences);
        toast.success(`Device ${key} connected`);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Device left:', key, leftPresences);
        toast.info(`Device ${key} disconnected`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected');
          await channel.track({
            device_id: currentDevice.id,
            device_name: currentDevice.device_name,
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.unsubscribe();
      setSyncStatus('disconnected');
    };
  }, [user, currentDevice]);

  // Cross-device notification system
  const sendCrossDeviceNotification = useCallback(async (
    title: string,
    body: string,
    targetDevices?: string[]
  ) => {
    if (!user || !currentDevice) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          source_device_id: currentDevice.id,
          title,
          body,
          target_devices: targetDevices || devices.map(d => d.id),
          notification_type: 'sync'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [user, currentDevice, devices]);

  return {
    isOnline,
    syncStatus,
    sendCrossDeviceNotification
  };
};
