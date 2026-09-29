import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Paperclip, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowRightCircle,
  AlertCircle,
  MessageSquare,
  Maximize2,
  Check,
  X
} from 'lucide-react';

export default function TaskCard({ 
  task, 
  onEdit, 
  onOpenDetail,
  onDelete, 
  onStatusChange,
  onApproveCompletion,
  onRejectCompletion,
  isDragging,
  onDragStart,
  onDragEnd,
  canDelete = true,
  role = 'manager'
}) {
  const {
    id,
    title,
    description,
    priority = 'medium',
    status = 'backlog',
    dueDate,
    tags = [],
    subtasks = [],
    comments = [],
    attachments = []
  } = task;

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleOpenDetailOrEdit = () => {
    if (onOpenDetail) {
      onOpenDetail(task);
    } else {
      onEdit(task);
    }
  };

  // Due Date Calculations
  const getDueBadge = () => {
    if (!dueDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = dueDate < today && status !== 'completed';
    const isDueToday = dueDate === today;

    let dueText = dueDate;
    try {
      const d = new Date(dueDate + 'T00:00:00');
      dueText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (_) {}

    return (
      <span className={`due-date-badge ${isOverdue ? 'is-overdue' : isDueToday ? 'is-today' : ''}`}>
        {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
        <span>{isOverdue ? `Overdue: ${dueText}` : isDueToday ? 'Due Today' : dueText}</span>
      </span>
    );
  };

  return (
    <article
      className={`task-card ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      aria-label={`Task: ${title}`}
    >
      {/* Top Header: Priority & Action Menu */}
      <div className="task-card-header">
        <div className="task-card-header-left">
          <span className={`badge badge-${priority}`}>
            {priority}
          </span>
          {task.assignedTo && (
            <span className="task-card-assignee-chip" title={`Assigned to: ${task.assignedTo}`}>
              <span className="task-card-avatar-bubble">
                {(task.assignedTo || 'U')[0].toUpperCase()}
              </span>
              <span className="task-card-assignee-name">{task.assignedTo.split(' ')[0]}</span>
            </span>
          )}
        </div>

        <div className="task-card-actions">
          <button
            className="card-action-btn"
            onClick={handleOpenDetailOrEdit}
            title="Inspect Task Details"
            aria-label="Inspect Task Details"
          >
            <Maximize2 size={13} />
          </button>
          <button
            className="card-action-btn"
            onClick={() => onEdit(task)}
            title="Quick Edit Task"
            aria-label="Quick Edit Task"
          >
            <Edit3 size={13} />
          </button>
          {canDelete && (
            <button
              className="card-action-btn btn-delete-card"
              onClick={() => onDelete(id)}
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Completion Requested Banner / Badge */}
      {task.completionRequested && (
        <div className="card-completion-requested-banner">
          <div className="card-completion-text">
            <span>⏳ {role === 'teamleader' || role === 'manager' ? 'Awaiting Your Approval' : 'Pending TL Approval'}</span>
          </div>
          {(role === 'teamleader' || role === 'manager') && (
            <div className="card-completion-quick-btns" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="card-quick-approve-btn"
                onClick={() => onApproveCompletion && onApproveCompletion(task.id)}
                title="Approve Completion"
              >
                <Check size={11} /> Approve
              </button>
              <button
                type="button"
                className="card-quick-reject-btn"
                onClick={() => onRejectCompletion && onRejectCompletion(task.id)}
                title="Reject / Request Changes"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Title & Description */}
      <h3 className="task-card-title" onClick={handleOpenDetailOrEdit} title="Click to view full details">
        {title}
      </h3>

      {description && (
        <p className="task-card-description" onClick={handleOpenDetailOrEdit}>
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="task-card-tags">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks Progress Bar (if any) */}
      {totalSubtasks > 0 && (
        <div className="task-card-subtasks" onClick={handleOpenDetailOrEdit} style={{ cursor: 'pointer' }}>
          <div className="subtask-label-row">
            <span className="subtask-label">
              <CheckSquare size={12} />
              <span>{completedSubtasks}/{totalSubtasks} Subtasks</span>
            </span>
            <span className="subtask-percent">{subtaskPercent}%</span>
          </div>
          <div className="mini-progress-track">
            <div 
              className="mini-progress-fill" 
              style={{ width: `${subtaskPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Card Footer: Due Date, Comments, Attachments, Quick Move */}
      <div className="task-card-footer">
        <div className="card-footer-left">
          {getDueBadge()}
          {comments.length > 0 && (
            <span 
              className="attachment-count-badge text-blue" 
              onClick={handleOpenDetailOrEdit}
              title={`${comments.length} comment(s)`}
              style={{ cursor: 'pointer' }}
            >
              <MessageSquare size={12} />
              <span>{comments.length}</span>
            </span>
          )}
          {attachments.length > 0 && (
            <span 
              className="attachment-count-badge" 
              onClick={handleOpenDetailOrEdit}
              title={`${attachments.length} attachment(s)`}
              style={{ cursor: 'pointer' }}
            >
              <Paperclip size={12} />
              <span>{attachments.length}</span>
            </span>
          )}
        </div>

        {/* Quick status selector */}
        <select
          className="quick-status-select"
          value={status}
          onChange={(e) => onStatusChange(id, e.target.value)}
          title="Change Status"
          aria-label="Move task status"
        >
          <option value="to-do">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="completed">{role === 'employee' ? 'Completed (Need TL)' : 'Completed'}</option>
          <option value="backlog">Backlog</option>
        </select>
      </div>
    </article>
  );
}
