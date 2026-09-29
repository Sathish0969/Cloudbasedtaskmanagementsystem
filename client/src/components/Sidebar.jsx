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
  LogOut,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ 
  role, 
  user,
  activeNav, 
  onSelectNav, 
  onSwitchRole,
  onLogout
}) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';

  const managerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'queries', label: 'Member Queries', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const tlNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Assign & Track', icon: CheckSquare },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'queries', label: 'Member Queries', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Sprint Reports', icon: FileText },
  ];

  const employeeNavItems = [
    { id: 'my-tasks', label: 'My Tasks', icon: Home },
    { id: 'queries', label: 'Query to TL', icon: HelpCircle },
    { id: 'team', label: 'My Team', icon: Users },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'my-progress', label: 'My Progress', icon: BarChart3 },
  ];

  const navItems = isTL ? tlNavItems : isManager ? managerNavItems : employeeNavItems;

  return (
    <aside className="tf-sidebar">
      {/* Brand Header */}
      <div className="tf-sidebar-brand">
        <div className={`tf-logo-icon ${isTL ? 'tf-indigo-bg' : isManager ? 'tf-terracotta-bg' : 'tf-green-bg'}`}>
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

      {/* Sidebar Footer */}
      <div className="tf-sidebar-footer">
        {/* User Mini Profile Card in Sidebar Footer */}
        <button
          type="button"
          className={`tf-sidebar-user-card ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectNav('profile')}
          title="View and edit your profile picture & contact details"
        >
          <div className="tf-sidebar-user-avatar">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} />
            ) : (
              <span>{user?.name ? user.name[0] : 'S'}</span>
            )}
          </div>
          <div className="tf-sidebar-user-info">
            <span className="tf-sidebar-user-name">{user?.name || 'Sabarinathan V'}</span>
            <span className="tf-sidebar-user-role">{isTL ? 'Team Leader' : isManager ? 'Manager' : 'Team Member'}</span>
          </div>
        </button>

        {/* Manager & TL have Settings button */}
        {(isManager || isTL) && (
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
          title="Log out and return to 3-option menu"
        >
          <LogOut size={19} className="tf-nav-icon" />
          <span className="tf-nav-label">Logout</span>
        </button>

        {/* Quotes */}
        {isTL ? (
          <div className="tf-sidebar-quote" style={{ borderLeft: '3px solid var(--tf-indigo)', paddingLeft: '10px' }}>
            <p className="tf-quote-text">"Authorize, delegate, and empower"</p>
          </div>
        ) : !isManager ? (
          <div className="tf-sidebar-quote">
            <p className="tf-quote-text">"Small steps lead to big results"</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
