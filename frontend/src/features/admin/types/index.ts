export interface AdminSettings {
  systemName: string;
  systemVersion: string;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  autoBackup: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SystemStats {
  totalEmployees: number;
  activeSchedules: number;
  systemUptime: string;
  lastBackup: string;
}
