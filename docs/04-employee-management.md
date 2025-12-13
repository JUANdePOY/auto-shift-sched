# Employee Management System Documentation

## Overview

The Employee Management System provides comprehensive tools for managing workforce data, including employee profiles, department assignments, skill tracking, and performance monitoring. It serves as the foundation for all scheduling and availability operations.

## Architecture

### Core Components

#### 1. Employee Management Interface (`Employees.tsx`)
**Location**: `frontend/src/features/employees/components/Employees.tsx`

**Purpose**: Main administrative interface for employee management operations

**Key Features**:
- Employee CRUD operations (Create, Read, Update, Delete)
- Advanced filtering and search capabilities
- Department and station management
- Role-based access control
- Real-time employee statistics
- Bulk operations support

#### 2. Employee Service (`employeeService.ts`)
**Location**: `frontend/src/features/employees/services/employeeService.ts`

**Purpose**: Frontend service layer for employee API operations

**Key Responsibilities**:
- API communication for employee operations
- Data transformation and validation
- Error handling and retry logic
- Caching and performance optimization

### Frontend Implementation

#### Main Component Logic

```typescript
export function Employees() {
  // Core state management
  const { employees, addEmployee, editEmployee, removeEmployee, loading, error, fetchEmployees } = useEmployees(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // Modal and dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load departments and stations on component mount
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
}
```

#### Advanced Filtering Logic

```typescript
// Comprehensive employee filtering system
const filteredEmployees = employees
  .filter(emp => {
    // Text search across name and email
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Department filtering
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    
    // Station filtering (supports both string and array formats)
    const matchesStation = filterStation === 'all' || 
                          (Array.isArray(emp.station) 
                            ? emp.station.includes(filterStation)
                            : emp.station === filterStation);
    
    // Role filtering
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    
    // Status filtering (active/inactive)
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? emp.isActive !== false : emp.isActive === false);
    
    return matchesSearch && matchesDepartment && matchesStation && matchesRole && matchesStatus;
  })
  .sort((a, b) => {
    // Multi-criteria sorting system
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
        const aRole = a.role || 'crew';
        const bRole = b.role || 'crew';
        return aRole.localeCompare(bRole);
      }
      case 'utilization': {
        // Sort by current utilization percentage
        const aUtil = (a.currentWeeklyHours / a.maxHoursPerWeek);
        const bUtil = (b.currentWeeklyHours / b.maxHoursPerWeek);
        return bUtil - aUtil; // Descending order
      }
      default:
        return 0;
    }
  });
```

#### Employee Operations Handlers

```typescript
// Add new employee
const handleAddEmployee = () => {
  setEditingEmployee(null);
  setIsModalOpen(true);
};

// Edit existing employee
const handleEditEmployee = (employee: Employee) => {
  setEditingEmployee(employee);
  setIsModalOpen(true);
};

// Delete employee with confirmation
const handleDeleteEmployee = (employee: Employee) => {
  setDeletingEmployee(employee);
  setIsDeleteDialogOpen(true);
};

// Confirm deletion
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

// Submit employee form (create or update)
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
```

#### Loading and Error States

```typescript
// Loading state with skeleton UI
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

// Error state with retry option
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
```

### Employee List Component (`EmployeeList.tsx`)

#### Advanced Table Implementation

```typescript
// Employee list with advanced features
export function EmployeeList({
  filteredEmployees,
  onEditEmployee,
  onDeleteEmployee,
  onAddEmployee,
  searchTerm,
  filterDepartment,
  filterStation,
  filterRole,
  filterStatus,
  sortBy,
  departments,
  stations,
  onSearchChange,
  onDepartmentChange,
  onStationChange,
  onRoleChange,
  onStatusChange,
  onSortChange
}: EmployeeListProps) {
  return (
    <div className="space-y-6">
      {/* Advanced Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search Employees</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={filterDepartment} onValueChange={onDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Station Filter */}
            <div>
              <Label htmlFor="station">Station</Label>
              <Select value={filterStation} onValueChange={onStationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.name}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={filterRole} onValueChange={onRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredEmployees.filter(emp => emp.isActive !== false).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    filteredEmployees.reduce((sum, emp) => 
                      sum + (emp.currentWeeklyHours / emp.maxHoursPerWeek * 100), 0
                    ) / filteredEmployees.length
                  ) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee Directory</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort">Sort by:</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="station">Station</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Station(s)</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <EmployeeRow
                      key={employee.id}
                      employee={employee}
                      onEdit={onEditEmployee}
                      onDelete={onDeleteEmployee}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState onAddEmployee={onAddEmployee} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Employee Modal Component (`EmployeeModal.tsx`)

#### Comprehensive Form Implementation

```typescript
export function EmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  stations
}: EmployeeModalProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    department: '',
    station: [],
    role: 'crew',
    maxHoursPerWeek: 40,
    currentWeeklyHours: 0,
    isActive: true,
    availability: getDefaultAvailability()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          department: initialData.department || '',
          station: Array.isArray(initialData.station) ? initialData.station : [initialData.station || ''],
          role: initialData.role || 'crew',
          maxHoursPerWeek: initialData.maxHoursPerWeek || 40,
          currentWeeklyHours: initialData.currentWeeklyHours || 0,
          isActive: initialData.isActive !== false,
          availability: initialData.availability || getDefaultAvailability()
        });
      } else {
        setFormData({
          name: '',
          email: '',
          department: '',
          station: [],
          role: 'crew',
          maxHoursPerWeek: 40,
          currentWeeklyHours: 0,
          isActive: true,
          availability: getDefaultAvailability()
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (formData.station.length === 0) {
      newErrors.station = 'At least one station is required';
    }

    if (formData.maxHoursPerWeek < 1 || formData.maxHoursPerWeek > 80) {
      newErrors.maxHoursPerWeek = 'Max hours must be between 1 and 80';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save employee:', error);
      setErrors({ submit: 'Failed to save employee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stations for selected department
  const departmentStations = stations.filter(station => 
    departments.find(dept => dept.name === formData.department)?.stations.some(s => s.id === station.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update employee information and settings.'
              : 'Enter the details for the new employee.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Department and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  department: value,
                  station: [] // Reset stations when department changes
                }))}
              >
                <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'admin' | 'crew') => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crew">Crew Member</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stations */}
          <div>
            <Label>Stations/Skills *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {departmentStations.map((station) => (
                <div key={station.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`station-${station.id}`}
                    checked={formData.station.includes(station.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          station: [...prev.station, station.name]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          station: prev.station.filter(s => s !== station.name)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={`station-${station.id}`} className="text-sm">
                    {station.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.station && <p className="text-sm text-red-500 mt-1">{errors.station}</p>}
          </div>

          {/* Work Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxHours">Max Hours Per Week</Label>
              <Input
                id="maxHours"
                type="number"
                min="1"
                max="80"
                value={formData.maxHoursPerWeek}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxHoursPerWeek: parseInt(e.target.value) || 40 
                }))}
                className={errors.maxHoursPerWeek ? 'border-red-500' : ''}
              />
              {errors.maxHoursPerWeek && <p className="text-sm text-red-500 mt-1">{errors.maxHoursPerWeek}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isActive: checked as boolean 
                }))}
              />
              <Label htmlFor="isActive">Active Employee</Label>
            </div>
          </div>

          {/* Default Availability */}
          <div>
            <Label>Default Availability</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Set the default availability pattern for this employee. They can override this when submitting weekly availability.
            </p>
            <AvailabilityEditor
              availability={formData.availability}
              onChange={(availability) => setFormData(prev => ({ ...prev, availability }))}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                initialData ? 'Update Employee' : 'Add Employee'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Backend Implementation

#### Employee Routes (`employees.js`)
**Location**: `server/features/employees/routes/employees.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../../../shared/config/database');
const { validateEmployee } = require('../validation/employeeValidation');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { includeAdmins = 'false', department, status, search } = req.query;
    
    let query = 'SELECT * FROM employees';
    const conditions = [];
    const params = [];

    // Filter by role
    if (includeAdmins === 'false') {
      conditions.push('(role != ? OR role IS NULL)');
      params.push('admin');
    }

    // Filter by department
    if (department && department !== 'all') {
      conditions.push('department = ?');
      params.push(department);
    }

    // Filter by status
    if (status === 'active') {
      conditions.push('(isActive = 1 OR isActive IS NULL)');
    } else if (status === 'inactive') {
      conditions.push('isActive = 0');
    }

    // Search filter
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name';

    const [results] = await db.query(query, params);
    
    // Format results
    const employees = results.map(employee => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      station: employee.station ? JSON.parse(employee.station) : [],
      role: employee.role || 'crew',
      maxHoursPerWeek: employee.maxHoursPerWeek || 40,
      currentWeeklyHours: employee.currentWeeklyHours || 0,
      isActive: employee.isActive !== 0,
      availability: employee.availability ? JSON.parse(employee.availability) : getDefaultAvailability()
    }));

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM employees WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = results[0];
    res.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      station: employee.station ? JSON.parse(employee.station) : [],
      role: employee.role || 'crew',
      maxHoursPerWeek: employee.maxHoursPerWeek || 40,
      currentWeeklyHours: employee.currentWeeklyHours || 0,
      isActive: employee.isActive !== 0,
      availability: employee.availability ? JSON.parse(employee.availability) : getDefaultAvailability()
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const validation = validateEmployee(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors });
    }

    const {
      name,
      email,
      department,
      station,
      role = 'crew',
      maxHoursPerWeek = 40,
      currentWeeklyHours = 0,
      isActive = true,
      availability
    } = req.body;

    // Check for duplicate email
    const [existing] = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const [result] = await db.query(
      `INSERT INTO employees (name, email, department, station, role, maxHoursPerWeek, currentWeeklyHours, isActive, availability) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        department,
        JSON.stringify(station),
        role,
        maxHoursPerWeek,
        currentWeeklyHours,
        isActive,
        JSON.stringify(availability || getDefaultAvailability())
      ]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      department,
      station,
      role,
      maxHoursPerWeek,
      currentWeeklyHours,
      isActive,
      availability: availability || getDefaultAvailability()
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateEmployee(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors });
    }

    const {
      name,
      email,
      department,
      station,
      role,
      maxHoursPerWeek,
      currentWeeklyHours,
      isActive,
      availability
    } = req.body;

    // Check if employee exists
    const [existing] = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check for duplicate email (excluding current employee)
    const [emailCheck] = await db.query('SELECT id FROM employees WHERE email = ? AND id != ?', [email, id]);
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    await db.query(
      `UPDATE employees SET name = ?, email = ?, department = ?, station = ?, role = ?, 
       maxHoursPerWeek = ?, currentWeeklyHours = ?, isActive = ?, availability = ? WHERE id = ?`,
      [
        name,
        email,
        department,
        JSON.stringify(station),
        role,
        maxHoursPerWeek,
        currentWeeklyHours,
        isActive,
        JSON.stringify(availability),
        id
      ]
    );

    res.json({
      id: parseInt(id),
      name,
      email,
      department,
      station,
      role,
      maxHoursPerWeek,
      currentWeeklyHours,
      isActive,
      availability
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [existing] = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check for existing assignments
    const [assignments] = await db.query('SELECT id FROM schedule_assignments WHERE employee_id = ?', [id]);
    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete employee with existing schedule assignments. Please remove assignments first.' 
      });
    }

    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Helper function for default availability
function getDefaultAvailability() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const availability = {};
  
  days.forEach(day => {
    availability[day] = {
      available: true,
      preferredStart: '09:00',
      preferredEnd: '17:00'
    };
  });
  
  return availability;
}

module.exports = router;
```

#### Employee Validation (`employeeValidation.js`)

```javascript
// Employee data validation
function validateEmployee(data) {
  const errors = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.department || typeof data.department !== 'string' || data.department.trim().length === 0) {
    errors.push('Department is required');
  }

  if (!data.station || !Array.isArray(data.station) || data.station.length === 0) {
    errors.push('At least one station is required');
  }

  // Optional fields validation
  if (data.role && !['admin', 'crew'].includes(data.role)) {
    errors.push('Role must be either "admin" or "crew"');
  }

  if (data.maxHoursPerWeek !== undefined) {
    const maxHours = parseInt(data.maxHoursPerWeek);
    if (isNaN(maxHours) || maxHours < 1 || maxHours > 80) {
      errors.push('Max hours per week must be between 1 and 80');
    }
  }

  if (data.currentWeeklyHours !== undefined) {
    const currentHours = parseInt(data.currentWeeklyHours);
    if (isNaN(currentHours) || currentHours < 0) {
      errors.push('Current weekly hours must be 0 or greater');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = { validateEmployee };
```

### Data Types and Interfaces

```typescript
// Employee data types
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  station: string[];
  role: 'admin' | 'crew';
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  isActive: boolean;
  availability: Record<string, {
    available: boolean;
    preferredStart?: string;
    preferredEnd?: string;
  }>;
}

interface Department {
  id: number;
  name: string;
  stations: Station[];
}

interface Station {
  id: number;
  name: string;
  departmentId: number;
}

interface EmployeeFormData {
  name: string;
  email: string;
  department: string;
  station: string[];
  role: 'admin' | 'crew';
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  isActive: boolean;
  availability: Record<string, {
    available: boolean;
    preferredStart?: string;
    preferredEnd?: string;
  }>;
}
```

### Database Schema

```sql
-- Employees table
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(255) NOT NULL,
  station JSON NOT NULL,
  role ENUM('admin', 'crew') DEFAULT 'crew',
  maxHoursPerWeek INT DEFAULT 40,
  currentWeeklyHours INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  availability JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stations table
CREATE TABLE stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  departmentId INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_active ON employees(isActive);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_stations_department ON stations(departmentId);
```

## Best Practices

1. **Data Validation**: Implement comprehensive client and server-side validation
2. **Security**: Sanitize inputs and implement proper authorization
3. **Performance**: Use efficient database queries and caching
4. **User Experience**: Provide intuitive interfaces and clear feedback
5. **Scalability**: Design for growth in employee count and features
6. **Audit Trail**: Track all employee data changes

## Future Enhancements

1. **Photo Management**: Employee profile photos
2. **Document Storage**: Contracts, certifications, etc.
3. **Performance Tracking**: Employee performance metrics
4. **Training Records**: Skill development tracking
5. **Integration**: HR system integration
6. **Mobile App**: Mobile employee management interface