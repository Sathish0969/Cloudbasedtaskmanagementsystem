import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Folder,
  Tag,
  Paperclip,
  MessageSquare,
  History,
  Copy,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Phone,
  MapPin
} from 'lucide-react';
import { uploadAttachment, addComment } from '../services/api';

const KNOWN_MEMBERS_MAP = {
  'arun k': {
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 019-2834',
    department: 'Frontend Engineering',
    location: 'San Francisco, CA'
  },
  'priya s': {
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 018-9922',
    department: 'Cloud Core Squad',
    location: 'New York, NY'
  },
  'vignesh m': {
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 012-3344',
    department: 'Infrastructure',
    location: 'Austin, TX'
  },
  'nivetha r': {
    picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 014-7711',
    department: 'QA & UX Engineering',
    location: 'Seattle, WA'
  },
  'karthik d': {
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 015-8833',
    department: 'DevOps & CI/CD',
    location: 'Chicago, IL'
  },
  'sabarinathan v': {
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
    phone: '+1 (555) 010-4499',
    department: 'Cloud Architecture & Infrastructure',
    location: 'San Francisco, CA (HQ)'
  }
};

export default function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onApproveCompletion,
  onRejectCompletion,
  currentUser = { name: 'Sabarinathan V' },
  role = 'manager'
}) {
  // Active Tab: 'overview' | 'subtasks' | 'activity' | 'attachments'
  const [activeTab, setActiveTab] = useState('overview');

  // Form State (Local editing)
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'to-do');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || 'Arun K');
  const [project, setProject] = useState(task?.project || 'Web App');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [tags, setTags] = useState(task?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [attachments, setAttachments] = useState(task?.attachments || []);
  const [comments, setComments] = useState(task?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [activityLog, setActivityLog] = useState(task?.activityLog || []);

  const [isUploading, setIsUploading] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state whenever task prop changes (e.g. from real-time WebSocket update)
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'to-do');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assignedTo || 'Arun K');
      setProject(task.project || 'Web App');
      setDueDate(task.dueDate || '');
      setTags(task.tags || []);
      setSubtasks(task.subtasks || []);
      setAttachments(task.attachments || []);
      setComments(task.comments || []);
      setActivityLog(task.activityLog || []);
      setIsDirty(false);
    }
  }, [task]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          setConfirmDelete(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, confirmDelete]);

  // Save changes
  const handleSave = async (overrides = {}) => {
    if (role === 'manager') return;
    const payload = {
      title: overrides.title !== undefined ? overrides.title : title,
      description: overrides.description !== undefined ? overrides.description : description,
      status: overrides.status !== undefined ? overrides.status : status,
      priority: overrides.priority !== undefined ? overrides.priority : priority,
      assignedTo: overrides.assignedTo !== undefined ? overrides.assignedTo : assignedTo,
      project: overrides.project !== undefined ? overrides.project : project,
      dueDate: overrides.dueDate !== undefined ? overrides.dueDate : dueDate,
      tags: overrides.tags !== undefined ? overrides.tags : tags,
      subtasks: overrides.subtasks !== undefined ? overrides.subtasks : subtasks,
      attachments: overrides.attachments !== undefined ? overrides.attachments : attachments
    };
    await onUpdateTask(task.id, payload);
    setIsDirty(false);
  };

  // Status Change
  const handleSelectStatus = async (newStatus) => {
    if (role === 'manager') return;
    setStatus(newStatus);
    onStatusChange(task.id, newStatus);
    if (role === 'employee' && newStatus === 'completed') {
      return;
    }
    handleSave({ status: newStatus });
  };

  // Priority Change
  const handleSelectPriority = async (newPriority) => {
    if (role === 'manager') return;
    setPriority(newPriority);
    handleSave({ priority: newPriority });
  };

  // Subtasks Operations
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskText('');
    handleSave({ subtasks: updated });
  };

  const handleToggleSubtask = (subId) => {
    const updated = subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s));
    setSubtasks(updated);
    handleSave({ subtasks: updated });
  };

  const handleDeleteSubtask = (subId) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    setSubtasks(updated);
    handleSave({ subtasks: updated });
  };

  // Tags Operations
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    if (!tags.includes(clean)) {
      const updated = [...tags, clean];
      setTags(updated);
      handleSave({ tags: updated });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    handleSave({ tags: updated });
  };

  // Comments
  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const commentAuthor = currentUser?.name || 'Sabarinathan V';
      const updatedTask = await addComment(task.id, {
        author: commentAuthor,
        text: newCommentText.trim()
      });
      if (updatedTask && updatedTask.comments) {
        setComments(updatedTask.comments);
        if (updatedTask.activityLog) setActivityLog(updatedTask.activityLog);
      } else {
        const localComm = {
          id: `comm-${Date.now()}`,
          author: commentAuthor,
          text: newCommentText.trim(),
          createdAt: new Date().toISOString()
        };
        setComments((prev) => [...prev, localComm]);
      }
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  // File Upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAtts = [];
      for (const f of files) {
        const uploaded = await uploadAttachment(f);
        newAtts.push(uploaded);
      }
      const updatedAtts = [...attachments, ...newAtts];
      setAttachments(updatedAtts);
      handleSave({ attachments: updatedAtts });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId) => {
    const updated = attachments.filter((a) => a.id !== attId);
    setAttachments(updated);
    handleSave({ attachments: updated });
  };

  // Copy Task ID
  const handleCopyId = () => {
    if (task?.id) {
      navigator.clipboard?.writeText(task.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Subtask progress calculation
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  if (!isOpen || !task) return null;

  return (
    <div className="tf-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="tf-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <header className="tf-drawer-header">
          <div className="tf-drawer-header-left">
            <span className="tf-drawer-task-id" onClick={handleCopyId} title="Click to copy task ID">
              {task.id}
              {copiedId ? <Check size={12} className="text-green" /> : <Copy size={12} />}
            </span>

            {/* Quick Status Select */}
            <select
              className={`tf-drawer-status-select tf-status-${status}`}
              value={status}
              onChange={(e) => handleSelectStatus(e.target.value)}
              disabled={role === 'manager'}
              title={role === 'manager' ? 'Managers have view-only access. Only Team Leader can approve or modify task status.' : 'Change status'}
            >
              <option value="to-do">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="completed">{role === 'employee' ? 'Completed (Request TL Approval)' : role === 'manager' ? 'Completed (TL Approval Required)' : 'Completed'}</option>
              <option value="overdue">Overdue</option>
              <option value="backlog">Backlog</option>
            </select>

            {/* Priority Select */}
            <select
              className={`tf-drawer-priority-select tf-priority-${priority}`}
              value={priority}
              onChange={(e) => handleSelectPriority(e.target.value)}
              disabled={role === 'manager'}
              title={role === 'manager' ? 'Managers have view-only access.' : 'Change priority'}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="tf-drawer-header-actions">
            {/* Direct Task Removal button (Exclusive to Team Leader) */}
            {role === 'teamleader' && (
              <button
                className="tf-drawer-btn-danger"
                onClick={() => setConfirmDelete(true)}
                title="Delete task permanently"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            <button className="tf-drawer-close-btn" onClick={onClose} aria-label="Close drawer">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Task Completion Approval Alert Banner */}
        {task?.completionRequested && (
          <div className="tf-approval-banner">
            <div className="tf-approval-banner-content">
              <div className="tf-approval-banner-icon">
                <AlertCircle size={22} />
              </div>
              <div className="tf-approval-banner-text">
                <div className="tf-approval-banner-title">
                  {role === 'teamleader'
                    ? 'Completion Approval Requested' 
                    : role === 'manager'
                    ? 'Completion Awaiting Team Leader Approval'
                    : 'Completion Awaiting TL Approval'}
                </div>
                <p className="tf-approval-banner-desc">
                  {role === 'teamleader'
                    ? `${task.completionRequestedBy || 'An employee'} marked this task as completed. Review the deliverables and confirm approval or request revisions.`
                    : role === 'manager'
                    ? `${task.completionRequestedBy || 'An employee'} marked this task as completed. It is currently awaiting approval from the Team Leader (Managers have view-only access).`
                    : 'You submitted this task for completion. It is currently in review and requires approval from your Team Leader before it is marked completed.'}
                </p>
                {task.completionNotes && (
                  <div className="tf-approval-notes">
                    <strong>Note:</strong> {task.completionNotes}
                  </div>
                )}
              </div>
            </div>

            {role === 'teamleader' && (
              <div className="tf-approval-banner-actions">
                <button
                  type="button"
                  className="tf-btn-banner-approve"
                  onClick={() => {
                    onApproveCompletion && onApproveCompletion(task.id);
                  }}
                  title="Approve task completion"
                >
                  <Check size={15} /> Approve Completion
                </button>
                <button
                  type="button"
                  className="tf-btn-banner-reject"
                  onClick={() => {
                    onRejectCompletion && onRejectCompletion(task.id);
                  }}
                  title="Reject and send back to In Progress"
                >
                  <X size={15} /> Request Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Alert Banner */}
        {confirmDelete && role === 'teamleader' && (
          <div className="tf-delete-confirm-banner">
            <div className="tf-confirm-text">
              <AlertCircle size={18} />
              <span>Are you sure you want to permanently remove this task? This action cannot be undone.</span>
            </div>
            <div className="tf-confirm-actions">
              <button
                className="tf-btn-danger-confirm"
                onClick={() => {
                  setConfirmDelete(false);
                  onDeleteTask(task.id);
                  onClose();
                }}
              >
                Confirm Delete
              </button>
              <button className="tf-btn-cancel" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation (Linear & ClickUp inspired) */}
        <nav className="tf-drawer-tabs">
          <button
            className={`tf-drawer-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FileText size={15} />
            <span>Overview</span>
          </button>
          <button
            className={`tf-drawer-tab ${activeTab === 'subtasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('subtasks')}
          >
            <CheckCircle2 size={15} />
            <span>Subtasks ({subtasks.length})</span>
          </button>
          <button
            className={`tf-drawer-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <MessageSquare size={15} />
            <span>Activity & Comments ({comments.length})</span>
          </button>
          <button
            className={`tf-drawer-tab ${activeTab === 'attachments' ? 'active' : ''}`}
            onClick={() => setActiveTab('attachments')}
          >
            <Paperclip size={15} />
            <span>Files ({attachments.length})</span>
          </button>
        </nav>

        {/* Drawer Scrollable Body */}
        <div className="tf-drawer-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tf-tab-pane tf-overview-pane">
              {/* Editable Title */}
              <div className="tf-drawer-section">
                <label className="tf-drawer-label">Task Title</label>
                <input
                  type="text"
                  className="tf-drawer-title-input"
                  value={title}
                  readOnly={role === 'manager'}
                  onChange={(e) => {
                    if (role === 'manager') return;
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={() => isDirty && handleSave()}
                  placeholder="Task title..."
                />
              </div>

              {/* Description */}
              <div className="tf-drawer-section">
                <label className="tf-drawer-label">Description & Context</label>
                <textarea
                  className="tf-drawer-desc-textarea"
                  rows={4}
                  value={description}
                  readOnly={role === 'manager'}
                  onChange={(e) => {
                    if (role === 'manager') return;
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={() => isDirty && handleSave()}
                  placeholder="Add detailed technical requirements, deliverables, or acceptance criteria..."
                />
              </div>

              {/* Metadata Grid */}
              <div className="tf-drawer-grid">
                <div className="tf-drawer-meta-item">
                  <div className="tf-meta-label">
                    <User size={14} />
                    <span>Assignee</span>
                  </div>
                  {(() => {
                    const cleanName = (assignedTo || '').toLowerCase().trim();
                    const details = KNOWN_MEMBERS_MAP[cleanName] || (currentUser?.name?.toLowerCase().trim() === cleanName ? currentUser : null);
                    const pic = details?.picture;
                    const initial = (assignedTo || 'U')[0].toUpperCase();

                    return (
                      <div className="tf-drawer-assignee-container">
                        <div className="tf-drawer-assignee-row">
                          <div className="tf-drawer-assignee-avatar" title={`Assignee: ${assignedTo}`}>
                            {pic ? (
                              <img src={pic} alt={assignedTo} />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <select
                            className="tf-meta-select"
                            value={assignedTo}
                            onChange={(e) => {
                              setAssignedTo(e.target.value);
                              handleSave({ assignedTo: e.target.value });
                            }}
                          >
                            <option value="Arun K">Arun K (Frontend)</option>
                            <option value="Priya S">Priya S (Backend)</option>
                            <option value="Vignesh M">Vignesh M (Cloud)</option>
                            <option value="Nivetha R">Nivetha R (QA)</option>
                            <option value="Karthik D">Karthik D (DevOps)</option>
                            <option value="Sabarinathan V">Sabarinathan V (Cloud Lead)</option>
                          </select>
                        </div>
                        {details && (details.phone || details.location) && (
                          <div className="tf-drawer-assignee-contact-strip">
                            {details.phone && (
                              <span className="tf-contact-micro-pill" title="Contact Phone">
                                <Phone size={11} /> {details.phone}
                              </span>
                            )}
                            {details.location && (
                              <span className="tf-contact-micro-pill" title="Location">
                                <MapPin size={11} /> {details.location}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="tf-drawer-meta-item">
                  <div className="tf-meta-label">
                    <Folder size={14} />
                    <span>Project Workstream</span>
                  </div>
                  <select
                    className="tf-meta-select"
                    value={project}
                    onChange={(e) => {
                      setProject(e.target.value);
                      handleSave({ project: e.target.value });
                    }}
                  >
                    <option value="Web App">Web App</option>
                    <option value="Backend">Backend</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>

                <div className="tf-drawer-meta-item">
                  <div className="tf-meta-label">
                    <Calendar size={14} />
                    <span>Due Date</span>
                  </div>
                  <input
                    type="date"
                    className="tf-meta-input-date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      handleSave({ dueDate: e.target.value });
                    }}
                  />
                </div>

                <div className="tf-drawer-meta-item">
                  <div className="tf-meta-label">
                    <Clock size={14} />
                    <span>Created</span>
                  </div>
                  <span className="tf-meta-static-val">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Sep 21, 2026'}
                  </span>
                </div>
              </div>

              {/* Tags Section */}
              <div className="tf-drawer-section">
                <label className="tf-drawer-label">
                  <Tag size={14} />
                  <span>Tags & Labels</span>
                </label>
                <div className="tf-tags-wrapper">
                  {tags.map((t, idx) => (
                    <span key={idx} className="tf-tag-pill">
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="tf-tag-remove"
                        aria-label={`Remove tag ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="tf-tag-add-box">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="tf-tag-input"
                    />
                    <button type="button" onClick={handleAddTag} className="tf-tag-btn">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtasks Progress Snapshot */}
              {totalSubtasks > 0 && (
                <div className="tf-drawer-section">
                  <div className="tf-subtask-summary-head">
                    <span className="tf-drawer-label">Checklist Progress</span>
                    <span className="tf-subtask-count-text">
                      {completedSubtasks} of {totalSubtasks} completed ({subtaskPercent}%)
                    </span>
                  </div>
                  <div className="tf-progress-track">
                    <div className="tf-progress-fill" style={{ width: `${subtaskPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBTASKS */}
          {activeTab === 'subtasks' && (
            <div className="tf-tab-pane tf-subtasks-pane">
              <div className="tf-subtasks-header">
                <h3>Checklist & Milestones</h3>
                <span className="tf-subtask-badge">
                  {completedSubtasks}/{totalSubtasks} Done
                </span>
              </div>

              <div className="tf-progress-track">
                <div className="tf-progress-fill" style={{ width: `${subtaskPercent}%` }}></div>
              </div>

              {/* Subtasks List */}
              <div className="tf-subtasks-list">
                {subtasks.length === 0 ? (
                  <div className="tf-empty-subtasks">
                    <CheckCircle2 size={32} />
                    <p>No subtasks created yet. Break this task down into bite-sized actionable items.</p>
                  </div>
                ) : (
                  subtasks.map((sub) => (
                    <div key={sub.id} className={`tf-subtask-item ${sub.completed ? 'is-completed' : ''}`}>
                      <label className="tf-subtask-checkbox-label">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="tf-subtask-checkbox"
                        />
                        <span className="tf-subtask-text">{sub.text}</span>
                      </label>
                      <button
                        type="button"
                        className="tf-subtask-delete-btn"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        title="Delete subtask"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Subtask Input */}
              <div className="tf-add-subtask-form">
                <input
                  type="text"
                  placeholder="Add a new checklist step..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="tf-subtask-input"
                />
                <button type="button" onClick={handleAddSubtask} className="tf-subtask-add-btn">
                  <Plus size={16} />
                  <span>Add Step</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY & COMMENTS */}
          {activeTab === 'activity' && (
            <div className="tf-tab-pane tf-activity-pane">
              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="tf-new-comment-box">
                <div className="tf-comment-avatar">{currentUser?.name ? currentUser.name[0] : 'S'}</div>
                <div className="tf-comment-input-wrap">
                  <textarea
                    rows={2}
                    placeholder="Write a comment or update (visible to team in real-time)..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                    className="tf-comment-textarea"
                  />
                  <div className="tf-comment-actions">
                    <span className="tf-comment-hint">Press Enter to send</span>
                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || isPostingComment}
                      className="tf-btn-post-comment"
                    >
                      {isPostingComment ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Feed List */}
              <div className="tf-activity-stream">
                {/* Threaded Comments */}
                <h4 className="tf-stream-subtitle">
                  <MessageSquare size={14} />
                  <span>Discussion ({comments.length})</span>
                </h4>
                {comments.length === 0 ? (
                  <p className="tf-empty-stream-note">No comments posted yet.</p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="tf-comment-bubble">
                      <div className="tf-bubble-avatar">{comm.author ? comm.author[0] : 'U'}</div>
                      <div className="tf-bubble-content">
                        <div className="tf-bubble-header">
                          <span className="tf-bubble-author">{comm.author}</span>
                          <span className="tf-bubble-time">
                            {comm.createdAt ? new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                        <p className="tf-bubble-text">{comm.text}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Audit Activity Log */}
                <h4 className="tf-stream-subtitle mt-4">
                  <History size={14} />
                  <span>System Activity Log</span>
                </h4>
                {activityLog.length === 0 ? (
                  <p className="tf-empty-stream-note">No recent activity recorded.</p>
                ) : (
                  <div className="tf-timeline-list">
                    {activityLog.map((act) => (
                      <div key={act.id} className="tf-timeline-item">
                        <div className="tf-timeline-dot"></div>
                        <div className="tf-timeline-detail">
                          <span className="tf-timeline-user">{act.user}</span> {act.action}
                          <span className="tf-timeline-date">
                            {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="tf-tab-pane tf-attachments-pane">
              <div className="tf-attachments-header">
                <h3>Task Files & Assets</h3>
                <span className="tf-att-count">{attachments.length} Files</span>
              </div>

              {/* Upload Drop Zone */}
              <div
                className="tf-dropzone"
                onClick={() => fileInputRef.current?.click()}
                title="Click to select file"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  multiple
                />
                {isUploading ? (
                  <div className="tf-uploading-state">
                    <Loader2 size={24} className="spin text-blue" />
                    <span>Uploading attachment to cloud storage...</span>
                  </div>
                ) : (
                  <div className="tf-dropzone-prompt">
                    <UploadCloud size={28} />
                    <p>Click to upload or drag files here</p>
                    <span>Supports documents, images, PDFs (up to 50MB)</span>
                  </div>
                )}
              </div>

              {/* Attachments List */}
              <div className="tf-attachments-list">
                {attachments.length === 0 ? (
                  <p className="tf-empty-files-text">No attachments linked to this task.</p>
                ) : (
                  attachments.map((att) => (
                    <div key={att.id} className="tf-attachment-card">
                      <div className="tf-att-icon">
                        <FileText size={20} />
                      </div>
                      <div className="tf-att-info">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="tf-att-filename"
                          title="Open or download file"
                        >
                          {att.filename}
                        </a>
                        <span className="tf-att-meta">
                          {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Cloud Asset'} •{' '}
                          {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <div className="tf-att-actions">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="tf-att-btn"
                          title="View"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          className="tf-att-btn text-danger"
                          onClick={() => handleRemoveAttachment(att.id)}
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Bar */}
        <footer className="tf-drawer-footer">
          <div className="tf-drawer-footer-left">
            <span className="tf-sync-status-indicator">
              <span className="tf-live-dot-pulse"></span>
              <span>Changes sync in real-time</span>
            </span>
          </div>
          <div className="tf-drawer-footer-right">
            <button className="tf-btn-drawer-close" onClick={onClose}>
              Done
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
