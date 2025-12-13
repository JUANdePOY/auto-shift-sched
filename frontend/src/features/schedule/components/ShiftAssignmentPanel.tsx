// ==================== MAIN COMPONENT ====================

import React, { useState, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Label } from '../../shared/components/ui/label';
import { Users, X } from 'lucide-react';
import { AISuggestionsPanel } from '../../ai-suggestions/components/AISuggestionPanel';
import EditShiftDialog from './EditShiftDialog';
import ShiftAssignmentTable from './ShiftAssignmentTable';
import AssignmentActions from './AssignmentActions';
import AddShiftDialog from './AddShiftDialog';
import { useAutoAssign } from '../hooks/useAutoAssign';
import { useShiftData } from '../hooks/useShiftData';
import { useAssignmentHandlers } from '../hooks/useAssignmentHandlers';


import { useTemporarySchedule } from '../contexts/TemporaryScheduleContext';

import type { ShiftAssignmentPanelProps } from '../types/shiftAssignmentTypes';

const ShiftAssignmentPanel = ({
  isOpen,
  onClose,
  date,
  employees,
  onSaveFinalSchedule,
  viewMode = false,
  finalSchedule
}: ShiftAssignmentPanelProps): JSX.Element | null => {
  // ==================== CONTEXT AND HOOKS ====================
  const { assignments: contextAssignments, getAssignmentsForDate, updateAssignment, clearAssignmentsForDate } = useTemporarySchedule();

  // ==================== STATE MANAGEMENT ====================
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // AI Suggestion Panel state
  const [showAISuggestionPanel, setShowAISuggestionPanel] = useState(false);
  const [selectedShiftForAI, setSelectedShiftForAI] = useState<string | null>(null);

  // ==================== CUSTOM HOOKS ====================
  const { assignments: dataAssignments, setAssignments: setDataAssignments, departments } = useShiftData(
    isOpen,
    date,
    [],
    employees,
    getAssignmentsForDate
  );

  const {
    newShiftForm,
    showAddDialog,
    setShowAddDialog,
    editingShift,
    handleAssignEmployee,
    handleApplyAISuggestion,
    handleSaveSchedule,
    handleAddShift,
    handleDeleteShift,
    handleEditShift,
    handleSaveEdit,
    handleCloseEditDialog,
    handleStationToggle,
    handleFormChange
  } = useAssignmentHandlers({
    assignments: dataAssignments,
    setAssignments: setDataAssignments,
    employees,
    date,
    onSaveFinalSchedule,
    onClose,
    clearAssignmentsForDate,
    updateAssignment,
    departments
  });

  // Use the auto-assign hook
  const { isAutoAssigning, handleAutoAssign } = useAutoAssign({
    assignments: dataAssignments,
    date,
    employees,
    onAssignmentsUpdate: setDataAssignments
  });

  // ==================== COMPUTED VALUES ====================
  // Calculate employee current hours - simplified to prevent infinite loops
  const employeeCurrentHours = {};

  // Get employee IDs already assigned on this date
  const assignedEmployeeIds = useMemo(() => {
    const assigned = new Set<string>();
    
    // Check assignments from current day's data
    dataAssignments.forEach(assignment => {
      if (assignment.status === 'assigned' && assignment.assignedEmployee?.id) {
        assigned.add(assignment.assignedEmployee.id);
      }
    });
    
    // Check final schedule for this date
    if (finalSchedule && Array.isArray(finalSchedule)) {
      finalSchedule.forEach(scheduleItem => {
        if (scheduleItem.date === date && scheduleItem.employee_id) {
          assigned.add(scheduleItem.employee_id.toString());
        }
      });
    }
    
    return Array.from(assigned);
  }, [dataAssignments, finalSchedule, date]);

  // ==================== EFFECTS ====================
  // Removed problematic useEffect to prevent infinite loops

  // ==================== EVENT HANDLERS ====================
  // Handler to open AI suggestion panel when select employee is clicked
  const handleOpenAISuggestionPanel = (shiftId: string) => {
    setSelectedShiftForAI(shiftId);
    setShowAISuggestionPanel(true);
  };

  // Handler to close AI suggestion panel
  const handleCloseAISuggestionPanel = () => {
    setSelectedShiftForAI(null);
    setShowAISuggestionPanel(false);
  };

  // ==================== RENDER LOGIC ====================
  if (!isOpen) return null;

  // Sort and filter assignments
  const filteredAssignments = [...dataAssignments]
    .filter(assignment => {
      const matchesSearch = searchTerm === '' || 
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignedEmployee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.requiredStation.some(station => 
          station.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        assignment.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const assignedCount = filteredAssignments.filter(a => a.status === 'assigned').length;
  const totalCount = filteredAssignments.length;

  return (
    <div
      className="fixed inset-0 bg-background z-50 flex h-full text-sm font-sans text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-assignment-panel-title"
    >
      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div
        className={`${
          showAISuggestionPanel ? 'w-2/3' : 'w-full'
        } flex flex-col bg-background p-4 md:p-8 overflow-y-auto relative transition-all duration-300 shadow-lg`}
      >
        {/* ==================== HEADER ==================== */}
        <header className="flex items-center justify-between mb-4 md:mb-8 border-b border-muted pb-4">
          <h2
            id="shift-assignment-panel-title"
            className="text-xl md:text-3xl font-semibold flex items-center gap-2 md:gap-3 text-blue-700"
          >
            <Users className="w-5 h-5 md:w-7 md:h-7" aria-hidden="true" />
            <span className="hidden sm:inline">Daily Shift Assignments - </span>
            <time dateTime={date} className="font-mono text-sm md:text-lg text-muted-foreground">
              {date && !isNaN(new Date(date).getTime()) 
                ? new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'No Date Selected'
              }
            </time>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close shift assignment panel"
            className="text-muted-foreground hover:text-foreground transition rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </header>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          {/* ==================== ACTION BUTTONS ==================== */}
          {!viewMode && (
            <AssignmentActions
              viewMode={viewMode}
              isAutoAssigning={isAutoAssigning}
              assignedCount={assignedCount}
              totalCount={totalCount}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddShift={() => setShowAddDialog(true)}
              onAutoAssign={handleAutoAssign}
            />
          )}

          {/* ==================== TYPE FILTER FOR VIEW MODE ==================== */}
          {viewMode && (
            <section className="flex items-center justify-end p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <Label htmlFor="type-filter" className="text-sm font-medium">
                  Type:
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="opener">Opener</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                    <SelectItem value="graveyard">Graveyard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          )}

          {/* ==================== SHIFT ASSIGNMENTS TABLE ==================== */}
          <ShiftAssignmentTable
            assignments={filteredAssignments}
            onAssignEmployee={handleAssignEmployee}
            onUnassignEmployee={(shiftId) => updateAssignment(date, shiftId, null)}
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onOpenAISuggestionPanel={handleOpenAISuggestionPanel}
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* ==================== RIGHT SIDE AI SUGGESTION PANEL ==================== */}
      {showAISuggestionPanel && selectedShiftForAI && (
        <div className="w-1/3 bg-background border-l border-border flex flex-col overflow-hidden">
          <AISuggestionsPanel
            isOpen={showAISuggestionPanel}
            onClose={handleCloseAISuggestionPanel}
            shiftId={selectedShiftForAI}
            shiftTitle={dataAssignments.find(a => a.id === selectedShiftForAI)?.title || ''}
            shiftTime={dataAssignments.find(a => a.id === selectedShiftForAI)?.time || ''}
            shiftEndTime={dataAssignments.find(a => a.id === selectedShiftForAI)?.endTime || ''}
            shiftDate={date}
            department={dataAssignments.find(a => a.id === selectedShiftForAI)?.department || ''}
            requiredStations={dataAssignments.find(a => a.id === selectedShiftForAI)?.requiredStation || []}
            availableEmployees={employees || []}
            employees={employees || []}
            onApplySuggestion={handleApplyAISuggestion}
            mode="panel"
            employeeCurrentHours={employeeCurrentHours}
            assignedEmployeeIds={assignedEmployeeIds}
            finalSchedule={finalSchedule}
          />
        </div>
      )}

      {/* ==================== DIALOGS ==================== */}
      <EditShiftDialog
        isOpen={!!editingShift}
        onClose={handleCloseEditDialog}
        shift={editingShift}
        departments={departments}
        onSave={handleSaveEdit}
      />

      <AddShiftDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        newShiftForm={newShiftForm}
        onFormChange={handleFormChange}
        departments={departments}
        onStationToggle={handleStationToggle}
        onAddShift={handleAddShift}
      />
    </div>
  );
};

export default ShiftAssignmentPanel;
