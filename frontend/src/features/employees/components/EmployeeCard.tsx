import { Card, CardContent } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../shared/components/ui/avatar';
import { Mail, Filter } from 'lucide-react';
import type { Employee } from '../../shared/types';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const utilization = (employee.currentWeeklyHours / employee.maxHoursPerWeek) * 100;

  return (
    <Card key={employee.id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3>{employee.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{employee.department}</span>
                <Filter className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{employee.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Station */}
            <div className="min-w-32">
              <p className="text-center text-xs text-muted-foreground mb-1">Station</p>
              <div className="flex gap-1 flex-wrap items-start">
                {Array.isArray(employee.station) 
                  ? employee.station.map((station, index) => (
                      <Badge key={index} variant="secondary">{station}</Badge>
                    ))
                  : employee.station 
                    ? <Badge variant="secondary">{employee.station}</Badge>
                    : <Badge variant="secondary">Unassigned</Badge>}
              </div>
            </div>

            {/* Utilization */}
            <div className="text-center min-w-20">
              <p className="text-xs text-muted-foreground mb-1">Utilization</p>
              <p className={`text-sm ${getUtilizationColor(utilization)}`}>
                {Math.round(utilization)}%
              </p>
              <Progress value={utilization} className="h-1 w-16 mx-auto" />
            </div>

            {/* Hours */}
            <div className="text-center min-w-16">
              <p className="text-xs text-muted-foreground mb-1">Hours</p>
              <p className="text-sm">
                {employee.currentWeeklyHours}/{employee.maxHoursPerWeek}h
              </p>
            </div>

            {/* Availability */}
            <div className="text-center min-w-16">
              <p className="text-xs text-muted-foreground mb-1">Available Days</p>
              <p className="text-sm">
                {Object.values(employee.availability).filter(day => day.available).length}/7
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => onEdit(employee)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                aria-label="Edit employee"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button 
                onClick={() => onDelete(employee)}
                className="p-2 hover:bg-muted rounded-md transition-colors text-destructive"
                aria-label="Delete employee"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
