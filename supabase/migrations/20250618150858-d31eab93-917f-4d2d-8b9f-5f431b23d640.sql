
-- AI suggestions and learning table
CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('clipboard_analysis', 'file_organization', 'device_recommendation', 'workflow_automation', 'content_categorization')),
  content JSONB NOT NULL,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  used BOOLEAN DEFAULT false,
  feedback_score INTEGER CHECK (feedback_score >= -1 AND feedback_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Bluetooth device discovery table
CREATE TABLE public.bluetooth_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  bluetooth_mac TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  device_capabilities JSONB DEFAULT '{}',
  signal_strength INTEGER CHECK (signal_strength >= -100 AND signal_strength <= 0),
  pairing_status TEXT DEFAULT 'discovered' CHECK (pairing_status IN ('discovered', 'pairing', 'paired', 'trusted', 'blocked')),
  last_discovered TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Connection sessions for P2P communication
CREATE TABLE public.connection_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  initiator_device_id UUID REFERENCES public.devices(id) NOT NULL,
  target_device_id UUID REFERENCES public.devices(id) NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('bluetooth', 'webrtc', 'wifi_direct', 'nfc', 'local_network')),
  session_key TEXT,
  encryption_method TEXT DEFAULT 'aes256' CHECK (encryption_method IN ('aes256', 'rsa4096', 'ecdh')),
  status TEXT DEFAULT 'connecting' CHECK (status IN ('connecting', 'active', 'disconnected', 'failed', 'timeout')),
  quality_metrics JSONB DEFAULT '{}',
  bandwidth_mbps FLOAT,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Screen sharing and remote control sessions
CREATE TABLE public.screen_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_device_id UUID REFERENCES public.devices(id) NOT NULL,
  viewer_device_id UUID REFERENCES public.devices(id) NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  session_type TEXT DEFAULT 'screen_share' CHECK (session_type IN ('screen_share', 'remote_control', 'presentation', 'mirror')),
  quality_settings JSONB DEFAULT '{"resolution": "1080p", "fps": 30, "bitrate": "auto"}',
  permissions JSONB DEFAULT '{"view": true, "control": false, "audio": false, "clipboard": false}',
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced analytics for AI learning
CREATE TABLE public.ai_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.devices(id) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('clipboard_sync', 'file_transfer', 'device_switch', 'ai_suggestion_used', 'voice_command', 'screen_share')),
  event_data JSONB NOT NULL,
  ai_context JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bluetooth_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_suggestions
CREATE POLICY "Users can manage their own AI suggestions" ON public.ai_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for bluetooth_devices
CREATE POLICY "Users can manage their own Bluetooth devices" ON public.bluetooth_devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.devices d 
      WHERE d.id = bluetooth_devices.device_id 
      AND d.user_id = auth.uid()
    )
  );

-- Create RLS policies for connection_sessions
CREATE POLICY "Users can manage their own connection sessions" ON public.connection_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for screen_sessions
CREATE POLICY "Users can manage their own screen sessions" ON public.screen_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.devices d 
      WHERE (d.id = screen_sessions.host_device_id OR d.id = screen_sessions.viewer_device_id)
      AND d.user_id = auth.uid()
    )
  );

-- Create RLS policies for ai_analytics
CREATE POLICY "Users can manage their own AI analytics" ON public.ai_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ai_suggestions_user_type ON public.ai_suggestions(user_id, suggestion_type);
CREATE INDEX idx_ai_suggestions_expires ON public.ai_suggestions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_bluetooth_devices_mac ON public.bluetooth_devices(bluetooth_mac);
CREATE INDEX idx_bluetooth_devices_device_id ON public.bluetooth_devices(device_id);
CREATE INDEX idx_connection_sessions_user_devices ON public.connection_sessions(user_id, initiator_device_id, target_device_id);
CREATE INDEX idx_connection_sessions_status ON public.connection_sessions(status, created_at);
CREATE INDEX idx_screen_sessions_devices ON public.screen_sessions(host_device_id, viewer_device_id);
CREATE INDEX idx_screen_sessions_active ON public.screen_sessions(is_active, created_at);
CREATE INDEX idx_ai_analytics_user_event ON public.ai_analytics(user_id, event_type, created_at);

-- Enable realtime for real-time sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bluetooth_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_analytics;

-- Set replica identity for realtime
ALTER TABLE public.ai_suggestions REPLICA IDENTITY FULL;
ALTER TABLE public.bluetooth_devices REPLICA IDENTITY FULL;
ALTER TABLE public.connection_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.screen_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.ai_analytics REPLICA IDENTITY FULL;

-- Create function to cleanup expired AI suggestions
CREATE OR REPLACE FUNCTION cleanup_expired_ai_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_suggestions 
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- Create trigger to update connection session metrics
CREATE OR REPLACE FUNCTION update_connection_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update bandwidth and latency if provided in quality_metrics
  IF NEW.quality_metrics IS NOT NULL THEN
    NEW.bandwidth_mbps = COALESCE((NEW.quality_metrics->>'bandwidth_mbps')::FLOAT, NEW.bandwidth_mbps);
    NEW.latency_ms = COALESCE((NEW.quality_metrics->>'latency_ms')::INTEGER, NEW.latency_ms);
  END IF;
  
  -- Set ended_at when status changes to disconnected, failed, or timeout
  IF NEW.status IN ('disconnected', 'failed', 'timeout') AND OLD.status NOT IN ('disconnected', 'failed', 'timeout') THEN
    NEW.ended_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER connection_sessions_update_metrics
  BEFORE UPDATE ON public.connection_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_metrics();
