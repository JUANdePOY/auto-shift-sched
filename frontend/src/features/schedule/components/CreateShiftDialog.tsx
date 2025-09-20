import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Textarea } from '../../shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Badge } from '../../shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { toast } from 'sonner';
import {
  Calendar,
  Zap,
  Plus,
  Settings,
} from 'lucide-react';

// Note: ScheduleGenerator and BulkShiftCreator components need to be created
// For now, we'll use placeholder components
const ScheduleGenerator = ({ onScheduleGenerated }: { onScheduleGenerated: (schedule: ScheduleGenerationResponse) => void }) => (
  <div className="text-center py-8">
    <p className="text-muted-foreground">Schedule generator component to be implemented</p>
    <Button onClick={() => onScheduleGenerated({ id: 1, weekStart: new Date().toISOString(), generatedAt: new Date().toISOString(), generatedBy: 1, status: 'draft' })}>
      Generate Schedule
    </Button>
  </div>
);

const BulkShiftCreator = ({ onShiftsCreated }: { onShiftsCreated: () => void }) => (
  <div className="text-center py-8">
    <p className="text-muted-foreground">Bulk shift creator component to be implemented</p>
    <Button onClick={onShiftsCreated}>Create Shifts</Button>
  </div>
);

import { getAllDepartments } from '../../employees/services/departmentService';
import type { Shift, Department, Station } from '../../shared/types';

interface ScheduleGenerationResponse {
  id: number;
  weekStart: string;
  generatedAt: string;
  generatedBy: number;
  status: 'draft' | 'published' | 'archived';
  assignments?: Array<{
    id: number;
    employeeId: number;
    shiftId: number;
    employeeName: string;
    shiftTitle: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  coverageRate?: number;
  suggestions?: Array<{
    id: number;
    type: string;
    confidence: number;
    changes: Record<string, unknown>;
    applied: boolean;
  }>;
  conflicts?: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface CreateShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftCreated?: (shift: Shift) => void;
  onScheduleGenerated?: (schedule: ScheduleGenerationResponse) => void;
}

interface ManualShiftForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  requiredEmployees: number;
  requiredStation: string[];
  description: string;
}

const CreateShiftDialog: React.FC<CreateShiftDialogProps> = ({
  isOpen,
  onClose,
  onShiftCreated,
  onScheduleGenerated
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'auto' | 'assignment'>('manual');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manualForm, setManualForm] = useState<ManualShiftForm>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    department: '',
    priority: 'medium',
    requiredEmployees: 1,
    requiredStation: [],
    description: ''
  });

  // Fetch departments and stations on component mount
  useEffect(() => {
    const fetchDepartmentsAndStations = async () => {
      try {
        setLoading(true);
        setError(null);
        const depts = await getAllDepartments();
        setDepartments(depts);
        // Flatten stations from all departments
        const allStations = depts.flatMap(dept => dept.stations);
        setStations(allStations);

        // Set default values if data is available
        if (depts.length > 0) {
          const defaultDept = depts[0];
          setManualForm(prev => ({
            ...prev,
            department: defaultDept.name
          }));

          // Set default stations (first 2 stations from the default department)
          if (defaultDept.stations.length > 0) {
            const defaultStations = defaultDept.stations.slice(0, 2).map(station => station.name);
            setManualForm(prev => ({
              ...prev,
              requiredStation: defaultStations
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError('Failed to load departments and stations');
        toast.error('Failed to load departments and stations');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentsAndStations();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create shift');
      }

      const newShift = await response.json();
      onShiftCreated?.(newShift);
      toast.success('Shift created successfully!');
      onClose();

      // Reset form
      setManualForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        department: '',
        priority: 'medium',
        requiredEmployees: 1,
        requiredStation: [],
        description: ''
      });
    } catch (error) {
      console.error('Error creating shift:', error);
      toast.error('Failed to create shift');
    }
  };

  const handleStationToggle = (station: string) => {
    setManualForm(prev => ({
      ...prev,
      requiredStation: prev.requiredStation.includes(station)
        ? prev.requiredStation.filter(s => s !== station)
        : [...prev.requiredStation, station]
    }));
  };

  const handleScheduleGenerated = (schedule: ScheduleGenerationResponse) => {
    onScheduleGenerated?.(schedule);
    toast.success('Schedule generated successfully!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Create New Shift / Schedule
          </DialogTitle>
          <DialogDescription>
            Choose between manual shift creation or automated schedule generation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'manual' | 'bulk' | 'auto' | 'assignment')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Bulk Create
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Assignment
            </TabsTrigger>
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Auto Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Manual Shift Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading departments and stations...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 text-red-600 mx-auto mb-4">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-4">
                        This might be because:
                      </p>
                      <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto mb-4">
                        <li>• The backend server is not running</li>
                        <li>• The database hasn't been set up yet</li>
                        <li>• No departments have been created</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          onClick={() => window.location.reload()}
                          variant="outline"
                          size="sm"
                        >
                          Retry Loading
                        </Button>
                        <Button
                          onClick={() => window.open('http://localhost:3001/setup-database', '_blank')}
                          variant="default"
                          size="sm"
                        >
                          Setup Database
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Shift Title *</Label>
                      <Input
                        id="title"
                        value={manualForm.title}
                        onChange={(e) => setManualForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Morning Kitchen Shift"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={manualForm.department}
                        onValueChange={(value) => setManualForm(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name.charAt(0).toUpperCase() + dept.name.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={manualForm.date}
                        onChange={(e) => setManualForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={manualForm.startTime}
                        onChange={(e) => setManualForm(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={manualForm.endTime}
                        onChange={(e) => setManualForm(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={manualForm.priority}
                        onValueChange={(value) => setManualForm(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="requiredEmployees">Required Employees</Label>
                      <Input
                        id="requiredEmployees"
                        type="number"
                        min="1"
                        max="10"
                        value={manualForm.requiredEmployees}
                        onChange={(e) => setManualForm(prev => ({ ...prev, requiredEmployees: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Required Stations/Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stations.map(station => (
                        <Badge
                          key={station.id}
                          variant={manualForm.requiredStation.includes(station.name) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleStationToggle(station.name)}
                        >
                          {station.name.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={manualForm.description}
                      onChange={(e) => setManualForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about the shift..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  <Button type="submit">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Shift
                  </Button>
                </div>
              </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Bulk Shift Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulkShiftCreator onShiftsCreated={() => {
                toast.success('Shifts created successfully!');
                onClose();
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Shift Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shiftSelect">Select Shift *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a shift to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This would be populated with available shifts */}
                        <SelectItem value="shift1">Morning Kitchen Shift - 2024-01-15</SelectItem>
                        <SelectItem value="shift2">Evening Service Shift - 2024-01-15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="employeeSelect">Select Employee *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This would be populated with available employees */}
                        <SelectItem value="emp1">John Doe</SelectItem>
                        <SelectItem value="emp2">Jane Smith</SelectItem>
                        <SelectItem value="emp3">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Employee
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automated Schedule Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShiftDialog;
