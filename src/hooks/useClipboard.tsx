
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';
import { toast } from 'sonner';

export interface ClipboardItem {
  id: string;
  user_id: string;
  device_id: string;
  content: string;
  content_type: string;
  encrypted_content?: string;
  sync_timestamp: string;
  synced_to_devices: string[];
  created_at: string;
}

export const useClipboard = () => {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { currentDevice } = useDevices();

  // Sync clipboard content
  const syncClipboard = async (content: string, contentType: string = 'text') => {
    if (!user || !currentDevice || !content.trim()) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clipboard_sync')
        .insert({
          user_id: user.id,
          device_id: currentDevice.id,
          content,
          content_type: contentType,
          sync_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log analytics
      await supabase
        .from('usage_analytics')
        .insert({
          user_id: user.id,
          device_id: currentDevice.id,
          action_type: 'clipboard_sync',
          metadata: { content_length: content.length, content_type: contentType }
        });

      toast.success('Clipboard synced successfully');
      return data;
    } catch (error) {
      console.error('Error syncing clipboard:', error);
      toast.error('Failed to sync clipboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clipboard history
  const fetchClipboardHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clipboard_sync')
        .select('*')
        .eq('user_id', user.id)
        .order('sync_timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setClipboardHistory(data || []);
    } catch (error) {
      console.error('Error fetching clipboard history:', error);
      toast.error('Failed to fetch clipboard history');
    }
  };

  // Copy to system clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Auto-sync from system clipboard (if supported)
  const enableAutoSync = () => {
    if ('clipboard' in navigator) {
      // Note: Reading from clipboard requires user permission
      // This is a simplified implementation
      const interval = setInterval(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text !== clipboardHistory[0]?.content) {
            syncClipboard(text);
          }
        } catch (error) {
          // Clipboard read failed - user hasn't granted permission
          console.log('Clipboard auto-sync not available');
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClipboardHistory();
    }
  }, [user]);

  // Real-time subscription for clipboard updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('clipboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clipboard_sync',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchClipboardHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    clipboardHistory,
    loading,
    syncClipboard,
    fetchClipboardHistory,
    copyToClipboard,
    enableAutoSync
  };
};
