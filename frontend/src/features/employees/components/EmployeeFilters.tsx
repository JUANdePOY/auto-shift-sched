import { Input } from '../../shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Search, Filter } from 'lucide-react';
import type { Department, Station } from '../../shared/types';

interface EmployeeFiltersProps {
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

export function EmployeeFilters({
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
}: EmployeeFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={filterDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger>
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
        <SelectTrigger>
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
  );
}
