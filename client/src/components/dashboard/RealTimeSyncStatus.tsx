
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Users, Smartphone } from 'lucide-react';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDevices } from '@/hooks/useDevices';

const RealTimeSyncStatus = () => {
  const { isOnline, syncStatus } = useRealTimeSync();
  const { devices } = useDevices();

  const activeDevices = devices.filter(d => d.is_active);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Real-time Sync</span>
            <Badge variant={
              syncStatus === 'connected' ? 'default' :
              syncStatus === 'syncing' ? 'secondary' : 'destructive'
            }>
              {syncStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Devices</span>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span className="text-sm font-medium">{activeDevices.length}</span>
            </div>
          </div>

          {activeDevices.length > 0 && (
            <div className="space-y-1">
              {activeDevices.slice(0, 3).map((device) => (
                <div key={device.id} className="flex items-center space-x-2 text-xs">
                  <Smartphone className="h-3 w-3" />
                  <span className="truncate">{device.device_name}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
              {activeDevices.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{activeDevices.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeSyncStatus;
