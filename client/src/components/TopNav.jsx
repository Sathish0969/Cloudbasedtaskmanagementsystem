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
  ShieldCheck,
  Users,
  HelpCircle,
  MessageSquare,
  User,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { updateUserProfile } from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80'
];

export default function TopNav({
  role,
  user,
  searchQuery,
  onSearchChange,
  onOpenAssignModal,
  onOpenQueries,
  onSwitchRole,
  onLogout,
  onUpdateUser,
  addToast,
  wsStatus = 'connected'
}) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPicture, setEditPicture] = useState(user?.picture || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editDept, setEditDept] = useState(user?.department || (isTL ? 'Cloud Architecture' : isManager ? 'Engineering Management' : 'Frontend & Core Squad'));
  const [editLocation, setEditLocation] = useState(user?.location || 'San Francisco, CA (HQ)');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenProfileModal = () => {
    setEditName(user?.name || '');
    setEditPicture(user?.picture || '');
    setEditPhone(user?.phone || '');
    setEditDept(user?.department || (isTL ? 'Cloud Architecture' : isManager ? 'Engineering Management' : 'Frontend & Core Squad'));
    setEditLocation(user?.location || 'San Francisco, CA (HQ)');
    setEditBio(user?.bio || '');
    setShowProfileMenu(false);
    setIsProfileModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (addToast) addToast('Profile picture must be under 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditPicture(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        email: user?.email || (isTL ? 'sabarinathan.tl@taskflow.cloud' : isManager ? 'sabarinathan.mgr@taskflow.cloud' : 'sabarinathan.emp@taskflow.cloud'),
        name: editName.trim() || user?.name || 'User',
        picture: editPicture || null,
        phone: editPhone.trim() || null,
        department: editDept.trim() || null,
        location: editLocation.trim() || null,
        bio: editBio.trim() || null
      };

      const res = await updateUserProfile(payload);
      if (onUpdateUser && res.user) {
        onUpdateUser(res.user);
      }
      setIsProfileModalOpen(false);
      if (addToast) addToast('Profile picture and contact details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (addToast) addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

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
              title="Click to view profile & options"
            >
              <div className="tf-avatar-circle" style={{ position: 'relative', overflow: 'hidden' }}>
                <span>{user?.name ? user.name[0].toUpperCase() : 'S'}</span>
                {user?.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name || 'User'} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div className="tf-avatar-circle" style={{ width: '38px', height: '38px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <span>{user?.name ? user.name[0].toUpperCase() : 'S'}</span>
                      {user?.picture && (
                        <img 
                          src={user.picture} 
                          alt={user.name || 'User'} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="tf-dropdown-name">{user?.name || 'Sabarinathan V'}</p>
                      <p className="tf-dropdown-email">
                        {user?.email || (isTL ? 'sabarinathan.tl@taskflow.cloud' : isManager ? 'sabarinathan.mgr@taskflow.cloud' : 'sabarinathan.emp@taskflow.cloud')}
                      </p>
                    </div>
                  </div>
                  {user?.phone && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {user.phone}
                    </p>
                  )}
                  {user?.department && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={12} /> {user.department}
                    </p>
                  )}
                </div>
                <div className="tf-dropdown-divider"></div>

                <button 
                  type="button" 
                  className="tf-dropdown-item"
                  onClick={handleOpenProfileModal}
                >
                  <Edit3 size={16} />
                  <span>Edit Profile & Contact Details</span>
                </button>

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

        <div className="tf-topnav-actions">
          {isEmployee && (
            <button 
              type="button" 
              className="tf-btn-assign"
              onClick={onOpenQueries}
              style={{ background: '#4f46e5', color: '#ffffff' }}
              title="Submit a question, roadblock, or request to Team Leader Sabarinathan V"
            >
              <HelpCircle size={18} strokeWidth={2.5} />
              <span>Ask Team Leader</span>
            </button>
          )}

          {isTL && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="tf-btn-assign"
                onClick={onOpenQueries}
                style={{ background: '#f8fafc', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                title="View and respond to queries from team members"
              >
                <MessageSquare size={17} strokeWidth={2.2} />
                <span>Member Queries</span>
              </button>

              <button 
                type="button" 
                className="tf-btn-assign tf-btn-teamleader"
                onClick={onOpenAssignModal}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Assign Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="tf-modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="tf-modal-card tf-profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div>
                <h3>Edit Profile & Contact Details</h3>
                <p>Customize your profile picture, communication channels, and squad role</p>
              </div>
              <button 
                type="button" 
                className="tf-modal-close-btn"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="tf-profile-form">
              {/* Profile Picture Section */}
              <div className="tf-profile-pic-section">
                <div className="tf-profile-pic-preview-wrap">
                  {editPicture ? (
                    <img src={editPicture} alt="Preview" className="tf-profile-pic-preview" />
                  ) : (
                    <div className="tf-profile-pic-placeholder">
                      {editName ? editName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <label className="tf-upload-btn-overlay" title="Upload new photo">
                    <Camera size={16} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                <div className="tf-profile-pic-inputs">
                  <label className="tf-label">Profile Picture URL</label>
                  <input
                    type="url"
                    className="tf-form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={editPicture}
                    onChange={(e) => setEditPicture(e.target.value)}
                  />

                  <div className="tf-preset-avatars-row">
                    <span className="tf-presets-label">Or choose preset:</span>
                    <div className="tf-preset-list">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`tf-preset-btn ${editPicture === url ? 'selected' : ''}`}
                          onClick={() => setEditPicture(url)}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tf-form-divider"></div>

              {/* Name & Email Row */}
              <div className="tf-form-row-2col">
                <div className="tf-form-group">
                  <label className="tf-label">Full Name *</label>
                  <input
                    type="text"
                    className="tf-form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">Company Email</label>
                  <input
                    type="email"
                    className="tf-form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ background: '#f8fafc', color: '#64748b' }}
                    title="Managed by Team Leader squad roster"
                  />
                </div>
              </div>

              {/* Contact Details: Phone & Department */}
              <div className="tf-form-row-2col">
                <div className="tf-form-group">
                  <label className="tf-label">
                    <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Phone / Contact Number
                  </label>
                  <input
                    type="tel"
                    className="tf-form-input"
                    placeholder="+1 (555) 234-5678"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">
                    <Briefcase size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Department / Squad
                  </label>
                  <input
                    type="text"
                    className="tf-form-input"
                    placeholder="e.g. Cloud & Core Infrastructure"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                  />
                </div>
              </div>

              {/* Office Location */}
              <div className="tf-form-group">
                <label className="tf-label">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Work Location / Office
                </label>
                <input
                  type="text"
                  className="tf-form-input"
                  placeholder="e.g. San Francisco, CA / Hybrid Remote"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>

              {/* Bio / Summary */}
              <div className="tf-form-group">
                <label className="tf-label">Bio / Profile Summary</label>
                <textarea
                  rows={3}
                  className="tf-form-textarea"
                  placeholder="Tell your team about your expertise, sprint focus, or technical specialties..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <div className="tf-modal-footer">
                <button
                  type="button"
                  className="tf-btn-secondary"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tf-btn-primary"
                  disabled={savingProfile}
                >
                  <Check size={16} />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
