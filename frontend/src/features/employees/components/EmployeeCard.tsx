import { Card, CardContent } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Avatar, AvatarFallback } from '../../shared/components/ui/avatar';
import { Mail, Edit, Trash2 } from 'lucide-react';
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

  const stations: string[] = (() => {
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
    <Card className={`hover:shadow-lg hover:scale-105 transition-all duration-300 border cursor-pointer group bg-white ${
      employee.status === 'inactive'
        ? 'border-red-200 hover:border-red-400 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 opacity-75'
        : 'border-gray-200  hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50'
    }`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar className="w-14 h-14 ring-2 ring-gray-100 group-hover:ring-slate-300 transition-all duration-300 shadow-sm">
                  <AvatarFallback className="bg-gray-400 text-white font-bold text-lg">{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-slate-900 transition-colors">{employee.name}</h3>
                    {employee.role && (
                      <Badge variant={employee.role === 'admin' ? 'destructive' : employee.role === 'manager' ? 'default' : 'secondary'} className="text-xs">
                        {employee.role}
                      </Badge>
                    )}
                    <Badge 
                      variant={employee.status === 'inactive' ? 'destructive' : 'default'} 
                      className={`text-xs ${
                        employee.status === 'inactive' 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        employee.status === 'inactive' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      {employee.status === 'inactive' ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate font-medium">{employee.department}</p>
<div className="mt-2 flex flex-wrap gap-1.5">
                     {stations.length === 0 ? (
                       <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">Unassigned</Badge>
                     ) : (
                       stations.slice(0, 3).map((station: string, i: number) => (
                         <Badge key={`${station}-${i}`} className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 font-medium" title={station}>
                           {station}
                         </Badge>
                       ))
                     )}
                    {stations.length > 3 && (
                      <Badge className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        +{stations.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Mail className="w-3 h-3" />
                    {employee.email}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(employee);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md bg-white border border-blue-200 hover:border-blue-300"
                  aria-label="Edit employee"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(employee);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md bg-white border border-red-200 hover:border-red-300"
                  aria-label="Delete employee"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </CardContent>
    </Card>
  );
}
