import { Users, TrendingUp, Clock, Activity } from 'lucide-react';
import type { Employee } from '../../shared/types';

interface EmployeeStatsProps {
  employees: Employee[];
}

export function EmployeeStats({ employees }: EmployeeStatsProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.currentWeeklyHours > 0).length;
  const averageHours = employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.currentWeeklyHours, 0) / employees.length : 0;
  const averageUtilization = employees.length > 0 ? employees.reduce((sum, emp) => sum + (emp.currentWeeklyHours / emp.maxHoursPerWeek), 0) / employees.length * 100 : 0;

  const stats = [
    {
      icon: Users,
      label: 'Total Employees',
      value: totalEmployees,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Activity,
      label: 'Active This Week',
      value: activeEmployees,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Clock,
      label: 'Avg Hours/Week',
      value: `${Math.round(averageHours)}h`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: TrendingUp,
      label: 'Avg Utilization',
      value: `${Math.round(averageUtilization)}%`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 truncate">{stat.label}</p>
            <p className={`text-sm font-semibold ${stat.color} truncate`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
