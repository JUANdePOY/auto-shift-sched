import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Switch } from '../../shared/components/ui/switch';
import { Separator } from '../../shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { Badge } from '../../shared/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../../auth/contexts/AuthContext';
import { authService } from '../../auth/services/authService';
import type { ChangePasswordData, AdminSettings, SystemStats } from '../types';
import { 
  Lock, 
  Settings as SettingsIcon, 
  Database, 
  Users, 
  Calendar, 
  Shield, 
  Bell, 
  Save, 
  User,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Server,
  HardDrive
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

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border">
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Server className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Activity className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
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
        </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  System Configuration
                </CardTitle>
                <CardDescription className="text-base">
                  Configure system-wide settings and preferences for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="systemName" className="text-sm font-medium">System Name</Label>
                    <Input
                      id="systemName"
                      className="h-11"
                      placeholder="Enter system name"
                      value={systemSettings.systemName}
                      onChange={(e) => handleSystemSettingsChange('systemName', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This name will appear in the application header</p>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="systemVersion" className="text-sm font-medium">System Version</Label>
                    <Input
                      id="systemVersion"
                      className="h-11 bg-muted"
                      value={systemSettings.systemVersion}
                      onChange={(e) => handleSystemSettingsChange('systemVersion', e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Version is managed automatically during updates</p>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <Label className="text-base font-medium">Maintenance Mode</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to prevent user access during system updates
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleSystemSettingsChange('maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-500" />
                          <Label className="text-base font-medium">Email Notifications</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications for important system events and alerts
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) => handleSystemSettingsChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-green-500" />
                          <Label className="text-base font-medium">Automatic Backup</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatically backup system data daily at 2:00 AM
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => handleSystemSettingsChange('autoBackup', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSystemSettings} className="w-full h-11 mt-6">
                  <Save className="w-4 h-4 mr-2" />
                  Save System Settings
                </Button>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Employees</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{systemStats.totalEmployees}</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Active crew members
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active Schedules</CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{systemStats.activeSchedules}</div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Current week schedules
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">System Uptime</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{systemStats.systemUptime.split(',')[0]}</div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Since last restart
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Last Backup</CardTitle>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{systemStats.lastBackup.split(' ')[0]}</div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    {systemStats.lastBackup.split(' ')[1]}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  System Health Monitor
                </CardTitle>
                <CardDescription className="text-base">
                  Real-time system status and health indicators for all critical services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Database Connection</span>
                    </div>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">AI Scheduling Engine</span>
                    </div>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Email Notification Service</span>
                    </div>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Backup Service</span>
                    </div>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
