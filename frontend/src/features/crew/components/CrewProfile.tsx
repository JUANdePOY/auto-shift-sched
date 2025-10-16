import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { User, Building2, Clock, TrendingUp, Award, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { CrewProfile, CrewStats } from '../types';
import { authService } from '../../auth/services/authService';

interface CrewProfileProps {
  profile: CrewProfile | null;
  stats: CrewStats | null;
}

export function CrewProfile({ profile, stats }: CrewProfileProps) {
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

  const utilizationRate = profile.maxHoursPerWeek > 0
    ? (profile.totalHoursThisWeek / profile.maxHoursPerWeek) * 100
    : 0;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span className="text-sm">{profile.email}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Station</span>
              <Badge variant="outline">{profile.station || 'Not assigned'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Department</span>
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span className="text-sm">{profile.department}</span>
              </div>
            </div>

          </div>

          {/* Password Change Section */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert>
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Hours Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>This Week</span>
                <span>{profile.totalHoursThisWeek}h / {profile.maxHoursPerWeek}h</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {utilizationRate.toFixed(1)}% of weekly target
              </p>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="font-medium">{profile.totalHoursThisMonth}h</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average/Week</span>
              <span className="font-medium">{profile.averageHoursPerWeek}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      {stats && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Performance Stats
            </CardTitle>
            <CardDescription>
              Your work performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalHoursWorked}
                </div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.shiftsCompleted}
                </div>
                <p className="text-xs text-muted-foreground">Shifts Completed</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.averageShiftLength}h
                </div>
                <p className="text-xs text-muted-foreground">Avg Shift Length</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {stats.reliabilityScore}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Reliability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
