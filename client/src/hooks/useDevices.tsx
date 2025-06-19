
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Device {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'browser';
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'browser';
  device_id: string;
  public_key?: string;
  last_seen?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Generate unique device ID for this browser
  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('unilink_device_id');
    if (!deviceId) {
      deviceId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('unilink_device_id', deviceId);
    }
    return deviceId;
  };

  // Register current device
  const registerDevice = async () => {
    if (!user) return;

    const deviceId = getOrCreateDeviceId();
    const deviceName = `${navigator.platform} Browser`;
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .upsert({
          user_id: user.id,
          device_name: deviceName,
          device_type: 'browser',
          platform: 'browser',
          device_id: deviceId,
          last_seen: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'device_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDevice(data as Device);
      console.log('Device registered:', data);
    } catch (error) {
      console.error('Error registering device:', error);
      toast.error('Failed to register device');
    }
  };

  // Fetch user's devices
  const fetchDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setDevices((data || []) as Device[]);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  // Update device last seen
  const updateLastSeen = async () => {
    if (!currentDevice) return;

    try {
      await supabase
        .from('devices')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentDevice.id);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  useEffect(() => {
    if (user) {
      registerDevice();
      fetchDevices();
    }
  }, [user]);

  // Update last seen every 30 seconds
  useEffect(() => {
    if (currentDevice) {
      const interval = setInterval(updateLastSeen, 30000);
      return () => clearInterval(interval);
    }
  }, [currentDevice]);

  // Real-time subscription for device updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    devices,
    currentDevice,
    loading,
    registerDevice,
    fetchDevices,
    updateLastSeen
  };
};
