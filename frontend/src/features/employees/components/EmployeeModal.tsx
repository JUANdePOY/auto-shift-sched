import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Checkbox } from '../../shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../shared/components/ui/dialog';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';
import { Separator } from '../../shared/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Lock, Shield, Building2, MapPin, Clock, Activity, UserPlus, UserCheck } from 'lucide-react';
import type { Employee, Department, Station, WeeklyAvailability } from '../../shared/types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Omit<Employee, 'id'>) => Promise<void>;
  initialData?: Employee | null;
  departments: Department[];
  stations: Station[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSubmit, initialData, departments, stations }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'crew'>('crew');
  const [department, setDepartment] = useState<'Service' | 'Production'>('Service');
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(40);
  const [currentWeeklyHours, setCurrentWeeklyHours] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [availability, setAvailability] = useState<WeeklyAvailability | undefined>(undefined);

  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPassword(''); // Don't populate password for editing
      setRole(initialData.role || 'crew');
      setDepartment((initialData.department as 'Service' | 'Production') || 'Service');
      
      // Handle station array properly - flatten nested arrays
      let stationArray: string[] = [];
      if (Array.isArray(initialData.station)) {
        // Handle nested array structure [[stations]] or [stations]
        stationArray = initialData.station.flat();
      } else if (initialData.station) {
        stationArray = [initialData.station];
      }
      setSelectedStations(stationArray);
      
      setMaxHoursPerWeek(initialData.maxHoursPerWeek || 40);
      setCurrentWeeklyHours(initialData.currentWeeklyHours || 0);
      setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
      setAvailability(initialData.availability);
    } else if (!initialData && isOpen) {
      setName('');
      setEmail('');
      setPassword(''); // Will be set to name when creating
      setRole('crew');
      setDepartment('Service');
      setSelectedStations([]);
      setMaxHoursPerWeek(40);
      setCurrentWeeklyHours(0);
      setIsActive(true);
      setAvailability(undefined);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    try {
      const employeeData = {
        name,
        email,
        password: initialData ? undefined : (password || name), // Use provided password or default to name for new employees
        role,
        department,
        station: selectedStations,
        maxHoursPerWeek,
        currentWeeklyHours,
        isActive,
        availability: availability || {
          monday: { available: false },
          tuesday: { available: false },
          wednesday: { available: false },
          thursday: { available: false },
          friday: { available: false },
          saturday: { available: false },
          sunday: { available: false },
        }
      };
      await onSubmit(employeeData);
      onClose();
    } catch (error) {
      toast.error('Failed to save employee');
      console.error('Error saving employee:', error);
    }
  };

  const handleStationChange = (stationName: string, checked: boolean) => {
    if (checked) {
      setSelectedStations(prev => [...prev, stationName]);
    } else {
      setSelectedStations(prev => prev.filter(name => name !== stationName));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              initialData 
                ? 'bg-blue-100 dark:bg-blue-900/20' 
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {initialData ? (
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {initialData ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
              <DialogDescription className="text-base">
                {initialData 
                  ? 'Update employee information and settings' 
                  : 'Create a new employee profile with role and station assignments'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Basic Information
              </h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter employee's name"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email Address
                  {role === 'crew' && (
                    <Badge variant="outline" className="text-xs ml-2">Optional</Badge>
                  )}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'crew' ? "Optional for crew members" : "employee@company.com"}
                  className="h-10"
                />
              </div>

              {!initialData && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to use name as password"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    If left blank, the employee's name will be used as the default password
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Role & Department Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Role & Department
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Role
                </Label>
                <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'manager' | 'crew')}>
                  <SelectTrigger id="role" name="role" className="h-10">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crew">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Crew</Badge>
                        <span>Team Member</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">Manager</Badge>
                        <span>Department Manager</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Admin</Badge>
                        <span>System Administrator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  Department
                </Label>
                <Select value={department} onValueChange={(value) => {
                  setDepartment(value as 'Service' | 'Production');
                  setSelectedStations([]);
                }}>
                  <SelectTrigger id="department" name="department" className="h-10">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.name}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stations Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Station Assignments
              </h3>
              {selectedStations.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {selectedStations.length} selected
                </Badge>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              {(() => {
                const selectedDept = departments.find(dept => dept.name === department);
                if (!selectedDept) {
                  return (
                    <div className="text-center py-4">
                      <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Select a department first to view available stations</p>
                    </div>
                  );
                }
                
                const deptStations = selectedDept.stations || [];
                
                if (deptStations.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No stations available for this department</p>
                    </div>
                  );
                }
                
                return (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {deptStations.map(station => {
                      const isSelected = selectedStations.includes(station.name);
                      return (
                        <Button
                          key={station.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStationChange(station.name, !isSelected)}
                          className={`h-9 transition-all duration-200 ${
                            isSelected 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                              : 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <MapPin className="w-3 h-3 mr-2" />
                          {station.name}
                        </Button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          <Separator />

          {/* Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Work Settings
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxHours" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Max Hours per Week
                </Label>
                <Input
                  id="maxHours"
                  name="maxHours"
                  type="number"
                  min="1"
                  max="80"
                  value={maxHoursPerWeek}
                  onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive" className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Employment Status
                </Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={(value) => setIsActive(value === 'active')}>
                  <SelectTrigger id="isActive" name="isActive" className="h-10">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>Inactive</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="h-10 px-6">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="h-10 px-6">
            {initialData ? (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Update Employee
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Employee
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
