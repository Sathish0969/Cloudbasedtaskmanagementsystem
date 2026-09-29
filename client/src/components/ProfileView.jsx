import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Camera, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Folder, 
  Calendar, 
  Zap, 
  HelpCircle,
  ExternalLink,
  Save,
  RefreshCw
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

export default function ProfileView({
  role = 'employee',
  user = {},
  tasks = [],
  onUpdateUser = () => {},
  addToast = () => {}
}) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';

  const defaultEmail = isTL 
    ? 'sabarinathan.tl@taskflow.cloud' 
    : isManager 
    ? 'sabarinathan.mgr@taskflow.cloud' 
    : 'sabarinathan.emp@taskflow.cloud';

  const [name, setName] = useState(user?.name || 'Sabarinathan V');
  const [email] = useState(user?.email || defaultEmail);
  const [picture, setPicture] = useState(user?.picture || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(
    user?.department || (isTL ? 'Cloud Architecture & Infrastructure' : isManager ? 'Engineering Management' : 'Frontend & Core Squad')
  );
  const [location, setLocation] = useState(user?.location || 'San Francisco, CA (HQ)');
  const [bio, setBio] = useState(
    user?.bio || (isTL ? 'Technical Lead driving scalable microservices, WebSocket sync, and high-availability AWS cloud infrastructure.' : isManager ? 'Engineering leadership focused on cross-functional alignment and sprint delivery velocity.' : 'Full stack cloud engineer building performant web apps and resilient cloud systems.')
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if user prop changes
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.picture) setPicture(user.picture);
      if (user.phone) setPhone(user.phone);
      if (user.department) setDepartment(user.department);
      if (user.location) setLocation(user.location);
      if (user.bio) setBio(user.bio);
    }
  }, [user]);

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Profile picture must be under 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPicture(ev.target.result);
        addToast('Photo loaded! Remember to click "Save Profile" to apply.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit profile changes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        email: email,
        name: name.trim() || 'User',
        picture: picture || null,
        phone: phone.trim() || null,
        department: department.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        avatar: name.trim() ? name.trim()[0].toUpperCase() : 'U'
      };

      const res = await updateUserProfile(payload);
      if (res && res.user) {
        onUpdateUser(res.user);
      }
      setSavedSuccess(true);
      addToast('Profile picture and contact details saved successfully!', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      addToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // User tasks metrics
  const myTasks = tasks.filter(t => 
    (t.assignee || '').toLowerCase() === (user?.name || name).toLowerCase()
  );
  const completedTasks = myTasks.filter(t => t.status === 'done' || t.status === 'completed');

  return (
    <div className="tf-profile-page-container">
      {/* Top Banner Hero */}
      <div className="tf-profile-hero">
        <div className="tf-profile-hero-bg"></div>
        <div className="tf-profile-hero-content">
          <div className="tf-profile-hero-avatar-wrap">
            {picture ? (
              <img src={picture} alt={name} className="tf-profile-hero-img" />
            ) : (
              <div className="tf-profile-hero-placeholder">
                {name ? name[0].toUpperCase() : 'U'}
              </div>
            )}
            <label className="tf-profile-hero-camera-btn" title="Upload new profile picture">
              <Camera size={18} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div className="tf-profile-hero-details">
            <div className="tf-profile-hero-name-row">
              <h2>{name}</h2>
              <span className={`tf-badge-pill ${isTL ? 'tf-badge-indigo' : isManager ? 'tf-badge-terracotta' : 'tf-badge-green'}`}>
                {isTL ? 'Team Leader (TL)' : isManager ? 'Engineering Manager' : 'Verified Team Member'}
              </span>
              <span className="tf-auth-login-badge">
                <ShieldCheck size={13} />
                <span>Login Authorized</span>
              </span>
            </div>

            <p className="tf-profile-hero-role">{department || 'Cloud & Core Infrastructure Squad'}</p>

            <div className="tf-profile-hero-meta-row">
              <span className="tf-profile-meta-item">
                <Mail size={14} /> {email}
              </span>
              {phone && (
                <span className="tf-profile-meta-item">
                  <Phone size={14} /> {phone}
                </span>
              )}
              {location && (
                <span className="tf-profile-meta-item">
                  <MapPin size={14} /> {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="tf-profile-grid">
        {/* Left Column: Edit Form */}
        <div className="tf-profile-card">
          <div className="tf-card-header-row">
            <div>
              <h3>Profile Picture & Contact Details</h3>
              <p>Add or update your avatar photo and direct communication info for team collaboration.</p>
            </div>
            {savedSuccess && (
              <span className="tf-save-pill-success">
                <Check size={14} /> Saved Live
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="tf-profile-page-form">
            {/* Picture URL & Preset Picker */}
            <div className="tf-form-group">
              <label className="tf-label">
                <Camera size={14} style={{ display: 'inline', marginRight: '5px' }} />
                Profile Picture URL / Avatar
              </label>
              <input
                type="url"
                className="tf-form-input"
                placeholder="https://images.unsplash.com/... or upload photo"
                value={picture}
                onChange={(e) => setPicture(e.target.value)}
              />
              
              {/* Preset Avatars Row */}
              <div className="tf-presets-container">
                <span className="tf-presets-title">Choose from standard professional presets:</span>
                <div className="tf-preset-list">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`tf-preset-btn ${picture === url ? 'selected' : ''}`}
                      onClick={() => setPicture(url)}
                      title={`Select Avatar ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} />
                    </button>
                  ))}
                  {picture && (
                    <button
                      type="button"
                      className="tf-preset-clear-btn"
                      onClick={() => setPicture('')}
                      title="Clear photo"
                    >
                      Clear
                    </button>
                  )}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="tf-form-group">
                <label className="tf-label">Company Email (Login ID)</label>
                <input
                  type="email"
                  className="tf-form-input"
                  value={email}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b' }}
                  title="Company email managed by Team Leader roster"
                />
              </div>
            </div>

            {/* Contact Details: Phone & Department */}
            <div className="tf-form-row-2col">
              <div className="tf-form-group">
                <label className="tf-label">
                  <Phone size={14} style={{ display: 'inline', marginRight: '5px' }} />
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  className="tf-form-input"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="tf-form-group">
                <label className="tf-label">
                  <Briefcase size={14} style={{ display: 'inline', marginRight: '5px' }} />
                  Department / Squad
                </label>
                <input
                  type="text"
                  className="tf-form-input"
                  placeholder="e.g. Cloud & Core Infrastructure"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            {/* Office Location */}
            <div className="tf-form-group">
              <label className="tf-label">
                <MapPin size={14} style={{ display: 'inline', marginRight: '5px' }} />
                Office Location / Remote Status
              </label>
              <input
                type="text"
                className="tf-form-input"
                placeholder="e.g. San Francisco, CA / Hybrid Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Bio / Summary */}
            <div className="tf-form-group">
              <label className="tf-label">Bio / Profile Summary</label>
              <textarea
                rows={4}
                className="tf-form-textarea"
                placeholder="Share your technical expertise, sprint responsibilities, or contact hours..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Submit Action */}
            <div className="tf-profile-form-actions">
              <button
                type="submit"
                className="tf-btn-primary tf-btn-save-profile"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="tf-spinning" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile & Contact Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Teammate Preview & Statistics */}
        <div className="tf-profile-side-column">
          {/* Live Preview Card */}
          <div className="tf-profile-card">
            <h3>Teammate Card Preview</h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '16px' }}>
              This is how your profile picture and contact details appear to squad mates and Team Leaders:
            </p>

            <div className="tf-preview-business-card">
              <div className="tf-biz-top">
                <div className="tf-biz-avatar-wrap">
                  {picture ? (
                    <img src={picture} alt={name} className="tf-biz-avatar-img" />
                  ) : (
                    <div className="tf-biz-avatar-placeholder">
                      {name ? name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="tf-biz-info">
                  <h4 className="tf-biz-name">{name}</h4>
                  <span className="tf-biz-role">{department}</span>
                  <span className="tf-biz-status">● Active in Sprint</span>
                </div>
              </div>

              {bio && (
                <div className="tf-biz-bio">
                  <p>"{bio}"</p>
                </div>
              )}

              <div className="tf-biz-contact-list">
                <div className="tf-biz-contact-row">
                  <Mail size={14} className="tf-text-indigo" />
                  <span>{email}</span>
                </div>
                {phone && (
                  <div className="tf-biz-contact-row">
                    <Phone size={14} className="tf-text-green" />
                    <span>{phone}</span>
                  </div>
                )}
                {location && (
                  <div className="tf-biz-contact-row">
                    <MapPin size={14} className="tf-text-terracotta" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sprint Workstream Overview Card */}
          <div className="tf-profile-card">
            <h3>Sprint Activity Summary</h3>
            <div className="tf-profile-stats-grid">
              <div className="tf-pstat-box">
                <span className="tf-pstat-num">{myTasks.length}</span>
                <span className="tf-pstat-lbl">Assigned Tasks</span>
              </div>
              <div className="tf-pstat-box tf-pstat-green">
                <span className="tf-pstat-num">{completedTasks.length}</span>
                <span className="tf-pstat-lbl">Completed</span>
              </div>
              <div className="tf-pstat-box tf-pstat-indigo">
                <span className="tf-pstat-num">
                  {myTasks.length > 0 ? `${Math.round((completedTasks.length / myTasks.length) * 100)}%` : '100%'}
                </span>
                <span className="tf-pstat-lbl">Completion Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
