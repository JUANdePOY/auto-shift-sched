import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Users } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import type { Employee } from '../../shared/types';

interface EmployeeListProps {
  filteredEmployees: Employee[];
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
}

export function EmployeeList({ 
  filteredEmployees, 
  onEditEmployee, 
  onDeleteEmployee 
}: EmployeeListProps) {
  return (
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
        <div className="space-y-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={onEditEmployee}
              onDelete={onDeleteEmployee}
            />
          ))}
          
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
  );
}
