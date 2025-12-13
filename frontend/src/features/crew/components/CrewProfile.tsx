import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { User, Building2, Clock, TrendingUp, Award, Mail, Lock, Eye, EyeOff, MapPin, ChefHat, Wine, Wrench, Briefcase, LogOut } from 'lucide-react';
import type { CrewProfile, CrewStats, CrewShift } from '../types';
import { authService } from '../../auth/services/authService';


interface CrewProfileProps {
  profile: CrewProfile | null;
  stats: CrewStats | null;
  employeeId?: string;
  upcomingShifts?: CrewShift[];
}

export function CrewProfile({ profile, stats, employeeId, upcomingShifts = [] }: CrewProfileProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  // Helper function to get station icon based on station name
  const getStationIcon = (station: string | undefined) => {
    if (!station) return MapPin;

    const stationStr = typeof station === 'string' ? station : String(station);
    const stationLower = stationStr.toLowerCase();

    // Kitchen stations
    if (stationLower.includes('grill') || stationLower.includes('prep') ||
        stationLower.includes('fry') || stationLower.includes('salad') ||
        stationLower.includes('dish') || stationLower.includes('batch') ||
        stationLower.includes('prepping')) {
      return ChefHat;
    }

    // Default
    return MapPin;
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Profile information not available</p>
        </CardContent>
      </Card>
    );
  }



  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsLoading(true);

    try {
      const result = await authService.changePassword(passwordForm);
      setPasswordSuccess(result.message);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="text-center pb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
        <p className="text-gray-600 mt-1">{profile.department}</p>
      </div>

      {/* Profile Information Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Details Grid */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Name</span>
              </div>
              <span className="font-semibold text-gray-900">{profile.name}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Email</span>
              </div>
              <span className="text-gray-900">{profile.email}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Department</span>
              </div>
              <Badge variant="outline" className="font-medium">{profile.department}</Badge>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Assigned Stations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.stations && profile.stations.length > 0 ? (
                  profile.stations.map((station, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                      {React.createElement(getStationIcon(station), { className: "w-3 h-3 text-blue-600" })}
                      <span className="text-sm font-medium text-blue-700">{station}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-600">Not assigned</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
              <p className="text-sm text-gray-600">Manage your account password and security preferences</p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
              >
                <Lock className="w-5 h-5 mr-3" />
                Change Password
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-12 text-base font-medium transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
                
            {showPasswordForm && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        className="pr-12 h-11"
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength={8}
                        className="pr-12 h-11"
                        placeholder="Enter your new password (min 8 characters)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={8}
                        className="pr-12 h-11"
                        placeholder="Confirm your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {passwordError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-700">{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-6 border-2 hover:bg-gray-50"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
