export type Department = {
  id: string;
  name: string;
  description?: string;
  stations: Station[];
  createdAt: string;
  updatedAt: string;
};

export type Station = {
  id: string;
  name: string;
  departmentId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentFormData = {
  name: string;
  description?: string;
};

export type StationFormData = {
  name: string;
  departmentId: string;
  description?: string;
};