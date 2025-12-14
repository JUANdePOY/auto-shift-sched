import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../../auth/contexts/AuthContext';
import { authService } from '../../auth/services/authService';
import type { ChangePasswordData } from '../types';
import { 
  Lock,
  Settings as SettingsIcon,
  User,
  Shield,
  Mail,
  Clock,
} from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Mock system settings - in a real app, these would come from an API
  const [systemSettings, setSystemSettings] = useState<AdminSettings>({
    systemName: 'ShiftAI',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
  });

  // Mock system stats - in a real app, these would come from an API
  const systemStats: SystemStats = {
    totalEmployees: 25,
    activeSchedules: 12,
    systemUptime: '7 days, 14 hours',
    lastBackup: '2024-01-15 02:00:00',
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.changePassword(passwordData);
      if (result.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemSettingsChange = (key: keyof AdminSettings, value: string | boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSystemSettings = () => {
    // In a real app, this would save to the server
    toast.success('System settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border">
          <div className="p-3 bg-primary/10 rounded-lg">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Admin Settings
            </h1>
            <p className="text-muted-foreground mt-1">Manage system settings and account preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                Change Password
              </CardTitle>
              <CardDescription className="text-base">
                Update your account password. Make sure to choose a strong password with at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="grid gap-3">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    className="h-11"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    className="h-11"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    className="h-11"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-11 mt-6">
                  <Lock className="w-4 h-4 mr-2" />
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Account Information
              </CardTitle>
              <CardDescription className="text-base">Your current account details and profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Full Name</Label>
                  </div>
                  <p className="text-base font-medium">{user?.name || 'Not set'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Role</Label>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">{user?.role}</Badge>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Email Address</Label>
                  </div>
                  <p className="text-base font-medium">{user?.email || 'Not set'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Last Login</Label>
                  </div>
                  <p className="text-base font-medium">Today at 9:30 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
