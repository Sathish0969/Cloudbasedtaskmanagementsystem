import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RoleSelect from './components/RoleSelect';
import AuthLogin from './components/AuthLogin';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import StatCards from './components/StatCards';
import TaskTable from './components/TaskTable';
import TaskModal from './components/TaskModal';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import TeamView from './components/TeamView';
import QueriesView from './components/QueriesView';
import ProfileView from './components/ProfileView';
import { 
  fetchTasks, 
  fetchTaskStats, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask,
  approveTaskCompletion,
  rejectTaskCompletion,
  requestTaskCompletion
} from './services/api';
import { taskWs } from './services/websocket';
import './App.css';

// Fallback tasks in case backend storage is empty/offline
const DEFAULT_TASKS = [
  {
    id: "task-101",
    title: "Design login page",
    description: "Create responsive role-based authentication interface for Manager and Employee workflows.",
    assignedTo: "Arun K",
    project: "Web App",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-09-21",
    tags: ["ui", "design", "security"],
    subtasks: [
      { id: "sub-1", text: "Wireframes for role portal", completed: true },
      { id: "sub-2", text: "CSS design token audit", completed: false }
    ],
    comments: [
      { id: "c1", author: "Arun K", text: "Initial wireframes uploaded.", createdAt: "2026-09-20T10:00:00" }
    ],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-102",
    title: "Write API documentation",
    description: "Document all FastAPI endpoints with OpenAPI Swagger specs.",
    assignedTo: "Priya S",
    project: "Backend",
    status: "completed",
    priority: "medium",
    dueDate: "2026-09-22",
    tags: ["api", "docs"],
    subtasks: [
      { id: "sub-3", text: "Swagger 3.0 specs", completed: true }
    ],
    comments: [],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-103",
    title: "Fix database issues",
    description: "Optimize DynamoDB scan latency and query indexing.",
    assignedTo: "Vignesh M",
    project: "Cloud",
    status: "in-progress",
    priority: "urgent",
    dueDate: "2026-09-23",
    tags: ["aws", "dynamodb"],
    subtasks: [],
    comments: [],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-104",
    title: "UI review and feedback",
    description: "Stakeholder testing across desktop and mobile screens.",
    assignedTo: "Nivetha R",
    project: "Mobile App",
    status: "overdue",
    priority: "high",
    dueDate: "2026-09-24",
    tags: ["review", "feedback"],
    subtasks: [],
    comments: [],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-105",
    title: "Prepare project report",
    description: "Compile quarterly sprint metrics and team velocity charts.",
    assignedTo: "Karthik D",
    project: "Documentation",
    status: "to-do",
    priority: "low",
    dueDate: "2026-09-25",
    tags: ["report", "sprint"],
    subtasks: [],
    comments: [],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-106",
    title: "Cloud Infrastructure & IAM Security Audit",
    description: "Review IAM policies, audit S3 access logs, and optimize AWS security group rules.",
    assignedTo: "Sabarinathan V",
    project: "Cloud",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-09-26",
    tags: ["cloud", "security", "iam"],
    subtasks: [
      { id: "sub-106-1", text: "Audit IAM role boundaries", completed: true },
      { id: "sub-106-2", text: "Review S3 bucket encryption", completed: false }
    ],
    comments: [],
    activityLog: [],
    attachments: []
  },
  {
    id: "task-107",
    title: "Deploy automated CI/CD pipeline",
    description: "Configure GitHub Actions runner with containerized microservice builds.",
    assignedTo: "Sabarinathan V",
    project: "Backend",
    status: "to-do",
    priority: "urgent",
    dueDate: "2026-09-28",
    tags: ["devops", "cicd"],
    subtasks: [],
    comments: [],
    activityLog: [],
    attachments: []
  }
];

export default function App() {
  // Navigation Screens: 'role-select' | 'login' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState(() => {
    return localStorage.getItem('tf_screen') || 'role-select';
  });

  // Current Role: 'manager' | 'employee'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('tf_role') || 'manager';
  });

  // Auth initial mode: 'login' | 'create-account'
  const [authInitialMode, setAuthInitialMode] = useState('login');

  // User State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tf_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.accountRole) {
          parsed.accountRole = parsed.role || 'manager';
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return {
      name: 'Sabarinathan V',
      email: 'sabarinathan@taskflow.cloud',
      role: 'manager',
      accountRole: 'manager'
    };
  });

  // Sidebar Active Navigation item
  const [activeNav, setActiveNav] = useState(() => {
    return currentRole === 'manager' ? 'dashboard' : 'my-tasks';
  });

  // Application Data
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-Time WebSocket Connection Status ('connecting' | 'connected' | 'disconnected')
  const [wsStatus, setWsStatus] = useState('connecting');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Quick Modal State (Create / Edit basic)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState('to-do');

  // Task Detail Drawer State (Linear / ClickUp rich inspector)
  const [activeDetailTask, setActiveDetailTask] = useState(null);

  // View Mode for Tasks: 'table' | 'kanban'
  const [viewMode, setViewMode] = useState('table');

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('tf_screen', currentScreen);
    localStorage.setItem('tf_role', currentRole);
    localStorage.setItem('tf_user', JSON.stringify(user));
  }, [currentScreen, currentRole, user]);

  // Adjust default active nav when role switches
  useEffect(() => {
    setActiveNav(currentRole === 'manager' ? 'dashboard' : 'my-tasks');
    setSelectedStatus('all');
  }, [currentRole]);

  // Load Data from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [taskList, statsData] = await Promise.all([
        fetchTasks({ status: 'all', priority: 'all' }).catch(() => null),
        fetchTaskStats().catch(() => null)
      ]);

      if (taskList && taskList.length > 0) {
        setTasks(taskList);
      } else {
        setTasks(DEFAULT_TASKS);
      }

      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Using default tasks due to connection notice:', err);
      setTasks(DEFAULT_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------------------------------------------------------------
  // Real-Time WebSocket Synchronization Setup
  // -------------------------------------------------------------
  useEffect(() => {
    taskWs.connect();

    // Connection status listener
    const unbindStatus = taskWs.onStatusChange((status) => {
      setWsStatus(status);
    });

    // Real-Time Event Handlers
    const unbindCreated = taskWs.on('TASK_CREATED', (createdTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === createdTask.id)) return prev;
        return [createdTask, ...prev];
      });
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast(`⚡ Live: "${createdTask.title}" added`, 'info');
    });

    const unbindUpdated = taskWs.on('TASK_UPDATED', (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      setActiveDetailTask((current) => (current && current.id === updatedTask.id ? updatedTask : current));
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
    });

    const unbindStatusChanged = taskWs.on('TASK_STATUS_CHANGED', ({ id, status, task: updated }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? (updated ? updated : { ...t, status }) : t))
      );
      setActiveDetailTask((current) =>
        current && current.id === id ? (updated ? updated : { ...current, status }) : current
      );
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
    });

    const unbindDeleted = taskWs.on('TASK_DELETED', ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setActiveDetailTask((current) => (current && current.id === id ? null : current));
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast('⚡ Live: Task removed by collaborator', 'info');
    });

    const unbindComment = taskWs.on('COMMENT_ADDED', ({ taskId, task: updated }) => {
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        setActiveDetailTask((current) => (current && current.id === taskId ? updated : current));
      }
      addToast('💬 Live: New comment posted', 'info');
    });

    const unbindCompletionRequested = taskWs.on('TASK_COMPLETION_REQUESTED', ({ id, requestedBy, task: updated }) => {
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setActiveDetailTask((current) => (current && current.id === id ? updated : current));
      }
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      if (currentRole === 'teamleader') {
        addToast(`🔔 Completion Approval Request: ${requestedBy || 'An employee'} submitted a task for your confirmation.`, 'info');
      }
    });

    const unbindCompletionApproved = taskWs.on('TASK_COMPLETION_APPROVED', ({ id, approvedBy, task: updated }) => {
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setActiveDetailTask((current) => (current && current.id === id ? updated : current));
      }
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast(`✓ Live: Task completion confirmed and approved by ${approvedBy}!`, 'success');
    });

    const unbindQueryCreated = taskWs.on('QUERY_CREATED', (newQ) => {
      if (currentRole === 'teamleader') {
        addToast(`📩 Live Query: ${newQ.senderName} sent a query to Team Leader!`, 'info');
      }
    });

    const unbindQueryUpdated = taskWs.on('QUERY_UPDATED', (updatedQ) => {
      if (currentRole === 'employee' && user?.email && (updatedQ.senderEmail || '').toLowerCase() === user.email.toLowerCase()) {
        addToast(`💬 Live Query: Team Leader responded to "${updatedQ.subject}"!`, 'success');
      }
    });

    return () => {
      unbindStatus();
      unbindCreated();
      unbindUpdated();
      unbindStatusChanged();
      unbindDeleted();
      unbindComment();
      unbindCompletionRequested();
      unbindCompletionApproved();
      unbindQueryCreated();
      unbindQueryUpdated();
    };
  }, [addToast, currentRole, user?.email]);

  // -------------------------------------------------------------
  // Keyboard Shortcuts: "N" for new task (Team Leader only)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't trigger shortcut if user is currently typing in an input or textarea
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (currentRole !== 'teamleader') {
          addToast('🔒 Access Restricted: Only Team Leader (TL) has permission to create or assign tasks.', 'error');
          return;
        }
        setTaskToEdit(null);
        setDefaultModalStatus('to-do');
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentRole, addToast]);

  // Role Selection Handler
  const handleSelectRole = (role, mode = 'login') => {
    setCurrentRole(role);
    setUser((prev) => ({ ...prev, role }));
    setAuthInitialMode(mode);
    setCurrentScreen('login');
  };

  // Back to Role Select
  const handleBackToRoleSelect = () => {
    localStorage.setItem('tf_screen', 'role-select');
    setCurrentScreen('role-select');
  };

  // Switch Role Handler (direct return to 3-option main menu)
  const handleSwitchRole = () => {
    localStorage.setItem('tf_screen', 'role-select');
    setCurrentScreen('role-select');
    addToast('Returned to 3-Role Main Menu', 'info');
  };

  // Login Success Handler
  const handleLoginSuccess = (userData) => {
    const enrichedUser = {
      ...userData,
      accountRole: userData.role || currentRole
    };
    setUser(enrichedUser);
    if (userData.role) {
      setCurrentRole(userData.role);
    }
    setCurrentScreen('dashboard');
    addToast(`Welcome, ${userData.name}!`, 'success');
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.setItem('tf_screen', 'role-select');
    setCurrentScreen('role-select');
    addToast('Logged out successfully', 'info');
  };

  // Status Change (Optimistic Update with TL Confirmation Workflow)
  const handleStatusChange = async (taskId, newStatus, optionalNotes = '') => {
    const isEmp = currentRole === 'employee';
    const isCompleted = newStatus === 'completed';

    // If an employee marks as completed, route to pending TL approval
    if (isEmp && isCompleted) {
      const now = new Date().toISOString();
      setTasks((current) =>
        current.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'in-review',
                completionRequested: true,
                completionRequestedBy: user?.name || 'Employee',
                completionRequestedAt: now,
                completionNotes: optionalNotes || 'Submitted for TL completion confirmation'
              }
            : t
        )
      );
      if (activeDetailTask && activeDetailTask.id === taskId) {
        setActiveDetailTask((prev) => ({
          ...prev,
          status: 'in-review',
          completionRequested: true,
          completionRequestedBy: user?.name || 'Employee',
          completionRequestedAt: now,
          completionNotes: optionalNotes || 'Submitted for TL completion confirmation'
        }));
      }

      try {
        await updateTaskStatus(taskId, 'completed', user?.name || 'Employee', optionalNotes);
        fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
        addToast('⏳ Submitted for completion! Request sent to Team Leader (TL) for confirmation.', 'info');
      } catch (err) {
        fetchTasks().then((res) => setTasks(res?.tasks || res || [])).catch(() => {});
        addToast(err.message || 'Failed to submit completion request', 'error');
      }
      return;
    }

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (activeDetailTask && activeDetailTask.id === taskId) {
      setActiveDetailTask((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await updateTaskStatus(taskId, newStatus, user?.name || 'User');
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast(`Status updated to ${newStatus.replace('-', ' ')}`, 'success');
    } catch (err) {
      console.warn('Status update API notice:', err);
      addToast(`Status updated to ${newStatus.replace('-', ' ')}`, 'success');
    }
  };

  // TL: Confirm and Approve Task Completion
  const handleApproveCompletion = async (taskId) => {
    if (currentRole !== 'teamleader' && currentRole !== 'manager') {
      addToast('🔒 Access Restricted: Only Team Leader can approve task completion.', 'error');
      return;
    }

    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'completed',
              completionRequested: false,
              completionApprovedBy: user?.name || 'Team Leader',
              completionApprovedAt: now
            }
          : t
      )
    );
    if (activeDetailTask && activeDetailTask.id === taskId) {
      setActiveDetailTask((prev) => ({
        ...prev,
        status: 'completed',
        completionRequested: false,
        completionApprovedBy: user?.name || 'Team Leader',
        completionApprovedAt: now
      }));
    }

    try {
      await approveTaskCompletion(taskId, user?.name || 'Team Leader');
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast('✓ Task completion confirmed and approved!', 'success');
    } catch (err) {
      fetchTasks().then((res) => setTasks(res?.tasks || res || [])).catch(() => {});
      addToast(err.message || 'Failed to approve completion', 'error');
    }
  };

  // TL: Reject / Request Revisions on Task Completion
  const handleRejectCompletion = async (taskId) => {
    if (currentRole !== 'teamleader' && currentRole !== 'manager') {
      addToast('🔒 Access Restricted: Only Team Leader can reject completion.', 'error');
      return;
    }

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? { ...t, status: 'in-progress', completionRequested: false }
          : t
      )
    );
    if (activeDetailTask && activeDetailTask.id === taskId) {
      setActiveDetailTask((prev) => ({
        ...prev,
        status: 'in-progress',
        completionRequested: false
      }));
    }

    try {
      await rejectTaskCompletion(taskId, user?.name || 'Team Leader');
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
      addToast('Task returned to In Progress for revisions.', 'info');
    } catch (err) {
      fetchTasks().then((res) => setTasks(res?.tasks || res || [])).catch(() => {});
      addToast(err.message || 'Failed to reject completion', 'error');
    }
  };

  // Create / Update Task via Modal
  const handleSaveTask = async (taskData, editingId) => {
    try {
      if (editingId) {
        const updated = await updateTask(editingId, taskData).catch(() => ({
          ...taskData,
          id: editingId,
          updatedAt: new Date().toISOString()
        }));
        setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        if (activeDetailTask && activeDetailTask.id === editingId) {
          setActiveDetailTask(updated);
        }
        addToast('Task updated successfully', 'success');
      } else {
        // Enforce RBAC: Only Team Leader can create or assign tasks
        if (currentRole !== 'teamleader') {
          throw new Error('Access Denied: Neither Manager nor Employee has permission to create tasks. Only Team Leader (TL) is authorized.');
        }
        const created = await createTask(taskData, currentRole);
        setTasks((prev) => [created, ...prev]);
        addToast('New task assigned to team member', 'success');
      }
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  // Direct Update from Detail Drawer
  const handleUpdateTaskDirect = async (taskId, updates) => {
    try {
      const updated = await updateTask(taskId, updates).catch(() => ({
        ...updates,
        id: taskId,
        updatedAt: new Date().toISOString()
      }));
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
      setActiveDetailTask((prev) => (prev && prev.id === taskId ? { ...prev, ...updated } : prev));
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Delete Task with Full Control
  const handleDeleteTask = async (taskId) => {
    if (currentRole === 'employee') {
      addToast('🔒 Access Restricted: Employees do not have permission to delete tasks.', 'error');
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeDetailTask && activeDetailTask.id === taskId) {
      setActiveDetailTask(null);
    }

    try {
      await deleteTask(taskId);
      addToast('Task removed from workspace', 'info');
      fetchTaskStats().then((s) => s && setStats(s)).catch(() => {});
    } catch (err) {
      // Revert/refresh on deletion error
      fetchTasks().then((res) => setTasks(res?.tasks || res || [])).catch(() => {});
      addToast(err?.message || 'Failed to remove task', 'error');
    }
  };

  // Modal Openers
  const handleOpenAssignModal = () => {
    if (currentRole !== 'teamleader') {
      addToast('🔒 Access Restricted: Only Team Leader (TL) has permission to create or assign tasks.', 'error');
      return;
    }
    setTaskToEdit(null);
    setDefaultModalStatus('to-do');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Detail Drawer Opener (Linear & ClickUp view)
  const handleOpenDetail = (task) => {
    setActiveDetailTask(task);
  };

  // Filter Tasks based on Selected Tab, Role, and Search Query
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (selectedStatus && selectedStatus !== 'all') {
      result = result.filter((t) => {
        if (selectedStatus === 'to-do') return t.status === 'to-do' || t.status === 'backlog';
        if (selectedStatus === 'in-progress') return t.status === 'in-progress';
        if (selectedStatus === 'completed') return t.status === 'completed';
        if (selectedStatus === 'overdue') return t.status === 'overdue';
        return t.status === selectedStatus;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
          (t.project && t.project.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [tasks, selectedStatus, searchQuery]);

  // Screen 1: Role Selection
  if (currentScreen === 'role-select') {
    return <RoleSelect onSelectRole={handleSelectRole} />;
  }

  // Screen 2: Role Login
  if (currentScreen === 'login') {
    return (
      <AuthLogin
        role={currentRole}
        initialMode={authInitialMode}
        onBack={handleBackToRoleSelect}
        onSelectRole={handleSelectRole}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Screen 3: Dashboard Layout
  return (
    <div className={`tf-app-layout tf-role-${currentRole}`}>
      {/* Left Sidebar */}
      <Sidebar
        role={currentRole}
        user={user}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Layout */}
      <div className="tf-main-wrapper">
        {/* Top Header with Real-Time Live Sync Indicator */}
        <TopNav
          role={currentRole}
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAssignModal={handleOpenAssignModal}
          onOpenQueries={() => setActiveNav('queries')}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          onUpdateUser={(updated) => {
            setUser((prev) => {
              const next = { ...prev, ...updated };
              localStorage.setItem('tf_user', JSON.stringify(next));
              return next;
            });
          }}
          addToast={addToast}
          wsStatus={wsStatus}
        />

        {/* Dashboard Content */}
        <main className="tf-dashboard-body">
          {/* Active Navigation: Main Dashboard / Tasks */}
          {(activeNav === 'dashboard' || activeNav === 'my-tasks' || activeNav === 'tasks') && (
            <>
              {/* Stat Cards Row */}
              <StatCards
                role={currentRole}
                stats={stats}
                tasks={tasks}
              />

              {/* View Toggle Bar (Table vs Interactive Kanban) */}
              {viewMode === 'kanban' ? (
                <div className="tf-kanban-section">
                  <div className="tf-kanban-top">
                    <h3>Interactive Task Board</h3>
                    <button 
                      className="tf-btn-toggle-view"
                      onClick={() => setViewMode('table')}
                    >
                      ← Back to Table View
                    </button>
                  </div>
                  <KanbanBoard
                    tasks={filteredTasks}
                    onEditTask={handleOpenEditModal}
                    onOpenDetail={handleOpenDetail}
                    onDeleteTask={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    onApproveCompletion={handleApproveCompletion}
                    onRejectCompletion={handleRejectCompletion}
                    role={currentRole}
                    onQuickAdd={(colId) => {
                      setDefaultModalStatus(colId);
                      setTaskToEdit(null);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              ) : (
                /* Primary Tasks Table */
                <TaskTable
                  role={currentRole}
                  user={user}
                  tasks={filteredTasks}
                  onEditTask={handleOpenEditModal}
                  onOpenDetail={handleOpenDetail}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onApproveCompletion={handleApproveCompletion}
                  onRejectCompletion={handleRejectCompletion}
                  activeFilter={selectedStatus}
                  onFilterChange={setSelectedStatus}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onViewAll={() => setViewMode('kanban')}
                />
              )}
            </>
          )}

          {/* Team / Squads View (Team Leader exclusive management, Employee view-only) */}
          {activeNav === 'team' && (
            <TeamView
              role={currentRole}
              user={user}
              tasks={tasks}
              addToast={addToast}
            />
          )}

          {/* Queries View (Team Member to Team Leader & 5 FAQs) */}
          {activeNav === 'queries' && (
            <QueriesView
              role={currentRole}
              user={user}
              tasks={tasks}
              addToast={addToast}
              onOpenTaskDetail={handleOpenDetail}
            />
          )}

          {/* Profile View: Dedicated Profile Picture & Contact Details Management */}
          {activeNav === 'profile' && (
            <ProfileView
              role={currentRole}
              user={user}
              tasks={tasks}
              onUpdateUser={(updated) => {
                setUser((prev) => {
                  const next = { ...prev, ...updated };
                  localStorage.setItem('tf_user', JSON.stringify(next));
                  return next;
                });
              }}
              addToast={addToast}
            />
          )}

          {/* Projects View */}
          {activeNav === 'projects' && (
            <div className="tf-placeholder-view">
              <div className="tf-view-header">
                <h2>Active Projects</h2>
                <p>Track progress across high-impact product workstreams.</p>
              </div>
              <div className="tf-projects-grid">
                {[
                  { name: 'Web App', count: 4, progress: 75, color: '#b94b39' },
                  { name: 'Backend', count: 3, progress: 90, color: '#1e6b47' },
                  { name: 'Cloud', count: 2, progress: 60, color: '#d97706' },
                  { name: 'Mobile App', count: 2, progress: 45, color: '#6366f1' },
                  { name: 'Documentation', count: 2, progress: 85, color: '#0ea5e9' }
                ].map((proj, i) => (
                  <div key={i} className="tf-project-card">
                    <div className="tf-proj-top">
                      <h4>{proj.name}</h4>
                      <span>{proj.count} tasks</span>
                    </div>
                    <div className="tf-proj-bar-bg">
                      <div className="tf-proj-bar-fill" style={{ width: `${proj.progress}%`, background: proj.color }}></div>
                    </div>
                    <span className="tf-proj-percent">{proj.progress}% Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar View (Role-based: Employee only sees own tasks; Manager & TL see all tasks) */}
          {activeNav === 'calendar' && (
            <CalendarView
              role={currentRole}
              user={user}
              tasks={tasks}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {/* Employee Progress View */}
          {activeNav === 'my-progress' && (
            <div className="tf-placeholder-view">
              <div className="tf-view-header">
                <h2>My Progress & Growth</h2>
                <p>Personal analytics and sprint velocity metrics.</p>
              </div>
              <div className="tf-progress-cards">
                <div className="tf-stat-card tf-stat-green">
                  <div className="tf-stat-data">
                    <span className="tf-stat-value">86%</span>
                    <span className="tf-stat-label">Sprint Velocity</span>
                  </div>
                </div>
                <div className="tf-stat-card tf-stat-amber">
                  <div className="tf-stat-data">
                    <span className="tf-stat-value">3.2 Days</span>
                    <span className="tf-stat-label">Avg Completion Time</span>
                  </div>
                </div>
                <div className="tf-stat-card tf-stat-blue">
                  <div className="tf-stat-data">
                    <span className="tf-stat-value">100%</span>
                    <span className="tf-stat-label">On-time Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile / Settings View */}
          {(activeNav === 'profile' || activeNav === 'settings') && (
            <div className="tf-placeholder-view">
              <div className="tf-view-header">
                <h2>{activeNav === 'settings' ? 'Workspace Settings' : 'User Profile'}</h2>
                <p>Personal information, cloud environment, and real-time synchronization settings.</p>
              </div>
              <div className="tf-profile-card">
                <div className="tf-profile-large-avatar">S</div>
                <div className="tf-profile-fields">
                  <div className="tf-field-item">
                    <label>Full Name</label>
                    <p>Sabarinathan V</p>
                  </div>
                  <div className="tf-field-item">
                    <label>Role</label>
                    <p>{currentRole === 'manager' ? 'Engineering Manager' : 'Senior Cloud Engineer'}</p>
                  </div>
                  <div className="tf-field-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="tf-field-item">
                    <label>Real-Time Sync Status</label>
                    <p className="tf-status-active">
                      ● {wsStatus === 'connected' ? 'WebSocket Live Stream Connected' : 'Reconnecting...'}
                    </p>
                  </div>
                  <div className="tf-field-item">
                    <label>Cloud Storage Session</label>
                    <p className="tf-status-active">● Active AWS DynamoDB & S3 Engine</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports View */}
          {activeNav === 'reports' && (
            <div className="tf-placeholder-view">
              <div className="tf-view-header">
                <h2>Executive Sprint Reports</h2>
                <p>Weekly velocity summaries and DynamoDB resource utilization.</p>
              </div>
              <div className="tf-reports-card">
                <p>All sprint metrics and live comments are synchronized in real-time with AWS cloud storage.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task Create / Assign Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultStatus={defaultModalStatus}
        role={currentRole}
      />

      {/* Linear & ClickUp Inspired Task Detail Drawer */}
      <TaskDetailDrawer
        task={activeDetailTask}
        isOpen={Boolean(activeDetailTask)}
        onClose={() => setActiveDetailTask(null)}
        onUpdateTask={handleUpdateTaskDirect}
        onDeleteTask={handleDeleteTask}
        onStatusChange={handleStatusChange}
        onApproveCompletion={handleApproveCompletion}
        onRejectCompletion={handleRejectCompletion}
        currentUser={user}
        role={currentRole}
      />

      {/* Toast Notifications Stack */}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
