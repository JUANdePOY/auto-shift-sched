import { Card, CardContent } from '../../shared/components/ui/card';
import { Input } from '../../shared/components/ui/input';
import { Button } from '../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Search, Filter, Users, Plus } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import type { Employee, Department, Station } from '../../shared/types';

interface EmployeeListProps {
  filteredEmployees: Employee[];
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onAddEmployee: () => void;
  searchTerm: string;
  filterDepartment: string;
  filterStation: string;
  sortBy: string;
  departments: Department[];
  stations: Station[];
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function EmployeeList({
  filteredEmployees,
  onEditEmployee,
  onDeleteEmployee,
  onAddEmployee,
  searchTerm,
  filterDepartment,
  filterStation,
  sortBy,
  departments,
  stations,
  onSearchChange,
  onDepartmentChange,
  onStationChange,
  onSortChange
}: EmployeeListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search employees by name or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filters - Right Aligned */}
          <div className="flex items-center gap-3">
            <Select value={filterDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger className="w-40 h-10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStation} onValueChange={onStationChange}>
              <SelectTrigger className="w-36 h-10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                {stations.map(station => (
                  <SelectItem key={station.id} value={station.name}>{station.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-36 h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onAddEmployee} className="h-10 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={onEditEmployee}
              onDelete={onDeleteEmployee}
            />
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3>No employees found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
