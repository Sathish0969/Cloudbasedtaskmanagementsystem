import React, { useState } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Paperclip, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';

export default function TaskListView({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange
}) {
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'subtasks') {
      valA = a.subtasks?.length || 0;
      valB = b.subtasks?.length || 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="task-list-container">
      <div className="table-responsive">
        <table className="task-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className="sortable-th">
                <div className="th-content">
                  <span>Task Title</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('status')} className="sortable-th">
                <div className="th-content">
                  <span>Status</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('priority')} className="sortable-th">
                <div className="th-content">
                  <span>Priority</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('dueDate')} className="sortable-th">
                <div className="th-content">
                  <span>Due Date</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('subtasks')} className="sortable-th">
                <div className="th-content">
                  <span>Progress</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th>Attachments</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table-cell">
                  No tasks found matching current filters.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const totalSub = task.subtasks?.length || 0;
                const doneSub = task.subtasks?.filter((s) => s.completed).length || 0;
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'completed';

                return (
                  <tr key={task.id} className="task-table-row">
                    {/* Title & Tags */}
                    <td className="cell-title">
                      <div className="title-wrapper" onClick={() => onEditTask(task)}>
                        <span className="task-table-title">{task.title}</span>
                        {task.tags?.length > 0 && (
                          <div className="cell-tags">
                            {task.tags.map((tag, i) => (
                              <span key={i} className="tag-pill">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status with inline selector */}
                    <td className="cell-status">
                      <select
                        className={`table-status-select status-${task.status}`}
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value)}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in-progress">In Progress</option>
                        <option value="in-review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="cell-priority">
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="cell-due">
                      {task.dueDate ? (
                        <div className={`due-date-cell ${isOverdue ? 'text-overdue' : ''}`}>
                          {isOverdue && <AlertCircle size={13} />}
                          <span>{task.dueDate}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Subtasks Progress */}
                    <td className="cell-progress">
                      {totalSub > 0 ? (
                        <div className="table-subtask-indicator">
                          <CheckSquare size={13} />
                          <span>{doneSub}/{totalSub}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Attachments */}
                    <td className="cell-attachments">
                      {task.attachments?.length > 0 ? (
                        <div className="table-attachment-indicator">
                          <Paperclip size={13} />
                          <span>{task.attachments.length}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="cell-actions">
                      <div className="row-actions">
                        <button
                          className="btn-icon"
                          onClick={() => onEditTask(task)}
                          title="Edit Task"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn-icon btn-danger-icon"
                          onClick={() => onDeleteTask(task.id)}
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
