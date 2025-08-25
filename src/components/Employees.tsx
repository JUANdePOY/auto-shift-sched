import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Clock,
  Star,
  TrendingUp,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import type { Employee } from '@/types/index.ts';

interface EmployeesProps {
  employees: Employee[];
}

export function Employees({ employees }: EmployeesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const roles = [...new Set(employees.map(emp => emp.role))];

  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || emp.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'hours':
          return b.currentWeeklyHours - a.currentWeeklyHours;
        case 'utilization': {
          const aUtil = (a.currentWeeklyHours / a.maxHoursPerWeek);
          const bUtil = (b.currentWeeklyHours / b.maxHoursPerWeek);
          return bUtil - aUtil;
        }
        default:
          return 0;
      }
    });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.currentWeeklyHours > 0).length;
  const averageHours = employees.reduce((sum, emp) => sum + emp.currentWeeklyHours, 0) / employees.length;
  const totalWeeklyHours = employees.reduce((sum, emp) => sum + emp.currentWeeklyHours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage your workforce and track performance
          </p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Summary Stats */}
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>
                View and manage your team members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee List */}
          <div className="space-y-4">
            {filteredEmployees.map((employee) => {
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
                          <p className="text-sm text-muted-foreground">{employee.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{employee.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Skills */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Skills</p>
                          <div className="flex gap-1 flex-wrap max-w-32">
                            {employee.skills.slice(0, 2).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill.replace('_', ' ')}
                              </Badge>
                            ))}
                            {employee.skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.skills.length - 2}
                              </Badge>
                            )}
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
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3>No employees found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}