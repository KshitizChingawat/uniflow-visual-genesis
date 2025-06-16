
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Clipboard, 
  Share, 
  Activity,
  Plus,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useClipboard } from '@/hooks/useClipboard';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { devices, currentDevice } = useDevices();
  const { clipboardHistory } = useClipboard();
  const { transfers } = useFileTransfer();

  const getDeviceIcon = (deviceType: string, platform: string) => {
    if (deviceType === 'mobile' || platform === 'android' || platform === 'ios') {
      return Smartphone;
    }
    if (deviceType === 'tablet') {
      return Tablet;
    }
    return Laptop;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'windows': return 'text-blue-600';
      case 'macos': return 'text-gray-600';
      case 'linux': return 'text-orange-600';
      case 'android': return 'text-green-600';
      case 'ios': return 'text-blue-500';
      default: return 'text-purple-600';
    }
  };

  const recentTransfers = transfers.slice(0, 5);
  const recentClipboard = clipboardHistory.slice(0, 3);
  const activeDevices = devices.filter(device => device.is_active);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your UniLink activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDevices.length}</div>
              <p className="text-xs text-muted-foreground">
                {devices.length} total devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clipboard Items</CardTitle>
              <Clipboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clipboardHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                Synced items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Transfers</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transfers.length}</div>
              <p className="text-xs text-muted-foreground">
                {transfers.filter(t => t.transfer_status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Device</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">
                {currentDevice?.device_name || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentDevice?.platform}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Your active UniLink devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDevices.length > 0 ? (
                  activeDevices.slice(0, 4).map((device) => {
                    const DeviceIcon = getDeviceIcon(device.device_type, device.platform);
                    return (
                      <div key={device.id} className="flex items-center space-x-3">
                        <DeviceIcon className={`w-5 h-5 ${getPlatformColor(device.platform)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {device.device_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {device.last_seen ? 
                              `Active ${formatDistanceToNow(new Date(device.last_seen))} ago` : 
                              'Never seen'
                            }
                          </p>
                        </div>
                        {device.id === currentDevice?.id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <Monitor className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No devices connected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clipboard */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Clipboard</CardTitle>
              <CardDescription>Latest synced clipboard items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClipboard.length > 0 ? (
                  recentClipboard.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900 truncate mb-1">
                        {item.content.length > 60 ? 
                          `${item.content.substring(0, 60)}...` : 
                          item.content
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.sync_timestamp))} ago
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Clipboard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No clipboard items yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent File Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent File Transfers</CardTitle>
            <CardDescription>Latest file transfer activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransfers.length > 0 ? (
                recentTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <Share className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transfer.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(transfer.file_size / 1024 / 1024).toFixed(2)} MB • {formatDistanceToNow(new Date(transfer.created_at))} ago
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transfer.transfer_status === 'completed' ? 'bg-green-100 text-green-800' :
                      transfer.transfer_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      transfer.transfer_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transfer.transfer_status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Share className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No file transfers yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
