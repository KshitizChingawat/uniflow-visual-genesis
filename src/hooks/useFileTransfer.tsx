
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';
import { toast } from 'sonner';

export interface FileTransfer {
  id: string;
  user_id: string;
  sender_device_id: string;
  receiver_device_id?: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  file_hash?: string;
  transfer_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  transfer_method: 'cloud' | 'p2p' | 'local';
  encrypted_metadata?: any;
  created_at: string;
  completed_at?: string;
}

export const useFileTransfer = () => {
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { currentDevice } = useDevices();

  // Initiate file transfer
  const initiateTransfer = async (
    file: File,
    receiverDeviceId?: string,
    transferMethod: 'cloud' | 'p2p' | 'local' = 'cloud'
  ) => {
    if (!user || !currentDevice) return;

    try {
      setLoading(true);
      
      // Create file hash for integrity check
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data, error } = await supabase
        .from('file_transfers')
        .insert({
          user_id: user.id,
          sender_device_id: currentDevice.id,
          receiver_device_id: receiverDeviceId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_hash: fileHash,
          transfer_method: transferMethod,
          encrypted_metadata: {
            original_name: file.name,
            mime_type: file.type,
            last_modified: file.lastModified
          }
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
          action_type: 'file_transfer',
          metadata: { 
            file_size: file.size, 
            file_type: file.type,
            transfer_method: transferMethod
          }
        });

      toast.success('File transfer initiated');
      return data;
    } catch (error) {
      console.error('Error initiating file transfer:', error);
      toast.error('Failed to initiate file transfer');
    } finally {
      setLoading(false);
    }
  };

  // Update transfer status
  const updateTransferStatus = async (
    transferId: string, 
    status: FileTransfer['transfer_status']
  ) => {
    try {
      const updateData: any = { transfer_status: status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('file_transfers')
        .update(updateData)
        .eq('id', transferId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating transfer status:', error);
    }
  };

  // Fetch user's file transfers
  const fetchTransfers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('file_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to fetch file transfers');
    }
  };

  // Cancel transfer
  const cancelTransfer = async (transferId: string) => {
    try {
      await updateTransferStatus(transferId, 'cancelled');
      toast.success('Transfer cancelled');
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      toast.error('Failed to cancel transfer');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransfers();
    }
  }, [user]);

  // Real-time subscription for transfer updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('file-transfers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_transfers',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    transfers,
    loading,
    initiateTransfer,
    updateTransferStatus,
    fetchTransfers,
    cancelTransfer
  };
};
