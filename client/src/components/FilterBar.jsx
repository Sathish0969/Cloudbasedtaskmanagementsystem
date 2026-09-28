import React from 'react';
import { LayoutGrid, List, Filter } from 'lucide-react';

const STATUSES = [
  { key: 'all', label: 'All Tasks' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'in-review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
];

const PRIORITIES = [
  { key: 'all', label: 'All Priorities' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export default function FilterBar({
  selectedStatus,
  onSelectStatus,
  selectedPriority,
  onSelectPriority,
  viewMode,
  onChangeViewMode,
  taskCountsByStatus = {}
}) {
  return (
    <div className="filter-bar">
      {/* Status Pills */}
      <div className="status-pills-group" role="tablist" aria-label="Status filter">
        {STATUSES.map((st) => {
          const count = st.key === 'all' 
            ? Object.values(taskCountsByStatus).reduce((a, b) => a + b, 0)
            : (taskCountsByStatus[st.key] || 0);
          const isActive = selectedStatus === st.key;

          return (
            <button
              key={st.key}
              role="tab"
              aria-selected={isActive}
              className={`status-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStatus(st.key)}
            >
              <span>{st.label}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Priority Select & View Mode Toggle */}
      <div className="filter-controls-right">
        {/* Priority Filter */}
        <div className="priority-select-wrapper">
          <Filter size={14} className="filter-select-icon" />
          <select
            className="priority-select"
            value={selectedPriority}
            onChange={(e) => onSelectPriority(e.target.value)}
            aria-label="Filter by priority"
          >
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle (Kanban vs List) */}
        <div className="view-toggle-group">
          <button
            className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('kanban')}
            title="Kanban Board View"
            aria-label="Kanban Board View"
          >
            <LayoutGrid size={16} />
            <span className="toggle-label">Board</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('list')}
            title="Table / List View"
            aria-label="Table List View"
          >
            <List size={16} />
            <span className="toggle-label">List</span>
          </button>
        </div>
      </div>
    </div>
  );
}
