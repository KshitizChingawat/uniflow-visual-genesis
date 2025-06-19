
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';
import { useFileTransfer } from './useFileTransfer';
import { toast } from 'sonner';

export const useEnhancedFileTransfer = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { currentDevice } = useDevices();
  const { transfers, updateTransferStatus } = useFileTransfer();

  const uploadFile = useCallback(async (
    file: File,
    targetDeviceId?: string,
    onProgress?: (progress: number) => void
  ) => {
    if (!user || !currentDevice) return null;

    const transferId = crypto.randomUUID();
    
    try {
      setUploadProgress(prev => ({ ...prev, [transferId]: 0 }));

      // Create transfer record
      const { data: transfer, error: transferError } = await supabase
        .from('file_transfers')
        .insert({
          id: transferId,
          user_id: user.id,
          sender_device_id: currentDevice.id,
          receiver_device_id: targetDeviceId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          transfer_status: 'in_progress',
          transfer_method: 'cloud'
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Upload to storage with progress simulation
      const filePath = `${user.id}/${transferId}/${file.name}`;
      
      // Simulate progress updates since Supabase doesn't support onUploadProgress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[transferId] || 0;
          const newProgress = Math.min(currentProgress + Math.random() * 20, 95);
          onProgress?.(newProgress);
          return { ...prev, [transferId]: newProgress };
        });
      }, 500);

      const { data, error: uploadError } = await supabase.storage
        .from('file-transfers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Complete progress
      setUploadProgress(prev => ({ ...prev, [transferId]: 100 }));
      onProgress?.(100);

      // Update transfer status
      await updateTransferStatus(transferId, 'completed');
      
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[transferId];
        return newProgress;
      });

      toast.success('File uploaded successfully');
      return transfer;

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
      await updateTransferStatus(transferId, 'failed');
      
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[transferId];
        return newProgress;
      });
      
      return null;
    }
  }, [user, currentDevice, updateTransferStatus]);

  const downloadFile = useCallback(async (
    transferId: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ) => {
    if (!user) return null;

    try {
      setDownloadProgress(prev => ({ ...prev, [transferId]: 0 }));

      const filePath = `${user.id}/${transferId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('file-transfers')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[transferId];
        return newProgress;
      });

      toast.success('File downloaded successfully');
      return data;

    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
      
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[transferId];
        return newProgress;
      });
      
      return null;
    }
  }, [user]);

  return {
    uploadFile,
    downloadFile,
    uploadProgress,
    downloadProgress,
    transfers
  };
};
