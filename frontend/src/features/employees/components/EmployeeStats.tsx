import { Card, CardContent } from '../../shared/components/ui/card';
import { Users, TrendingUp, Clock, Star } from 'lucide-react';
import type { Employee } from '../../shared/types';

interface EmployeeStatsProps {
  employees: Employee[];
}

export function EmployeeStats({ employees }: EmployeeStatsProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.currentWeeklyHours > 0).length;
  const averageHours = employees.reduce((sum, emp) => sum + emp.currentWeeklyHours, 0) / employees.length;
  const totalWeeklyHours = employees.reduce((sum, emp) => sum + emp.currentWeeklyHours, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl">{totalEmployees}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active This Week</p>
              <p className="text-2xl text-green-600">{activeEmployees}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours/Week</p>
              <p className="text-2xl">{Math.round(averageHours)}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Weekly Hours</p>
              <p className="text-2xl text-orange-600">{totalWeeklyHours}h</p>
            </div>
            <Star className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
