
import { useState, useEffect, useCallback } from 'react';
import { useClipboard } from './useClipboard';
import { useFileTransfer } from './useFileTransfer';
import { useDevices } from './useDevices';
import { useAIAssistant } from './useAIAssistant';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useSmartSync = () => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [smartSuggestionsEnabled, setSmartSuggestionsEnabled] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { clipboardHistory, syncClipboard } = useClipboard();
  const { devices, currentDevice } = useDevices();
  const { analyzeClipboard, suggestFileOrganization, recommendDevice } = useAIAssistant();

  // Smart clipboard sync with AI analysis
  const smartClipboardSync = useCallback(async (content: string) => {
    if (!smartSuggestionsEnabled || !content.trim()) return;

    try {
      // Analyze clipboard content with AI
      const analysis = await analyzeClipboard(content, {
        currentDevice: currentDevice?.device_name,
        availableDevices: devices.map(d => d.device_name)
      });

      if (analysis) {
        // Show AI suggestions as a toast or notification
        if (analysis.actions && analysis.actions.length > 0) {
          toast.success(`Smart suggestion: ${analysis.actions[0]}`, {
            description: analysis.summary,
            duration: 5000
          });
        }

        // Auto-categorize and tag the clipboard content
        await supabase.from('ai_analytics').insert({
          user_id: user?.id,
          device_id: currentDevice?.id,
          event_type: 'clipboard_sync',
          event_data: { content_length: content.length, analysis },
          ai_context: { suggestion_used: true },
          success: true
        });
      }

      // Proceed with regular sync
      await syncClipboard(content);

    } catch (error) {
      console.error('Smart clipboard sync error:', error);
      // Fallback to regular sync
      await syncClipboard(content);
    }
  }, [smartSuggestionsEnabled, analyzeClipboard, currentDevice, devices, syncClipboard, user]);

  // Smart file organization suggestions
  const getSmartFileOrganization = useCallback(async (file: File) => {
    if (!smartSuggestionsEnabled) return null;

    try {
      const suggestions = await suggestFileOrganization(
        file.name, 
        file.type,
        {
          size: file.size,
          lastModified: file.lastModified,
          currentDevice: currentDevice?.device_name
        }
      );

      if (suggestions) {
        // Log AI analytics
        await supabase.from('ai_analytics').insert({
          user_id: user?.id,
          device_id: currentDevice?.id,
          event_type: 'file_transfer',
          event_data: { file_name: file.name, file_size: file.size },
          ai_context: { organization_suggested: true, suggestions },
          success: true
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Smart file organization error:', error);
      return null;
    }
  }, [smartSuggestionsEnabled, suggestFileOrganization, currentDevice, user]);

  // Smart device recommendation
  const getDeviceRecommendation = useCallback(async (task: string, context?: any) => {
    if (!smartSuggestionsEnabled || devices.length <= 1) return null;

    try {
      const recommendation = await recommendDevice(task, devices, context);

      if (recommendation) {
        // Log AI analytics
        await supabase.from('ai_analytics').insert({
          user_id: user?.id,
          device_id: currentDevice?.id,
          event_type: 'device_switch',
          event_data: { task, recommended_device: recommendation.recommended_device },
          ai_context: { recommendation },
          success: true
        });
      }

      return recommendation;
    } catch (error) {
      console.error('Device recommendation error:', error);
      return null;
    }
  }, [smartSuggestionsEnabled, recommendDevice, devices, currentDevice, user]);

  // Auto-detect and sync clipboard changes
  useEffect(() => {
    if (!autoSyncEnabled || !currentDevice) return;

    let lastClipboardContent = '';

    const checkClipboard = async () => {
      try {
        if ('clipboard' in navigator && 'readText' in navigator.clipboard) {
          const content = await navigator.clipboard.readText();
          
          if (content && content !== lastClipboardContent && content !== clipboardHistory[0]?.content) {
            lastClipboardContent = content;
            await smartClipboardSync(content);
          }
        }
      } catch (error) {
        // Clipboard access not available or denied
        console.log('Clipboard auto-sync not available');
      }
    };

    // Check clipboard every 3 seconds
    const interval = setInterval(checkClipboard, 3000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, currentDevice, clipboardHistory, smartClipboardSync]);

  // Process sync queue
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0) return;

    const itemId = processingQueue[0];
    setProcessingQueue(prev => prev.slice(1));

    // Process the queued item (placeholder for future queue processing logic)
    console.log('Processing queued item:', itemId);
  }, [processingQueue]);

  useEffect(() => {
    if (processingQueue.length > 0) {
      processQueue();
    }
  }, [processingQueue, processQueue]);

  return {
    autoSyncEnabled,
    setAutoSyncEnabled,
    smartSuggestionsEnabled,
    setSmartSuggestionsEnabled,
    smartClipboardSync,
    getSmartFileOrganization,
    getDeviceRecommendation,
    processingQueue: processingQueue.length
  };
};
