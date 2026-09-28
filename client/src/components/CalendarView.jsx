import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Lock, 
  Users, 
  UserCheck, 
  Clock, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * Checks whether a given task is assigned to the specified user.
 */
function isTaskAssignedToUser(task, currentUser) {
  if (!task || !currentUser) return false;
  const assigned = (task.assignedTo || '').trim().toLowerCase();
  const userName = (currentUser.name || '').trim().toLowerCase();
  const userEmail = (currentUser.email || '').trim().toLowerCase();

  if (!assigned) return false;

  // Direct match or substring match
  if (assigned === userName) return true;
  if (userName && (assigned.includes(userName) || userName.includes(assigned))) return true;
  if (userEmail && (assigned === userEmail || task.assignedToEmail === userEmail)) return true;
  if (task.assigneeId && currentUser.id && task.assigneeId === currentUser.id) return true;

  return false;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView({
  role = 'manager',
  user = { name: 'Sabarinathan V' },
  tasks = [],
  onOpenDetail
}) {
  const isEmployee = role === 'employee';
  const isTL = role === 'teamleader';
  const isManager = role === 'manager';

  // Calendar Date State (defaults to sprint month September 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)

  // Manager / TL specific filter: filter by a particular assignee or view all
  const [selectedAssignee, setSelectedAssignee] = useState('all');

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentSprint = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
  };

  // Distinct assignees for Manager/TL filtering
  const availableAssignees = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.assignedTo && t.assignedTo.trim()) {
        set.add(t.assignedTo.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // CRITICAL REQUIREMENT:
  // If role is employee: strictly filter tasks so they ONLY see their own tasks!
  // If role is manager or TL: they can see all tasks across the team.
  const visibleTasks = useMemo(() => {
    if (isEmployee) {
      // Employees only see their own tasks. Tasks belonging to anyone else are removed.
      return tasks.filter((task) => isTaskAssignedToUser(task, user));
    }

    // Manager and Team Leader see all tasks, with optional filter by assignee
    if (selectedAssignee !== 'all') {
      return tasks.filter((t) => (t.assignedTo || '').toLowerCase() === selectedAssignee.toLowerCase());
    }

    return tasks;
  }, [tasks, isEmployee, user, selectedAssignee]);

  // Compute month layout: total days and starting day offset
  const { totalDays, startOffset, daysList } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // In JS getDay(): 0 is Sunday, 1 is Monday...
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // Convert to Monday = 0, Sunday = 6
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const datePrefix = `${currentYear}-${monthStr}-${dayStr}`;

      // Filter tasks due on this date
      const dayTasks = visibleTasks.filter((t) => {
        if (!t.dueDate) return false;
        if (t.dueDate === datePrefix) return true;
        // Fallback for short date or suffix format
        return t.dueDate.endsWith(`-${dayStr}`) && (currentMonth === 8 && currentYear === 2026);
      });

      list.push({
        day,
        dateStr: datePrefix,
        isToday: currentYear === 2026 && currentMonth === 8 && day === 21,
        tasks: dayTasks
      });
    }

    return { totalDays: daysInMonth, startOffset: offset, daysList: list };
  }, [currentYear, currentMonth, visibleTasks]);

  return (
    <div className="tf-calendar-view-container">
      {/* Calendar Top Control Header */}
      <div className="tf-cal-header-bar">
        <div className="tf-cal-title-group">
          <div className="tf-cal-icon-wrap">
            <CalendarIcon size={22} className={isEmployee ? 'tf-text-green' : isTL ? 'tf-text-indigo' : 'tf-text-terracotta'} />
          </div>
          <div>
            <h2 className="tf-cal-month-title">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <p className="tf-cal-subtitle">
              {isEmployee 
                ? `Showing tasks assigned to ${user?.name || 'you'}. Tasks assigned to others are hidden.`
                : isTL
                ? `Team Leader Overview — Full visibility of sprint deliverables across all assignees.`
                : `Engineering Management Schedule — Project milestones and team deadlines.`}
            </p>
          </div>
        </div>

        {/* Navigation & Sprint Reset */}
        <div className="tf-cal-nav-actions">
          <button 
            type="button" 
            className="tf-cal-nav-btn" 
            onClick={handlePrevMonth} 
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button" 
            className="tf-cal-today-btn" 
            onClick={handleResetToCurrentSprint}
            title="Jump to Current Sprint (Sep 2026)"
          >
            Current Sprint
          </button>
          <button 
            type="button" 
            className="tf-cal-nav-btn" 
            onClick={handleNextMonth} 
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Role-Based Access Banner & Filter Row */}
      <div className="tf-cal-role-banner-row">
        {isEmployee ? (
          /* Employee Strict Privacy Pill */
          <div className="tf-cal-badge-privacy">
            <Lock size={15} />
            <span>
              <strong>Personal Schedule Mode:</strong> You are viewing tasks assigned to <strong>{user?.name || 'you'}</strong>. Other members' tasks are hidden.
            </span>
          </div>
        ) : (
          /* Manager / TL Full Access & Assignee Filter Controls */
          <div className="tf-cal-mgr-controls">
            <div className="tf-cal-badge-full">
              <Users size={15} />
              <span>
                <strong>{isTL ? 'Team Leader Access:' : 'Manager Access:'}</strong> Full team schedule ({visibleTasks.length} visible deliverables)
              </span>
            </div>

            {/* Filter by Team Member */}
            <div className="tf-cal-assignee-filter">
              <span className="tf-filter-label">Filter Assignee:</span>
              <select
                className="tf-cal-select"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
              >
                <option value="all">All Team Members ({tasks.length})</option>
                {availableAssignees.map((assignee) => {
                  const count = tasks.filter((t) => (t.assignedTo || '').toLowerCase() === assignee.toLowerCase()).length;
                  return (
                    <option key={assignee} value={assignee}>
                      {assignee} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid Container */}
      <div className="tf-cal-board">
        {/* Weekday Names Header (Mon - Sun) */}
        <div className="tf-cal-weekdays-row">
          {WEEKDAY_NAMES.map((weekday) => (
            <div key={weekday} className="tf-cal-weekday-cell">
              {weekday}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="tf-cal-days-grid">
          {/* Empty Padding Cells Before 1st Day */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="tf-cal-cell tf-cal-cell-empty" />
          ))}

          {/* Days of Current Month */}
          {daysList.map(({ day, isToday, tasks: dayTasks }) => (
            <div 
              key={day} 
              className={`tf-cal-cell ${isToday ? 'tf-cal-today-cell' : ''} ${dayTasks.length > 0 ? 'tf-cal-has-tasks' : ''}`}
            >
              <div className="tf-cal-cell-top">
                <span className={`tf-cal-day-number ${isToday ? 'tf-today-pill' : ''}`}>
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="tf-cal-task-count">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              {/* Tasks for this day */}
              <div className="tf-cal-cell-tasks">
                {dayTasks.map((t) => {
                  const priorityClass = `tf-cal-prio-${t.priority || 'medium'}`;
                  const statusClass = `tf-cal-status-${t.status || 'to-do'}`;
                  return (
                    <div
                      key={t.id}
                      className={`tf-cal-task-chip ${priorityClass} ${statusClass}`}
                      onClick={() => onOpenDetail && onOpenDetail(t)}
                      title={`[${t.status?.toUpperCase()}] ${t.title} — Assigned to: ${t.assignedTo || 'Unassigned'}`}
                    >
                      <div className="tf-cal-chip-header">
                        <span className={`tf-prio-dot tf-dot-${t.priority || 'medium'}`} />
                        <span className="tf-cal-chip-title">{t.title}</span>
                      </div>
                      
                      {/* Show Assignee badge ONLY for Manager and TL so they know who owns it */}
                      {!isEmployee && t.assignedTo && (
                        <div className="tf-cal-chip-assignee">
                          👤 {t.assignedTo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Footer Info */}
      <div className="tf-cal-footer">
        <div className="tf-cal-legend">
          <span className="tf-legend-item">
            <span className="tf-prio-dot tf-dot-urgent" /> Urgent
          </span>
          <span className="tf-legend-item">
            <span className="tf-prio-dot tf-dot-high" /> High
          </span>
          <span className="tf-legend-item">
            <span className="tf-prio-dot tf-dot-medium" /> Medium
          </span>
          <span className="tf-legend-item">
            <span className="tf-prio-dot tf-dot-low" /> Low
          </span>
        </div>
        <div className="tf-cal-note">
          {isEmployee ? (
            <span>🔒 Confidentiality Rule: Employee calendars filter strictly to individual assignments.</span>
          ) : (
            <span>👥 Team Oversight: Manager and Team Leader have unified visibility of all assignments.</span>
          )}
        </div>
      </div>
    </div>
  );
}
