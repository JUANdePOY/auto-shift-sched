import { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { EmployeeModal } from './EmployeeModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../shared/components/ui/alert-dialog';
import { useEmployees } from '../hooks/useEmployees';
import { getAllDepartments } from '../services/departmentService';
import { EmployeeStats } from './EmployeeStats';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeList } from './EmployeeList';
import type { Employee, Department, Station } from '../../shared/types';

export function Employees() {
  const { employees, addEmployee, editEmployee, removeEmployee, loading, error, fetchEmployees } = useEmployees();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const depts = await getAllDepartments();
        setDepartments(depts);
        // Flatten stations from all departments
        const allStations = depts.flatMap(dept => dept.stations);
        setStations(allStations);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    }
    fetchDepartments();
  }, []);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingEmployee) {
      try {
        await removeEmployee(deletingEmployee.id);
        setIsDeleteDialogOpen(false);
        setDeletingEmployee(null);
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  const handleModalSubmit = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      if (editingEmployee) {
        await editEmployee(editingEmployee.id, employeeData);
      } else {
        await addEmployee(employeeData);
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Failed to save employee:', error);
    }
  };

  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
      const matchesStation = filterStation === 'all' || 
                            (Array.isArray(emp.station) 
                              ? emp.station.includes(filterStation)
                              : emp.station === filterStation);
      return matchesSearch && matchesDepartment && matchesStation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'department':
          return a.department.localeCompare(b.department);
        case 'station': {
          // Handle both string and array of strings for station
          const aStation = Array.isArray(a.station) ? a.station.join(', ') : a.station;
          const bStation = Array.isArray(b.station) ? b.station.join(', ') : b.station;
          return aStation.localeCompare(bStation);
        }
        case 'role': {
          // Handle both string and array of strings for station (role)
          const aStation = Array.isArray(a.station) ? a.station.join(', ') : a.station;
          const bStation = Array.isArray(b.station) ? b.station.join(', ') : b.station;
          return aStation.localeCompare(bStation);
        }
        case 'utilization': {
          const aUtil = (a.currentWeeklyHours / a.maxHoursPerWeek);
          const bUtil = (b.currentWeeklyHours / b.maxHoursPerWeek);
          return bUtil - aUtil;
        }
        default:
          return 0;
      }
    });

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
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
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Loading employees...</h3>
          <p className="text-muted-foreground">Please wait while we fetch your team data.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
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
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 text-red-600 mx-auto mb-4">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-600">Failed to load employees</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchEmployees} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
        
        <Button onClick={handleAddEmployee}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Summary Stats */}
      <EmployeeStats employees={employees} />

      {/* Filters and Employee List */}
      <EmployeeFilters
        searchTerm={searchTerm}
        filterDepartment={filterDepartment}
        filterStation={filterStation}
        sortBy={sortBy}
        departments={departments}
        stations={stations}
        onSearchChange={setSearchTerm}
        onDepartmentChange={setFilterDepartment}
        onStationChange={setFilterStation}
        onSortChange={setSortBy}
      />

      <EmployeeList
        filteredEmployees={filteredEmployees}
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
      />

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingEmployee}
        departments={departments}
        stations={stations}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee{' '}
              <strong>{deletingEmployee?.name}</strong> from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
