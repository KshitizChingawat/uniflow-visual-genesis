import { useState, useEffect } from 'react';
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
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const { user } = useAuth();

  // Fetch AI suggestions
  const fetchSuggestions = async () => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('/api/ai-suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Fetch AI suggestions error:', data.error);
        return;
      }

      setSuggestions(data || []);
    } catch (err) {
      console.error('Fetch AI suggestions error:', err);
    }
  };

  // Analyze clipboard content
  const analyzeClipboardContent = async (content: string) => {
    if (!user || !assistantEnabled) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          suggestion_type: 'clipboard_analysis',
          content: { text: content }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Analyze clipboard error:', data.error);
        return;
      }

      await fetchSuggestions();
      return data;
    } catch (err) {
      console.error('Analyze clipboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get file organization suggestions
  const getFileOrganizationSuggestion = async (fileName: string, fileType: string, fileSize: number) => {
    if (!user || !assistantEnabled) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          suggestion_type: 'file_organization',
          content: { fileName, fileType, fileSize }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('File organization suggestion error:', data.error);
        return;
      }

      await fetchSuggestions();
      return data;
    } catch (err) {
      console.error('File organization suggestion error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get device recommendations
  const getDeviceRecommendations = async (deviceData: any) => {
    if (!user || !assistantEnabled) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          suggestion_type: 'device_recommendation',
          content: deviceData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Device recommendation error:', data.error);
        return;
      }

      return data;
    } catch (err) {
      console.error('Device recommendation error:', err);
    }
  };

  // Mark suggestion as used
  const markSuggestionUsed = async (suggestionId: string, feedbackScore?: number) => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/ai-suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          used: true,
          feedback_score: feedbackScore
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Mark suggestion used error:', data.error);
        return;
      }

      await fetchSuggestions();
      toast.success('Feedback recorded');
    } catch (err) {
      console.error('Mark suggestion used error:', err);
    }
  };

  // Dismiss suggestion
  const dismissSuggestion = async (suggestionId: string) => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/ai-suggestions/${suggestionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Dismiss suggestion error:', data.error);
        return;
      }

      await fetchSuggestions();
    } catch (err) {
      console.error('Dismiss suggestion error:', err);
    }
  };

  // Toggle AI assistant
  const toggleAssistant = (enabled: boolean) => {
    setAssistantEnabled(enabled);
    localStorage.setItem('aiAssistantEnabled', enabled.toString());
    toast.success(enabled ? 'AI Assistant enabled' : 'AI Assistant disabled');
  };

  // Get suggestions by type
  const getSuggestionsByType = (type: string) => {
    return suggestions.filter(s => s.suggestion_type === type && !s.used);
  };

  // Get smart content analysis
  const getSmartContentAnalysis = (content: string) => {
    const analysis = {
      type: 'unknown',
      confidence: 0,
      suggestions: []
    };

    // URL analysis
    if (content.match(/https?:\/\/[^\s]+/)) {
      analysis.type = 'url';
      analysis.confidence = 0.9;
      analysis.suggestions = ['Save to bookmarks', 'Share with team', 'Archive for later'];
    }
    // Email analysis
    else if (content.match(/[\w.-]+@[\w.-]+\.\w+/)) {
      analysis.type = 'email';
      analysis.confidence = 0.85;
      analysis.suggestions = ['Add to contacts', 'Send email', 'Save to CRM'];
    }
    // Phone number analysis
    else if (content.match(/[\+]?[\d\s\-\(\)]{10,}/)) {
      analysis.type = 'phone';
      analysis.confidence = 0.8;
      analysis.suggestions = ['Add to contacts', 'Make call', 'Send SMS'];
    }
    // Code analysis
    else if (content.includes('function') || content.includes('class') || content.includes('import')) {
      analysis.type = 'code';
      analysis.confidence = 0.75;
      analysis.suggestions = ['Save as snippet', 'Format code', 'Share with team'];
    }
    // Text analysis
    else if (content.length > 50) {
      analysis.type = 'text';
      analysis.confidence = 0.6;
      analysis.suggestions = ['Save as note', 'Create task', 'Share'];
    }

    return analysis;
  };

  // Initialize settings
  useEffect(() => {
    const savedEnabled = localStorage.getItem('aiAssistantEnabled');
    if (savedEnabled !== null) {
      setAssistantEnabled(savedEnabled === 'true');
    }
  }, []);

  useEffect(() => {
    if (user && assistantEnabled) {
      fetchSuggestions();
    }
  }, [user, assistantEnabled]);

  return {
    suggestions,
    loading,
    assistantEnabled,
    analyzeClipboardContent,
    getFileOrganizationSuggestion,
    getDeviceRecommendations,
    markSuggestionUsed,
    dismissSuggestion,
    toggleAssistant,
    getSuggestionsByType,
    getSmartContentAnalysis,
    fetchSuggestions
  };
};