import React, { useState } from 'react';
import { Plus, Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  {
    id: 'backlog',
    title: 'Backlog',
    accentColor: 'var(--status-backlog)',
    icon: Circle
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    accentColor: 'var(--status-in-progress)',
    icon: Clock
  },
  {
    id: 'in-review',
    title: 'In Review',
    accentColor: 'var(--status-in-review)',
    icon: AlertCircle
  },
  {
    id: 'completed',
    title: 'Completed',
    accentColor: 'var(--status-completed)',
    icon: CheckCircle2
  }
];

export default function KanbanBoard({
  tasks,
  onEditTask,
  onOpenDetail,
  onDeleteTask,
  onStatusChange,
  onApproveCompletion,
  onRejectCompletion,
  onQuickAdd,
  role = 'manager'
}) {
  const isTL = role === 'teamleader';
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    if (role === 'manager') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="kanban-board-container" role="region" aria-label="Kanban Board">
      <div className="kanban-grid">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;
          const IconComponent = col.icon;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isOver ? 'column-drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              data-status={col.id}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="column-title-group">
                  <span 
                    className="column-indicator-dot" 
                    style={{ backgroundColor: col.accentColor }}
                  ></span>
                  <h2 className="column-title">{col.title}</h2>
                  <span className="column-count-badge">{colTasks.length}</span>
                </div>

                {isTL && (
                  <button
                    className="btn-icon column-add-btn"
                    onClick={() => onQuickAdd(col.id)}
                    title={`Add task to ${col.title} (TL Only)`}
                    aria-label={`Add task to ${col.title}`}
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>

              {/* Task Cards Stream */}
              <div className="kanban-column-cards">
                {colTasks.length === 0 ? (
                  <div className="empty-column-placeholder">
                    <p className="empty-placeholder-text">No tasks</p>
                    {isTL && (
                      <button 
                        className="empty-add-btn"
                        onClick={() => onQuickAdd(col.id)}
                      >
                        <Plus size={13} /> Add first task
                      </button>
                    )}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onOpenDetail={onOpenDetail}
                      onDelete={onDeleteTask}
                      onStatusChange={onStatusChange}
                      onApproveCompletion={onApproveCompletion}
                      onRejectCompletion={onRejectCompletion}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      canDelete={role === 'teamleader'}
                      role={role}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
