
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileTransfer, Trash2, X } from 'lucide-react';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useDevices } from '@/hooks/useDevices';

const FileTransferPage = () => {
  const { transfers, loading, initiateTransfer, cancelTransfer } = useFileTransfer();
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await initiateTransfer(file, selectedDevice || undefined);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTransferProgress = (transfer: any) => {
    switch (transfer.transfer_status) {
      case 'completed': return 100;
      case 'in_progress': return 50; // This would be calculated based on actual progress
      case 'pending': return 0;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File Transfer</h1>
        <p className="text-gray-600 mt-2">Send files securely between your connected devices</p>
      </div>

      {/* Upload New File */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Send File</span>
          </CardTitle>
          <CardDescription>
            Select a file to transfer to another device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Device (optional)
              </label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Send to all devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All connected devices</SelectItem>
                  {devices.filter(d => d.is_active).map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.device_name} ({device.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-unilink-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a file to transfer</h3>
            <p className="text-gray-600 mb-4">
              Select any file from your device to send
            </p>
            <Button onClick={handleFileSelect} disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileTransfer className="w-5 h-5" />
            <span>Transfer History</span>
          </CardTitle>
          <CardDescription>
            Track your file transfer activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <FileTransfer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No file transfers</h3>
              <p className="text-gray-600">
                Start transferring files to see them appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{transfer.file_name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(transfer.file_size)} • {transfer.file_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transfer.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(transfer.transfer_status)}>
                        {transfer.transfer_status.replace('_', ' ')}
                      </Badge>
                      {transfer.transfer_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelTransfer(transfer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {(transfer.transfer_status === 'in_progress' || transfer.transfer_status === 'pending') && (
                    <div className="mb-3">
                      <Progress value={getTransferProgress(transfer)} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Method: {transfer.transfer_method}</span>
                    {transfer.completed_at && (
                      <span>Completed: {new Date(transfer.completed_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileTransferPage;
