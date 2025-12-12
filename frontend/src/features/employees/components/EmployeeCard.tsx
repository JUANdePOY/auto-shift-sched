import { Card, CardContent } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../shared/components/ui/avatar';
import { Mail, Edit, Trash2 } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../../shared/components/ui/hover-card';
import type { Employee } from '../../shared/types';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  const getInitials = (name: string) => {
    return name.split('   ').map(n => n[0]).join('').toUpperCase();
  };

  const stations = (() => {
    if (Array.isArray(employee.station)) {
      // Handle nested array structure [[stations]]
      if (employee.station.length === 1 && Array.isArray(employee.station[0])) {
        return employee.station[0];
      }
      return employee.station;
    }
    
    if (typeof employee.station === 'string' && employee.station.length > 0) {
      return employee.station.split(/(?=[A-Z])/).filter(s => s.length > 0);
    }
    
    return [];
  })();


  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-12 h-12 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-colors">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} />
                  <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{employee.department}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {stations.length === 0 ? (
                      <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                    ) : (
                      stations.map((station, i) => (
                        <Badge key={`${station}-${i}`} className="text-xs px-2 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200" title={station}>
                          {station}
                        </Badge>
                      ))
                    )}
                  </div>
                  <div className="mt-1">
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(employee);
                    }}
                    className="p-1.5 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Edit employee"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(employee);
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete employee"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-96">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{employee.name}</h4>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
              <div className="flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                <span className="text-xs">{employee.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Station (compact chips + overflow) */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Station</p>
              <div className="flex flex-wrap gap-2">
                {stations.length === 0 ? (
                  <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                ) : (
                  stations.map((station, i) => (
                    <Badge key={`${station}-${i}`} className="text-xs px-2 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200" title={station}>
                      {station}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => onEdit(employee)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(employee)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
