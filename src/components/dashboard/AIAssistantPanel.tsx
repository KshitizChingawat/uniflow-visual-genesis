
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Lightbulb, 
  Zap, 
  ThumbsUp, 
  ThumbsDown, 
  Clock,
  Sparkles,
  Target
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useSmartSync } from '@/hooks/useSmartSync';

const AIAssistantPanel = () => {
  const { 
    suggestions, 
    fetchSuggestions, 
    markSuggestionUsed, 
    provideFeedback,
    loading 
  } = useAIAssistant();
  
  const {
    smartSuggestionsEnabled,
    setSmartSuggestionsEnabled,
    autoSyncEnabled,
    setAutoSyncEnabled,
    processingQueue
  } = useSmartSync();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'clipboard_analysis': return <Lightbulb className="w-4 h-4" />;
      case 'file_organization': return <Target className="w-4 h-4" />;
      case 'device_recommendation': return <Zap className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* AI Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-unilink-600" />
            <span>AI Assistant</span>
          </CardTitle>
          <CardDescription>
            Intelligent automation and smart suggestions for your cross-device workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Smart Suggestions</p>
              <p className="text-xs text-gray-500">
                Get AI-powered recommendations for clipboard, files, and devices
              </p>
            </div>
            <Switch
              checked={smartSuggestionsEnabled}
              onCheckedChange={setSmartSuggestionsEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Auto Sync</p>
              <p className="text-xs text-gray-500">
                Automatically sync clipboard changes across devices
              </p>
            </div>
            <Switch
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
            />
          </div>

          {processingQueue > 0 && (
            <>
              <Separator />
              <div className="flex items-center space-x-2 text-sm text-unilink-600">
                <Clock className="w-4 h-4" />
                <span>{processingQueue} items in processing queue</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-unilink-600" />
              <span>Smart Suggestions</span>
            </div>
            <Badge variant="secondary">
              {suggestions.filter(s => !s.used).length} new
            </Badge>
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve your productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unilink-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Generating suggestions...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suggestions yet</h3>
              <p className="text-gray-600 text-sm">
                Start using UniLink and AI will learn your patterns to provide helpful suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.slice(0, 5).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    suggestion.used ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-unilink-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSuggestionIcon(suggestion.suggestion_type)}
                      <span className="text-sm font-medium capitalize">
                        {suggestion.suggestion_type.replace('_', ' ')}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getSuggestionColor(suggestion.confidence_score)}
                      >
                        {Math.round(suggestion.confidence_score * 100)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-3">
                    {suggestion.content.summary || suggestion.content.reason || 'AI suggestion'}
                  </div>

                  {!suggestion.used && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => markSuggestionUsed(suggestion.id, 1)}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Use</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => provideFeedback(suggestion.id, -1)}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>Dismiss</span>
                      </Button>
                    </div>
                  )}

                  {suggestion.used && (
                    <Badge variant="outline" className="text-xs">
                      Used
                    </Badge>
                  )}
                </div>
              ))}

              {suggestions.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All Suggestions ({suggestions.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistantPanel;
