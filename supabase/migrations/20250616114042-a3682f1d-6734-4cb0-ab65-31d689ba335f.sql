
-- Create device management tables
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'browser')),
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'macos', 'linux', 'android', 'ios', 'browser')),
  device_id TEXT NOT NULL UNIQUE,
  public_key TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clipboard sync table
CREATE TABLE public.clipboard_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.devices(id) NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  encrypted_content TEXT,
  sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_to_devices UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file transfers table
CREATE TABLE public.file_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  sender_device_id UUID REFERENCES public.devices(id) NOT NULL,
  receiver_device_id UUID REFERENCES public.devices(id),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  file_hash TEXT,
  transfer_status TEXT NOT NULL DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  transfer_method TEXT NOT NULL DEFAULT 'cloud' CHECK (transfer_method IN ('cloud', 'p2p', 'local')),
  encrypted_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  source_device_id UUID REFERENCES public.devices(id) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  app_name TEXT,
  notification_type TEXT DEFAULT 'general',
  is_mirrored BOOLEAN DEFAULT false,
  target_devices UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage analytics table
CREATE TABLE public.usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.devices(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('clipboard_sync', 'file_transfer', 'notification_mirror', 'device_pair')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create secure vault table
CREATE TABLE public.secure_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('clipboard', 'file', 'note')),
  encrypted_content TEXT NOT NULL,
  metadata JSONB,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipboard_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_vault ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for devices
CREATE POLICY "Users can manage their own devices" ON public.devices
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for clipboard sync
CREATE POLICY "Users can manage their own clipboard data" ON public.clipboard_sync
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for file transfers
CREATE POLICY "Users can manage their own file transfers" ON public.file_transfers
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for usage analytics
CREATE POLICY "Users can view their own analytics" ON public.usage_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for secure vault
CREATE POLICY "Users can manage their own vault items" ON public.secure_vault
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_device_id ON public.devices(device_id);
CREATE INDEX idx_clipboard_sync_user_id ON public.clipboard_sync(user_id);
CREATE INDEX idx_clipboard_sync_timestamp ON public.clipboard_sync(sync_timestamp);
CREATE INDEX idx_file_transfers_user_id ON public.file_transfers(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX idx_secure_vault_user_id ON public.secure_vault(user_id);

-- Enable realtime for real-time sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.clipboard_sync;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- Set replica identity for realtime
ALTER TABLE public.clipboard_sync REPLICA IDENTITY FULL;
ALTER TABLE public.file_transfers REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
