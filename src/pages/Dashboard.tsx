
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHome from '@/components/dashboard/DashboardHome';
import DevicesPage from '@/components/dashboard/DevicesPage';
import ClipboardPage from '@/components/dashboard/ClipboardPage';
import FileTransferPage from '@/components/dashboard/FileTransferPage';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-unilink-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/clipboard" element={<ClipboardPage />} />
        <Route path="/files" element={<FileTransferPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
