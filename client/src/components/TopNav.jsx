import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Plus, 
  LogOut, 
  Radio, 
  Zap,
  Command,
  Lock,
  ShieldCheck
} from 'lucide-react';

export default function TopNav({
  role,
  user,
  searchQuery,
  onSearchChange,
  onOpenAssignModal,
  onLogout,
  wsStatus = 'connected'
}) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dateString = "Mon, 21 Sep 2026";

  return (
    <div className="tf-top-section">
      {/* Upper Top Bar */}
      <div className="tf-top-bar">
        {/* Search input */}
        <div className="tf-search-wrapper">
          <Search size={18} className="tf-search-icon" />
          <input
            type="text"
            className="tf-search-input"
            placeholder="Search tasks, descriptions, tags, assignees..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right side controls */}
        <div className="tf-top-right-group">
          {/* Real-time Connection Indicator */}
          <div 
            className={`tf-realtime-badge status-${wsStatus}`}
            title={`Real-Time WebSocket Sync: ${wsStatus === 'connected' ? 'Live Connected' : wsStatus === 'connecting' ? 'Reconnecting...' : 'Offline'}`}
          >
            <span className="tf-rt-pulse-dot"></span>
            <Zap size={13} className="tf-rt-icon" />
            <span className="tf-rt-label">
              {wsStatus === 'connected' ? 'Realtime Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          </div>

          {/* Quick Shortcut Badge - TL only */}
          {isTL && (
            <div className="tf-shortcut-pill" title="Press 'N' key anytime to assign a new task">
              <span className="tf-kbd-key">N</span>
              <span className="tf-kbd-text">Assign Task</span>
            </div>
          )}

          {/* Quick Create Task button - TL Exclusive */}
          {isTL ? (
            <button 
              type="button" 
              className="tf-quick-add-nav-btn tf-btn-teamleader"
              onClick={onOpenAssignModal}
              title="Create and Assign New Task (TL Exclusive)"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Assign Task</span>
            </button>
          ) : isManager ? (
            <div className="tf-role-restriction-pill tf-pill-manager" title="Task assignment is delegated exclusively to Team Leader (TL).">
              <Lock size={13} />
              <span>Task Assignment Delegated to TL</span>
            </div>
          ) : (
            <div className="tf-role-restriction-pill tf-pill-employee" title="Task creation restricted to Team Leader.">
              <Lock size={13} />
              <span>View Only (No Creation Access)</span>
            </div>
          )}

          {/* Notifications button */}
          <div className="tf-notif-container">
            <button 
              type="button" 
              className="tf-notif-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="View notifications"
            >
              <Bell size={20} />
              <span className="tf-notif-dot"></span>
            </button>

            {showNotifications && (
              <div className="tf-notif-dropdown">
                <div className="tf-notif-header">
                  <h4>Live Activity Alerts</h4>
                  <span className="tf-notif-count">3 new</span>
                </div>
                <div className="tf-notif-list">
                  <div className="tf-notif-item">
                    <span className="tf-notif-tag tf-tag-urgent">Live</span>
                    <div>
                      <p className="tf-notif-text">Real-time WebSocket connection established</p>
                      <span className="tf-notif-time">Just now</span>
                    </div>
                  </div>
                  <div className="tf-notif-item">
                    <span className="tf-notif-tag tf-tag-success">Task</span>
                    <div>
                      <p className="tf-notif-text">Arun K updated "Design login page"</p>
                      <span className="tf-notif-time">10 mins ago</span>
                    </div>
                  </div>
                  <div className="tf-notif-item">
                    <span className="tf-notif-tag tf-tag-warning">Sprint</span>
                    <div>
                      <p className="tf-notif-text">Sprint milestone velocity on track</p>
                      <span className="tf-notif-time">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="tf-profile-container">
            <button 
              type="button" 
              className="tf-profile-pill"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="tf-avatar-circle">
                <span>{user?.name ? user.name[0] : 'S'}</span>
              </div>
              <div className="tf-profile-info">
                <span className="tf-profile-name">{user?.name || 'Sabarinathan V'}</span>
                <span className="tf-profile-role">{isTL ? 'Team Leader (TL)' : isManager ? 'Manager' : 'Employee'}</span>
              </div>
              <ChevronDown size={16} className={`tf-chevron ${showProfileMenu ? 'tf-chevron-open' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="tf-profile-dropdown">
                <div className="tf-dropdown-header">
                  <p className="tf-dropdown-name">{user?.name || 'Sabarinathan V'}</p>
                  <p className="tf-dropdown-email">
                    {user?.email || (isTL ? 'sabarinathan.tl@taskflow.cloud' : isManager ? 'sabarinathan.mgr@taskflow.cloud' : 'sabarinathan.emp@taskflow.cloud')}
                  </p>
                </div>
                <div className="tf-dropdown-divider"></div>
                <button 
                  type="button" 
                  className="tf-dropdown-item tf-dropdown-item-danger"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Greeting and Header Bar */}
      <div className="tf-manager-header-row">
        <div className="tf-greeting-block">
          <h1 className="tf-greeting-title">Good Morning, {user?.name ? user.name.split(' ')[0] : 'Sabarinathan'}!</h1>
          <p className="tf-greeting-subtitle">
            {isTL
              ? "Assign and distribute sprint deliverables from the manager to team members."
              : isManager
              ? "Here's an overview of your team's live workstream and velocity."
              : "Here are your active deliverables and sprint tasks."}
          </p>
        </div>

        {isTL ? (
          <button 
            type="button" 
            className="tf-btn-assign tf-btn-teamleader"
            onClick={onOpenAssignModal}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Assign Task from Manager</span>
          </button>
        ) : isManager ? (
          <div className="tf-role-restriction-pill tf-pill-manager" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Lock size={15} />
            <span>Task Creation Delegated to Team Leader</span>
          </div>
        ) : (
          <div className="tf-role-restriction-pill tf-pill-employee" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Lock size={15} />
            <span>View Only (Creation Restricted)</span>
          </div>
        )}
      </div>
    </div>
  );
}
