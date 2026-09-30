import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  ArrowRight,
  MessageSquare,
  CheckSquare,
  Maximize2,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';

export default function TaskTable({
  role,
  user,
  tasks = [],
  onEditTask,
  onOpenDetail,
  onDeleteTask,
  onStatusChange,
  onApproveCompletion,
  onRejectCompletion,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onViewAll
}) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';
  const showAssigned = true;
  const [openActionId, setOpenActionId] = useState(null);
  const actionMenuRef = useRef(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAssigneePicture = (assignedName) => {
    if (!assignedName) return null;
    const clean = assignedName.toLowerCase().trim();
    if (user?.name && user.name.toLowerCase().trim() === clean && user.picture) {
      return user.picture;
    }
    const KNOWN_PICTURES = {
      'arun k': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
      'priya s': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
      'vignesh m': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
      'nivetha r': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&q=80',
      'karthik d': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
      'ananya r': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=128&q=80',
      'sabarinathan v': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80'
    };
    return KNOWN_PICTURES[clean] || null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sep 24, 2026';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[monthIndex] || 'Sep'} ${day}, ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status, taskItem) => {
    if (taskItem?.completionRequested) {
      return (
        <span 
          className="tf-status-badge tf-badge-pending-tl" 
          title={isTL ? "Employee marked task completed. Needs your approval." : "Awaiting Team Leader approval"}
        >
          ⏳ {isTL ? 'Awaiting Approval' : 'Pending TL Approval'}
        </span>
      );
    }
    switch (status) {
      case 'completed':
        return <span className="tf-status-badge tf-badge-completed">Completed</span>;
      case 'in-progress':
        return <span className="tf-status-badge tf-badge-inprogress">In Progress</span>;
      case 'in-review':
        return <span className="tf-status-badge tf-badge-inreview">In Review</span>;
      case 'overdue':
        return <span className="tf-status-badge tf-badge-overdue">Overdue</span>;
      case 'to-do':
      case 'backlog':
      default:
        return <span className="tf-status-badge tf-badge-todo">To Do</span>;
    }
  };

  const handleOpenDetailOrEdit = (task) => {
    if (onOpenDetail) {
      onOpenDetail(task);
    } else {
      onEditTask(task);
    }
  };

  const tabs = ['All', 'To Do', 'In Progress', 'Completed'];

  return (
    <div className="tf-table-card">
      {/* Table Header Controls */}
      <div className="tf-table-top-bar">
        <div className="tf-table-title-group">
          <h2 className="tf-table-heading">
            {isTL ? 'Task Assignment & Orchestration' : isManager ? 'Live Sprint Workstream' : 'My Deliverables'}
          </h2>

          {/* Filter Tabs */}
          {!isManager && (
            <div className="tf-filter-tabs">
              {tabs.map((tab) => {
                const tabKey = tab.toLowerCase().replace(' ', '-');
                const isActive = activeFilter === tabKey || (tab === 'All' && activeFilter === 'all');
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`tf-tab-btn ${isActive ? 'tf-tab-active' : ''}`}
                    onClick={() => onFilterChange(tab === 'All' ? 'all' : tabKey)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="tf-table-actions-right">
          {/* Employee has Search inside table card */}
          {!isManager ? (
            <div className="tf-table-search-box">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="tf-table-search-input"
              />
              <Search size={16} className="tf-table-search-icon" />
            </div>
          ) : (
            /* Manager has "View All ->" link */
            <button 
              type="button" 
              className="tf-view-all-link"
              onClick={onViewAll}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="tf-table-responsive" ref={actionMenuRef}>
        <table className="tf-data-table">
          <thead>
            <tr>
              <th className="tf-th-title">Task Name</th>
              {showAssigned && <th className="tf-th-assigned">Assigned To</th>}
              <th className="tf-th-project">Project</th>
              <th className="tf-th-due">Due Date</th>
              <th className="tf-th-status">Status</th>
              <th className="tf-th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={showAssigned ? 6 : 5} className="tf-empty-cell">
                  <div className="tf-empty-state">
                    <p>No tasks found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const subtasks = task.subtasks || [];
                const comments = task.comments || [];
                const totalSubs = subtasks.length;
                const doneSubs = subtasks.filter(s => s.completed).length;

                return (
                  <tr key={task.id} className="tf-table-row">
                    {/* Task Name & Quick Indicators */}
                    <td className="tf-td-title">
                      <div className="tf-title-container">
                        <span 
                          className="tf-task-title-text"
                          onClick={() => handleOpenDetailOrEdit(task)}
                          title="Click to view details and live comments"
                        >
                          {task.title}
                        </span>
                        
                        <div className="tf-row-meta-indicators">
                          {totalSubs > 0 && (
                            <span className="tf-mini-badge" title={`${doneSubs}/${totalSubs} subtasks completed`}>
                              <CheckSquare size={11} />
                              <span>{doneSubs}/{totalSubs}</span>
                            </span>
                          )}
                          {comments.length > 0 && (
                            <span className="tf-mini-badge text-blue" title={`${comments.length} comment(s)`}>
                              <MessageSquare size={11} />
                              <span>{comments.length}</span>
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <span className="tf-mini-badge text-red" title="Urgent Priority">
                              ⚡ Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned To */}
                    {showAssigned && (
                      <td className="tf-td-assigned">
                        <div className="tf-assignee-cell-wrap">
                          {(() => {
                            const pic = task.assignedPicture || getAssigneePicture(task.assignedTo);
                            const initial = (task.assignedTo || 'U')[0].toUpperCase();
                            return pic ? (
                              <img
                                src={pic}
                                alt={task.assignedTo || 'Assignee'}
                                className="tf-assignee-avatar-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                title={`Assignee: ${task.assignedTo}`}
                              />
                            ) : (
                              <div className="tf-assignee-avatar-pill" title={`Assignee: ${task.assignedTo}`}>
                                {initial}
                              </div>
                            );
                          })()}
                          <span className="tf-assignee-name">
                            {task.assignedTo || 'Unassigned'}
                          </span>
                          {isEmployee && (task.assignedTo || '').toLowerCase().trim() === (user?.name || '').toLowerCase().trim() && (
                            <span className="tf-badge-assigned-you">You</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Project */}
                    <td className="tf-td-project">
                      <span className="tf-project-pill">
                        {task.project || 'Web App'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="tf-td-due">
                      <span className="tf-due-text">
                        {formatDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Status with Quick Click & Inline TL Approval */}
                    <td className="tf-td-status">
                      <div className="tf-status-cell-content">
                        <div 
                          onClick={() => handleOpenDetailOrEdit(task)}
                          style={{ cursor: 'pointer' }}
                          title="Click to inspect task status"
                        >
                          {getStatusBadge(task.status, task)}
                        </div>

                        {task.completionRequested && isTL && (
                          <div className="tf-tl-quick-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="tf-btn-quick-approve"
                              onClick={() => onApproveCompletion && onApproveCompletion(task.id)}
                              title="Approve Completion"
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              type="button"
                              className="tf-btn-quick-reject"
                              onClick={() => onRejectCompletion && onRejectCompletion(task.id)}
                              title="Reject / Request Revisions"
                            >
                              <X size={11} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions Dropdown with Full CRUD Controls */}
                    <td className="tf-td-action">
                      <div className="tf-action-menu-wrapper">
                        <button
                          type="button"
                          className="tf-action-dots-btn"
                          onClick={() => setOpenActionId(openActionId === task.id ? null : task.id)}
                          aria-label="Task actions"
                          title="Task menu"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openActionId === task.id && (
                          <div className="tf-action-dropdown">
                            {/* Completion Approval Section for TL ONLY */}
                            {task.completionRequested && isTL && (
                              <>
                                <button
                                  type="button"
                                  className="tf-dropdown-row tf-row-approve"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onApproveCompletion && onApproveCompletion(task.id);
                                  }}
                                >
                                  <Check size={14} style={{ color: 'var(--success-color, #10b981)' }} />
                                  <span style={{ color: 'var(--success-color, #10b981)', fontWeight: 600 }}>Approve Completion</span>
                                </button>
                                <button
                                  type="button"
                                  className="tf-dropdown-row tf-row-reject"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onRejectCompletion && onRejectCompletion(task.id);
                                  }}
                                >
                                  <X size={14} style={{ color: 'var(--danger-color, #ef4444)' }} />
                                  <span style={{ color: 'var(--danger-color, #ef4444)', fontWeight: 600 }}>Reject / Revisions</span>
                                </button>
                                <div className="tf-dropdown-divider"></div>
                              </>
                            )}

                            <button
                              type="button"
                              className="tf-dropdown-row"
                              onClick={() => {
                                setOpenActionId(null);
                                handleOpenDetailOrEdit(task);
                              }}
                            >
                              <Maximize2 size={14} />
                              <span>{isManager ? 'View Task Details' : 'Open Task Details'}</span>
                            </button>

                            {!isManager && (
                              <button
                                type="button"
                                className="tf-dropdown-row"
                                onClick={() => {
                                  setOpenActionId(null);
                                  onEditTask(task);
                                }}
                              >
                                <Edit2 size={14} />
                                <span>Quick Edit Modal</span>
                              </button>
                            )}

                            {!isManager && (
                              <>
                                <div className="tf-dropdown-divider"></div>
                                
                                <div className="tf-dropdown-submenu-header">Move Status</div>
                                <button
                                  type="button"
                                  className="tf-dropdown-row"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onStatusChange(task.id, 'to-do');
                                  }}
                                >
                                  <Clock size={14} />
                                  <span>Mark To Do</span>
                                </button>
                                <button
                                  type="button"
                                  className="tf-dropdown-row"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onStatusChange(task.id, 'in-progress');
                                  }}
                                >
                                  <Clock size={14} />
                                  <span>Mark In Progress</span>
                                </button>
                                <button
                                  type="button"
                                  className="tf-dropdown-row"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onStatusChange(task.id, 'completed');
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                  <span>{role === 'employee' ? 'Request Completion Approval' : 'Mark Completed'}</span>
                                </button>
                              </>
                            )}

                            {isTL && (
                              <>
                                <div className="tf-dropdown-divider"></div>
                                <button
                                  type="button"
                                  className="tf-dropdown-row tf-row-danger"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onDeleteTask(task.id);
                                  }}
                                  title="Delete task from workspace"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Task</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
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
