import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  UploadCloud, 
  Paperclip, 
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { uploadAttachment } from '../services/api';

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  defaultStatus = 'backlog',
  role = 'manager'
}) {
  const isEditing = Boolean(taskToEdit && taskToEdit.id);
  const isEmployee = role === 'employee';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('Arun K');
  const [project, setProject] = useState('Web App');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Populate when editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setAssignedTo(taskToEdit.assignedTo || 'Arun K');
      setProject(taskToEdit.project || 'Web App');
      setStatus(taskToEdit.status || defaultStatus);
      setPriority(taskToEdit.priority || 'medium');
      setDueDate(taskToEdit.dueDate || '');
      setTags(taskToEdit.tags || []);
      setSubtasks(taskToEdit.subtasks || []);
      setAttachments(taskToEdit.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setAssignedTo('Arun K');
      setProject('Web App');
      setStatus(defaultStatus || 'to-do');
      setPriority('medium');
      setDueDate('');
      setTags([]);
      setSubtasks([]);
      setAttachments([]);
    }
    setFormError('');
    setUploadError('');
  }, [taskToEdit, defaultStatus]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Subtask Handlers
  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: subtaskInput.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setSubtaskInput('');
  };

  const handleToggleSubtask = (subId) => {
    setSubtasks(subtasks.map((s) => s.id === subId ? { ...s, completed: !s.completed } : s));
  };

  const handleRemoveSubtask = (subId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subId));
  };

  // Tag Handlers
  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Attachment Upload Handler
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      for (const file of files) {
        const uploaded = await uploadAttachment(file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId) => {
    setAttachments(attachments.filter((a) => a.id !== attId));
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      project,
      status,
      priority,
      dueDate,
      tags,
      subtasks,
      attachments
    };

    try {
      await onSave(payload, taskToEdit?.id);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {isEditing ? (isEmployee ? 'Task Progress & Details' : 'Edit Task') : 'Assign New Task'}
            </h2>
            <span className="modal-subtitle">
              {isEditing 
                ? (isEmployee ? 'Review requirements, update checklist progress, and track deliverables' : (taskToEdit.title || `Task ID: ${taskToEdit.id}`))
                : 'Configure deliverables, assignees, and deadlines'}
            </span>
          </div>
          <button className="btn-icon modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="task-title" className="form-label">
              Task Title <span className="text-required">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="e.g., Deploy DynamoDB Global Secondary Index"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="task-desc" className="form-label">
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              className="form-textarea"
              placeholder="Provide context, acceptance criteria, or architectural notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Assignment & Project Row */}
          <div className="form-row-duo">
            <div className="form-group">
              <label htmlFor="task-assigned" className="form-label">Assigned To {isEmployee && <span className="tf-badge-readonly">(Read-only)</span>}</label>
              <select
                id="task-assigned"
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isEmployee}
              >
                <option value="Arun K">Arun K</option>
                <option value="Priya S">Priya S</option>
                <option value="Vignesh M">Vignesh M</option>
                <option value="Nivetha R">Nivetha R</option>
                <option value="Karthik D">Karthik D</option>
                <option value="Sabarinathan V">Sabarinathan V</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-project" className="form-label">Project {isEmployee && <span className="tf-badge-readonly">(Read-only)</span>}</label>
              <select
                id="task-project"
                className="form-select"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                disabled={isEmployee}
              >
                <option value="Web App">Web App</option>
                <option value="Backend">Backend</option>
                <option value="Cloud">Cloud</option>
                <option value="Mobile App">Mobile App</option>
                <option value="Documentation">Documentation</option>
              </select>
            </div>
          </div>

          {/* Controls Row: Status, Priority, Due Date */}
          <div className="form-row-triplet">
            <div className="form-group">
              <label htmlFor="task-status" className="form-label">Status</label>
              <select
                id="task-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="to-do">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="backlog">Backlog</option>
                <option value="in-review">In Review</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority" className="form-label">Priority</label>
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-due-date" className="form-label">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="form-group">
            <label className="form-label">Checklist & Subtasks</label>
            <div className="subtask-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="Add subtask item..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleAddSubtask}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="subtask-list">
                {subtasks.map((sub) => (
                  <div key={sub.id} className="subtask-item">
                    <label className="subtask-checkbox-label">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                      />
                      <span className={sub.completed ? 'subtask-done' : ''}>
                        {sub.text}
                      </span>
                    </label>
                    {!isEmployee && (
                      <button
                        type="button"
                        className="subtask-remove-btn"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        title="Remove subtask"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="form-group">
            <label className="form-label">Tags & Categories</label>
            <div className="tag-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="Type tag name and press Enter (e.g., aws, backend)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleAddTag}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="tags-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill tag-removable">
                    #{tag}
                    {!isEmployee && (
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="form-group">
            <label className="form-label">AWS S3 / Local Attachments</label>
            <div 
              className="dropzone-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
              />
              {isUploading ? (
                <div className="dropzone-uploading">
                  <Loader2 className="is-spinning" size={24} />
                  <span>Transferring attachment via Presigned URL...</span>
                </div>
              ) : (
                <div className="dropzone-content">
                  <UploadCloud size={24} className="dropzone-icon" />
                  <p className="dropzone-title">Click to upload files</p>
                  <p className="dropzone-subtitle">Direct upload to Amazon S3 or local storage</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="upload-error-text">
                <AlertCircle size={13} />
                <span>{uploadError}</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((att) => (
                  <div key={att.id} className="attachment-item">
                    <div className="attachment-info">
                      <FileText size={15} className="attachment-icon" />
                      <a 
                        href={att.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="attachment-name"
                      >
                        {att.filename}
                      </a>
                      {att.fileSize && (
                        <span className="attachment-size">
                          ({Math.round(att.fileSize / 1024)} KB)
                        </span>
                      )}
                    </div>
                    {!isEmployee && (
                      <button
                        type="button"
                        className="attachment-remove-btn"
                        onClick={() => handleRemoveAttachment(att.id)}
                        title="Remove attachment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary tf-modal-btn-submit"
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="is-spinning" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEditing ? (isEmployee ? 'Update Progress' : 'Update Task') : 'Assign Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
