import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Users, 
  Folder, 
  Calendar, 
  FileText, 
  BarChart3, 
  User, 
  Settings, 
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  role, 
  user,
  activeNav, 
  onSelectNav, 
  onLogout
}) {
  const isManager = role === 'manager';

  const managerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const employeeNavItems = [
    { id: 'my-tasks', label: 'My Tasks', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'my-progress', label: 'My Progress', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const navItems = isManager ? managerNavItems : employeeNavItems;

  return (
    <aside className="tf-sidebar">
      {/* Brand Header */}
      <div className="tf-sidebar-brand">
        <div className="tf-logo-icon tf-terracotta-bg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span className="tf-brand-name">Task Management</span>
      </div>

      {/* Main Navigation */}
      <nav className="tf-sidebar-nav">
        <ul className="tf-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <li key={item.id} className="tf-nav-item">
                <button
                  type="button"
                  className={`tf-nav-btn ${isActive ? 'tf-nav-btn-active' : ''}`}
                  onClick={() => onSelectNav(item.id)}
                >
                  <Icon size={19} className="tf-nav-icon" />
                  <span className="tf-nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer Section */}
      <div className="tf-sidebar-footer">
        {/* Manager has Settings button */}
        {isManager && (
          <button 
            type="button" 
            className={`tf-nav-btn ${activeNav === 'settings' ? 'tf-nav-btn-active' : ''}`}
            onClick={() => onSelectNav('settings')}
          >
            <Settings size={19} className="tf-nav-icon" />
            <span className="tf-nav-label">Settings</span>
          </button>
        )}


        {/* Logout Button */}
        <button 
          type="button" 
          className="tf-nav-btn tf-logout-btn"
          onClick={onLogout}
        >
          <LogOut size={19} className="tf-nav-icon" />
          <span className="tf-nav-label">Logout</span>
        </button>

        {/* Employee Quote */}
        {!isManager && (
          <div className="tf-sidebar-quote">
            <p className="tf-quote-text">"Small steps lead to big results"</p>
          </div>
        )}
      </div>
    </aside>
  );
}
