import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Plus, Building2, MapPin } from 'lucide-react';
import { useDepartments, useStations } from '../hooks/useDepartments';
import { DepartmentModal } from './DepartmentModal';
import { StationModal } from './StationModal';
import type { Department, Station } from '../types';

export function OrganizationManagement() {
  const { departments, loading: departmentsLoading, addDepartment, editDepartment, removeDepartment } = useDepartments();
  const { stations, loading: stationsLoading, addStation, editStation, removeStation } = useStations();

  const [activeTab, setActiveTab] = useState('departments');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setIsDepartmentModalOpen(true);
  };

  const handleEditStation = (station: Station) => {
    setEditingStation(station);
    setIsStationModalOpen(true);
  };

  const handleDeleteDepartment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await removeDepartment(id);
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      await removeStation(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage departments and stations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="stations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Stations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage organization departments</CardDescription>
                </div>
                <Button onClick={() => setIsDepartmentModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {departments.map((dept) => (
                    <Card key={dept.id}>
                      <CardHeader>
                        <CardTitle>{dept.name}</CardTitle>
                        <CardDescription>{dept.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {(dept.stations || []).length} stations
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditDepartment(dept)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteDepartment(dept.id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stations</CardTitle>
                  <CardDescription>Manage work stations by department</CardDescription>
                </div>
                <Button onClick={() => setIsStationModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Station
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stationsLoading ? (
                <div className="text-center py-8">Loading stations...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stations.map((station) => {
                    const dept = departments.find(d => d.id === station.departmentId);
                    return (
                      <Card key={station.id}>
                        <CardHeader>
                          <CardTitle>{station.name}</CardTitle>
                          <CardDescription>{dept?.name || 'Unknown Department'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditStation(station)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteStation(station.id)}>
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setEditingDepartment(null);
        }}
        onSubmit={(data) => {
          if (editingDepartment) {
            editDepartment(editingDepartment.id, data);
          } else {
            addDepartment(data);
          }
        }}
        initialData={editingDepartment}
      />

      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setEditingStation(null);
        }}
        onSubmit={(data) => {
          if (editingStation) {
            editStation(editingStation.id, data);
          } else {
            addStation(data);
          }
        }}
        initialData={editingStation}
        departments={departments}
      />
    </div>
  );
}