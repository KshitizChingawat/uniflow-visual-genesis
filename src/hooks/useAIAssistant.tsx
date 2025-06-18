
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AISuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'clipboard_analysis' | 'file_organization' | 'device_recommendation' | 'workflow_automation' | 'content_categorization';
  content: any;
  confidence_score: number;
  used: boolean;
  feedback_score?: number;
  created_at: string;
  expires_at?: string;
}

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const { user } = useAuth();

  // Analyze clipboard content with AI
  const analyzeClipboard = async (content: string, context?: any) => {
    if (!user || !content.trim()) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          content,
          type: 'clipboard_analysis',
          context
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('AI analysis complete');
        return data.suggestion;
      }
    } catch (error) {
      console.error('Error analyzing clipboard:', error);
      toast.error('Failed to analyze clipboard content');
    } finally {
      setLoading(false);
    }
  };

  // Get file organization suggestions
  const suggestFileOrganization = async (fileName: string, fileType: string, context?: any) => {
    if (!user || !fileName) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          content: fileName,
          type: 'file_organization',
          context: { fileType, ...context }
        }
      });

      if (error) throw error;

      if (data.success) {
        return data.suggestion;
      }
    } catch (error) {
      console.error('Error getting file organization suggestions:', error);
      toast.error('Failed to get organization suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Get device recommendations
  const recommendDevice = async (task: string, availableDevices: any[], context?: any) => {
    if (!user || !task) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          content: task,
          type: 'device_recommendation',
          context: { devices: availableDevices, ...context }
        }
      });

      if (error) throw error;

      if (data.success) {
        return data.suggestion;
      }
    } catch (error) {
      console.error('Error getting device recommendations:', error);
      toast.error('Failed to get device recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's AI suggestions
  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
  };

  // Mark suggestion as used
  const markSuggestionUsed = async (suggestionId: string, feedback?: number) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ 
          used: true,
          feedback_score: feedback 
        })
        .eq('id', suggestionId);

      if (error) throw error;
      
      // Refresh suggestions
      fetchSuggestions();
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
    }
  };

  // Provide feedback on suggestion
  const provideFeedback = async (suggestionId: string, score: number) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ feedback_score: score })
        .eq('id', suggestionId);

      if (error) throw error;
      toast.success('Feedback recorded');
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast.error('Failed to record feedback');
    }
  };

  return {
    loading,
    suggestions,
    analyzeClipboard,
    suggestFileOrganization,
    recommendDevice,
    fetchSuggestions,
    markSuggestionUsed,
    provideFeedback
  };
};
