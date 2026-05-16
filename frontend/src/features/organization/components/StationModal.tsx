import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../shared/components/ui/dialog';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Textarea } from '../../shared/components/ui/textarea';
import type { Station, Department, StationFormData } from '../types';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StationFormData) => void;
  initialData?: Station | null;
  departments: Department[];
}

export function StationModal({ isOpen, onClose, onSubmit, initialData, departments }: StationModalProps) {
  const [formData, setFormData] = useState<StationFormData>({
    name: '',
    departmentId: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        departmentId: initialData.departmentId,
        description: '',
      });
    } else {
      setFormData({
        name: '',
        departmentId: departments.length > 0 ? departments[0].id : '',
        description: '',
      });
    }
  }, [initialData, isOpen, departments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Station' : 'Create New Station'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the station details below.' : 'Fill in the details to create a new station.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Station Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter station name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter station description"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? 'Update Station' : 'Create Station'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}