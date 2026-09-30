import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  Plus, 
  AlertCircle,
  Briefcase,
  Mail,
  Calendar,
  Sparkles,
  Phone,
  MapPin,
  Camera,
  UserCheck,
  User,
  Info
} from 'lucide-react';
import { 
  fetchTeams, 
  createTeam, 
  updateTeam, 
  addTeamMember, 
  updateTeamMember,
  removeTeamMember, 
  deleteTeam 
} from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80'
];

// Candidate employees who can be assigned to teams by the Team Leader
const AVAILABLE_CANDIDATES = [
  { name: 'Sabarinathan V', email: 'sabarinathan.emp@taskflow.cloud', role: 'Senior Cloud Engineer' },
  { name: 'Arun K', email: 'arun@taskflow.cloud', role: 'Frontend Lead' },
  { name: 'Priya S', email: 'priya@taskflow.cloud', role: 'Backend Engineer' },
  { name: 'Vignesh M', email: 'vignesh@taskflow.cloud', role: 'Cloud Architect' },
  { name: 'Nivetha R', email: 'nivetha@taskflow.cloud', role: 'QA & UX Reviewer' },
  { name: 'Gowtham G', email: 'gowthamgopalakrishnan0207@gmail.com', role: 'Cloud & DevOps Engineer' },
  { name: 'Karthik D', email: 'karthik@taskflow.cloud', role: 'DevOps Specialist' },
  { name: 'Ananya R', email: 'ananya@taskflow.cloud', role: 'Product Designer' },
  { name: 'Deepak R', email: 'deepak.r@taskflow.cloud', role: 'Lead ML Engineer' },
  { name: 'Meera N', email: 'meera.n@taskflow.cloud', role: 'Data Platform Engineer' },
  { name: 'Rohit V', email: 'rohit.v@taskflow.cloud', role: 'MLOps Specialist' },
  { name: 'Sneha Patel', email: 'sneha.p@taskflow.cloud', role: 'Security Operations Lead' },
  { name: 'Aditya Menon', email: 'aditya.m@taskflow.cloud', role: 'Cloud SecOps Specialist' },
  { name: 'Vikram S', email: 'vikram@taskflow.cloud', role: 'Compliance Analyst' }
];

export default function TeamView({
  role = 'manager',
  user = { name: 'Sabarinathan V' },
  tasks = [],
  addToast = () => {}
}) {
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';
  const isManager = role === 'manager';

  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // TL Team Creation State
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // TL Team Name Editing State
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  // TL Member Adding State
  const [addingMemberTeamId, setAddingMemberTeamId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(AVAILABLE_CANDIDATES[0].name);
  const [memberAddMode, setMemberAddMode] = useState('directory'); // 'directory' | 'custom'
  const [customMemberName, setCustomMemberName] = useState('');
  const [customMemberEmail, setCustomMemberEmail] = useState('');
  const [customMemberRole, setCustomMemberRole] = useState('Software Engineer');
  const [customMemberPhone, setCustomMemberPhone] = useState('');
  const [customMemberDept, setCustomMemberDept] = useState('');
  const [customMemberLocation, setCustomMemberLocation] = useState('');
  const [customMemberPicture, setCustomMemberPicture] = useState('');
  const [customMemberBio, setCustomMemberBio] = useState('');

  // Member Profile & Contact Details Edit State
  const [editingMember, setEditingMember] = useState(null); // { id, name, email, role, avatar, picture, phone, department, location, bio, teamId }
  const [savingMemberProfile, setSavingMemberProfile] = useState(false);

  // TL Kickout / Delete Confirmation
  const [kickoutTarget, setKickoutTarget] = useState(null); // { teamId, memberName, memberId }
  const [teamToDelete, setTeamToDelete] = useState(null);

  // Load Teams from API
  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeams();
      if (Array.isArray(data) && data.length > 0) {
        setTeams(data);
      } else {
        // Fallback default teams
        setTeams([
          {
            id: 'team-01',
            name: 'Cloud & Core Infrastructure Squad',
            description: 'Responsible for core cloud backend microservices, database optimizations, and system reliability.',
            teamLeader: 'Sabarinathan V',
            teamLeaderEmail: 'sabarinathan.tl@taskflow.cloud',
            members: [
              { id: 'mem-101', name: 'Sabarinathan V', email: 'sabarinathan.emp@taskflow.cloud', role: 'Senior Cloud Engineer', avatar: 'S', status: 'active', joinedAt: '2026-09-18' },
              { id: 'mem-102', name: 'Arun K', email: 'arun@taskflow.cloud', role: 'Frontend Lead', avatar: 'A', status: 'active', joinedAt: '2026-09-18' },
              { id: 'mem-103', name: 'Priya S', email: 'priya@taskflow.cloud', role: 'Backend Engineer', avatar: 'P', status: 'active', joinedAt: '2026-09-19' },
              { id: 'mem-104', name: 'Vignesh M', email: 'vignesh@taskflow.cloud', role: 'Cloud Architect', avatar: 'V', status: 'active', joinedAt: '2026-09-20' }
            ]
          },
          {
            id: 'team-02',
            name: 'UX & Quality Engineering',
            description: 'Ensures design token consistency, automated cross-browser testing, and high accessibility standards.',
            teamLeader: 'Sabarinathan V',
            teamLeaderEmail: 'sabarinathan.tl@taskflow.cloud',
            members: [
              { id: 'mem-105', name: 'Nivetha R', email: 'nivetha@taskflow.cloud', role: 'QA & UX Reviewer', avatar: 'N', status: 'active', joinedAt: '2026-09-19' },
              { id: 'mem-106', name: 'Karthik D', email: 'karthik@taskflow.cloud', role: 'DevOps Specialist', avatar: 'K', status: 'active', joinedAt: '2026-09-20' },
              { id: 'mem-107', name: 'Ananya R', email: 'ananya@taskflow.cloud', role: 'Product Designer', avatar: 'A', status: 'active', joinedAt: '2026-09-21' }
            ]
          }
        ]);
      }
    } catch {
      // Use fallback defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Compute active task count per member
  const getMemberTaskCount = (memberName) => {
    if (!memberName || !tasks) return 0;
    const nameLower = memberName.toLowerCase().trim();
    return tasks.filter((t) => (t.assignedTo || '').toLowerCase().trim() === nameLower).length;
  };

  // TL: Create New Team
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!isTL) {
      addToast('🔒 Access Restricted: Only Team Leader can create teams.', 'error');
      return;
    }
    if (!newTeamName.trim()) {
      addToast('Please enter a team name.', 'error');
      return;
    }

    try {
      const created = await createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || 'Collaborative sprint execution squad.',
        teamLeader: user?.name || 'Sabarinathan V',
        teamLeaderEmail: user?.email || 'sabarinathan.tl@taskflow.cloud',
        members: []
      });
      setTeams((prev) => [...prev, created]);
      setIsCreatingTeam(false);
      setNewTeamName('');
      setNewTeamDesc('');
      addToast(`Team "${created.name}" created successfully!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to create team', 'error');
    }
  };

  // TL: Start Editing Team Name
  const handleStartEditName = (team) => {
    if (!isTL) {
      addToast('🔒 Access Restricted: Only Team Leader can edit the team name.', 'error');
      return;
    }
    setEditingTeamId(team.id);
    setEditNameValue(team.name);
  };

  // TL: Save Edited Team Name
  const handleSaveEditName = async (teamId) => {
    if (!isTL) return;
    if (!editNameValue.trim()) {
      addToast('Team name cannot be empty.', 'error');
      return;
    }

    try {
      const updated = await updateTeam(teamId, { name: editNameValue.trim() });
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name: updated.name } : t)));
      setEditingTeamId(null);
      addToast(`Team name updated to "${updated.name}"!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update team name', 'error');
    }
  };

  // TL: Add Member to Team (Support both custom email & directory)
  const handleAddMemberSubmit = async (teamId) => {
    if (!isTL) {
      addToast('🔒 Access Restricted: Only Team Leader can add members.', 'error');
      return;
    }

    let memberPayload = null;
    if (memberAddMode === 'custom') {
      if (!customMemberName.trim()) {
        addToast('Please enter the employee full name.', 'error');
        return;
      }
      if (!customMemberEmail.trim() || !customMemberEmail.includes('@')) {
        addToast('Please enter a valid employee email ID.', 'error');
        return;
      }
      memberPayload = {
        name: customMemberName.trim(),
        email: customMemberEmail.trim().toLowerCase(),
        role: customMemberRole.trim() || 'Software Engineer',
        phone: customMemberPhone.trim() || null,
        department: customMemberDept.trim() || null,
        location: customMemberLocation.trim() || null,
        picture: customMemberPicture.trim() || null,
        bio: customMemberBio.trim() || null
      };
    } else {
      const candidateObj = AVAILABLE_CANDIDATES.find((c) => c.name === selectedCandidate);
      if (!candidateObj) return;
      memberPayload = {
        name: candidateObj.name,
        email: candidateObj.email,
        role: candidateObj.role
      };
    }

    try {
      const updated = await addTeamMember(teamId, memberPayload);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
      setAddingMemberTeamId(null);
      setCustomMemberName('');
      setCustomMemberEmail('');
      setCustomMemberRole('Software Engineer');
      setCustomMemberPhone('');
      setCustomMemberDept('');
      setCustomMemberLocation('');
      setCustomMemberPicture('');
      setCustomMemberBio('');
      addToast(`Added ${memberPayload.name} (${memberPayload.email}) to squad! Login authorized.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to add member', 'error');
    }
  };

  // Save Member Profile (Picture & Contact Details)
  const handleSaveMemberProfile = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMemberProfile(true);
    try {
      const updates = {
        name: editingMember.name,
        email: editingMember.email,
        role: editingMember.role,
        picture: editingMember.picture || null,
        phone: editingMember.phone || null,
        department: editingMember.department || null,
        location: editingMember.location || null,
        bio: editingMember.bio || null,
        avatar: editingMember.avatar || (editingMember.name ? editingMember.name[0].toUpperCase() : 'U')
      };

      const updatedTeam = await updateTeamMember(editingMember.teamId, editingMember.id || editingMember.name, updates);
      setTeams((prev) => prev.map((t) => (t.id === editingMember.teamId ? updatedTeam : t)));
      addToast(`Updated profile & contact details for ${editingMember.name}!`, 'success');
      setEditingMember(null);
    } catch (err) {
      addToast(err.message || 'Failed to update member profile', 'error');
    } finally {
      setSavingMemberProfile(false);
    }
  };

  // TL: Kick Out / Remove Member from Team
  const handleConfirmKickout = async () => {
    if (!isTL || !kickoutTarget) return;
    const { teamId, memberName, memberId } = kickoutTarget;

    try {
      const updated = await removeTeamMember(teamId, memberId || memberName);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
      setKickoutTarget(null);
      addToast(`Kicked out ${memberName} from team.`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to remove member', 'error');
    }
  };

  // TL: Delete Team
  const handleConfirmDeleteTeam = async () => {
    if (!isTL || !teamToDelete) return;

    try {
      await deleteTeam(teamToDelete.id);
      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
      addToast(`Team "${teamToDelete.name}" deleted.`, 'info');
      setTeamToDelete(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete team', 'error');
    }
  };

  return (
    <div className="tf-teams-container">
      {/* View Header */}
      <div className="tf-teams-header">
        <div>
          <div className="tf-teams-title-wrap">
            <Users size={24} className={isTL ? 'tf-text-indigo' : isManager ? 'tf-text-terracotta' : 'tf-text-green'} />
            <h2>Teams & Squads</h2>
          </div>
          <p className="tf-teams-subtitle">
            {isTL
              ? 'Orchestrate team squads, choose team names, add new members, or manage rosters.'
              : isEmployee
              ? 'View your team squad, team name, and fellow teammates.'
              : 'Enterprise squad distribution and sprint resource allocations.'}
          </p>
        </div>

        {/* TL-Only Action: Create New Team */}
        {isTL && (
          <button 
            type="button" 
            className="tf-btn-teamleader tf-btn-create-team"
            onClick={() => setIsCreatingTeam(true)}
          >
            <Plus size={16} />
            <span>Create New Team</span>
          </button>
        )}
      </div>

      {/* Role Authority Banner */}
      <div className="tf-team-role-banner">
        {isTL ? (
          <div className="tf-banner-tl">
            <ShieldCheck size={18} />
            <span>
              <strong>Team Leader Authentication & Squad Authority:</strong> You store team member employee email IDs below. Only employees registered in your squads are authorized to log in and check sprint tasks.
            </span>
          </div>
        ) : isEmployee ? (
          <div className="tf-banner-emp">
            <ShieldCheck size={18} />
            <span>
              <strong>Verified Team Member Access:</strong> You are logged in with your employee email authorized by the Team Leader. You can view your squad and check deliverables.
            </span>
          </div>
        ) : (
          <div className="tf-banner-mgr">
            <Users size={18} />
            <span>
              <strong>Management Overview:</strong> Viewing all active squads. Team rosters and employee login authorizations are managed exclusively by Team Leaders.
            </span>
          </div>
        )}
      </div>

      {/* TL Modal / Inline: Create Team Form */}
      {isCreatingTeam && isTL && (
        <div className="tf-team-create-card">
          <div className="tf-card-top-header">
            <div className="tf-badge-create-lead">
              <Sparkles size={14} /> Team Leader Creation
            </div>
            <button 
              type="button" 
              className="tf-btn-close-sm"
              onClick={() => setIsCreatingTeam(false)}
            >
              <X size={16} />
            </button>
          </div>
          <h3>Create a New Team</h3>
          <p className="tf-create-desc">Define a team name and purpose. You can assign members once created.</p>

          <form onSubmit={handleCreateTeamSubmit} className="tf-team-form">
            <div className="tf-form-group">
              <label htmlFor="new-team-name" className="tf-label">Team Name *</label>
              <input
                id="new-team-name"
                type="text"
                className="tf-input"
                placeholder="e.g., Core Backend & Cloud Squad"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="tf-form-group">
              <label htmlFor="new-team-desc" className="tf-label">Team Description / Mission</label>
              <textarea
                id="new-team-desc"
                className="tf-textarea"
                rows={2}
                placeholder="Describe this team's workstream focus..."
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
              />
            </div>

            <div className="tf-form-actions-row">
              <button type="submit" className="tf-btn-teamleader">
                Create Team
              </button>
              <button 
                type="button" 
                className="tf-btn-cancel"
                onClick={() => setIsCreatingTeam(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Dialog: Kick Out Member */}
      {kickoutTarget && isTL && (
        <div className="tf-modal-backdrop" onClick={() => setKickoutTarget(null)}>
          <div className="tf-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="tf-dialog-icon tf-dialog-warn">
              <AlertCircle size={24} />
            </div>
            <h3>Kick Out Member?</h3>
            <p>
              Are you sure you want to remove <strong>{kickoutTarget.memberName}</strong> from this team?
            </p>
            <div className="tf-dialog-actions">
              <button 
                type="button" 
                className="tf-btn-danger-confirm" 
                onClick={handleConfirmKickout}
              >
                Yes, Kick Out
              </button>
              <button 
                type="button" 
                className="tf-btn-cancel" 
                onClick={() => setKickoutTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Team */}
      {teamToDelete && isTL && (
        <div className="tf-modal-backdrop" onClick={() => setTeamToDelete(null)}>
          <div className="tf-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="tf-dialog-icon tf-dialog-warn">
              <Trash2 size={24} />
            </div>
            <h3>Delete Team?</h3>
            <p>
              Are you sure you want to delete the team <strong>"{teamToDelete.name}"</strong>? This will disband the team roster.
            </p>
            <div className="tf-dialog-actions">
              <button 
                type="button" 
                className="tf-btn-danger-confirm" 
                onClick={handleConfirmDeleteTeam}
              >
                Yes, Delete Team
              </button>
              <button 
                type="button" 
                className="tf-btn-cancel" 
                onClick={() => setTeamToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams List */}
      <div className="tf-teams-grid">
        {teams.map((team) => {
          const isUserInTeam = team.members?.some(
            (m) => m.name.toLowerCase() === (user?.name || '').toLowerCase()
          );
          const isEditingThisTeam = editingTeamId === team.id;
          const isAddingToThisTeam = addingMemberTeamId === team.id;

          // Available candidates not yet in this team
          const existingNames = new Set((team.members || []).map((m) => m.name.toLowerCase()));
          const availableToAdd = AVAILABLE_CANDIDATES.filter((c) => !existingNames.has(c.name.toLowerCase()));

          return (
            <div 
              key={team.id} 
              className={`tf-team-squad-card ${isUserInTeam ? 'tf-team-user-active' : ''}`}
            >
              {/* Squad Header */}
              <div className="tf-squad-header">
                <div className="tf-squad-title-area">
                  {/* Team Name: Editable for TL, strictly static for employees */}
                  {isEditingThisTeam && isTL ? (
                    <div className="tf-inline-edit-name">
                      <input
                        type="text"
                        className="tf-input-inline"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className="tf-btn-icon-save"
                        onClick={() => handleSaveEditName(team.id)}
                        title="Save Team Name"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="tf-btn-icon-cancel"
                        onClick={() => setEditingTeamId(null)}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="tf-team-name-row">
                      <h3 className="tf-squad-name">{team.name}</h3>
                      
                      {/* TL Edit Team Name Button (ONLY TL CAN EDIT) */}
                      {isTL && (
                        <button
                          type="button"
                          className="tf-btn-action-icon"
                          onClick={() => handleStartEditName(team)}
                          title="Edit Team Name"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {team.description && (
                    <p className="tf-squad-desc">{team.description}</p>
                  )}

                  <div className="tf-squad-meta-row">
                    <span className="tf-meta-pill tf-lead-pill">
                      👑 Leader: {team.teamLeader || 'Sabarinathan V'}
                    </span>
                    <span className="tf-meta-pill">
                      👥 {team.members?.length || 0} Members
                    </span>
                    {isEmployee && isUserInTeam && (
                      <span className="tf-meta-pill tf-your-team-pill">
                        ⭐ Your Team
                      </span>
                    )}
                  </div>
                </div>

                {/* TL Delete Team Button */}
                {isTL && (
                  <button
                    type="button"
                    className="tf-btn-action-danger"
                    onClick={() => setTeamToDelete(team)}
                    title="Disband / Delete Team"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Members Section Header */}
              <div className="tf-members-header-row">
                <h4>Team Members ({team.members?.length || 0})</h4>
                
                {/* TL-Only: Add Member Button */}
                {isTL && !isAddingToThisTeam && (
                  <button
                    type="button"
                    className="tf-btn-sm-add"
                    onClick={() => {
                      setAddingMemberTeamId(team.id);
                      if (availableToAdd.length > 0) {
                        setSelectedCandidate(availableToAdd[0].name);
                      }
                    }}
                  >
                    <UserPlus size={14} />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* TL-Only: Inline Add Member Form */}
              {isAddingToThisTeam && isTL && (
                <div className="tf-inline-add-member-card">
                  <div className="tf-inline-add-header">
                    <h5>Add Team Member to {team.name}</h5>
                    <div className="tf-member-mode-toggle">
                      <button
                        type="button"
                        className={`tf-mode-toggle-btn ${memberAddMode === 'directory' ? 'tf-mode-toggle-active' : ''}`}
                        onClick={() => setMemberAddMode('directory')}
                      >
                        Directory Candidates
                      </button>
                      <button
                        type="button"
                        className={`tf-mode-toggle-btn ${memberAddMode === 'custom' ? 'tf-mode-toggle-active' : ''}`}
                        onClick={() => setMemberAddMode('custom')}
                      >
                        + Custom Employee Email
                      </button>
                    </div>
                  </div>

                  {memberAddMode === 'directory' ? (
                    availableToAdd.length === 0 ? (
                      <p className="tf-text-muted">All available directory employees are already in this team. Use "Custom Employee Email" to add a new employee.</p>
                    ) : (
                      <div className="tf-add-member-form">
                        <div className="tf-field-group">
                          <label className="tf-label">Select Employee Candidate</label>
                          <select
                            className="tf-form-select"
                            value={selectedCandidate}
                            onChange={(e) => setSelectedCandidate(e.target.value)}
                          >
                            {availableToAdd.map((cand) => (
                              <option key={cand.name} value={cand.name}>
                                {cand.name} ({cand.email}) — {cand.role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="tf-add-actions">
                          <button
                            type="button"
                            className="tf-btn-teamleader tf-btn-sm"
                            onClick={() => handleAddMemberSubmit(team.id)}
                          >
                            Authorize & Add to Squad
                          </button>
                          <button
                            type="button"
                            className="tf-btn-cancel tf-btn-sm"
                            onClick={() => setAddingMemberTeamId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Custom Employee Email Form */
                    <div className="tf-custom-member-form">
                      <div className="tf-form-row-2col">
                        <div className="tf-field-group">
                          <label className="tf-label">Employee Full Name *</label>
                          <input
                            type="text"
                            className="tf-input"
                            placeholder="e.g., Rajesh Kumar"
                            value={customMemberName}
                            onChange={(e) => setCustomMemberName(e.target.value)}
                          />
                        </div>
                        <div className="tf-field-group">
                          <label className="tf-label">Employee Email ID (For Login) *</label>
                          <input
                            type="email"
                            className="tf-input"
                            placeholder="e.g., rajesh.k@taskflow.cloud"
                            value={customMemberEmail}
                            onChange={(e) => setCustomMemberEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="tf-field-group">
                        <label className="tf-label">Designation / Role</label>
                        <input
                          type="text"
                          className="tf-input"
                          placeholder="e.g., Full Stack Engineer"
                          value={customMemberRole}
                          onChange={(e) => setCustomMemberRole(e.target.value)}
                        />
                      </div>
                      
                      {/* Optional Contact Details & Picture on Member Creation */}
                      <div className="tf-form-row-2col">
                        <div className="tf-field-group">
                          <label className="tf-label">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            className="tf-input"
                            placeholder="+1 (555) 019-2834"
                            value={customMemberPhone}
                            onChange={(e) => setCustomMemberPhone(e.target.value)}
                          />
                        </div>
                        <div className="tf-field-group">
                          <label className="tf-label">Department (Optional)</label>
                          <input
                            type="text"
                            className="tf-input"
                            placeholder="e.g., Core Platform"
                            value={customMemberDept}
                            onChange={(e) => setCustomMemberDept(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="tf-field-group">
                        <label className="tf-label">Profile Picture URL (Optional)</label>
                        <input
                          type="url"
                          className="tf-input"
                          placeholder="https://example.com/avatar.jpg"
                          value={customMemberPicture}
                          onChange={(e) => setCustomMemberPicture(e.target.value)}
                        />
                      </div>
                      <p className="tf-hint-auth">
                        🛡️ Storing this email ID will immediately authorize the employee to log in and check sprint tasks.
                      </p>
                      <div className="tf-add-actions">
                        <button
                          type="button"
                          className="tf-btn-teamleader tf-btn-sm"
                          onClick={() => handleAddMemberSubmit(team.id)}
                        >
                          Save & Grant Login Access
                        </button>
                        <button
                          type="button"
                          className="tf-btn-cancel tf-btn-sm"
                          onClick={() => setAddingMemberTeamId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Members Roster List */}
              <div className="tf-members-roster">
                {(!team.members || team.members.length === 0) ? (
                  <div className="tf-empty-roster">
                    <p>No members in this team yet.</p>
                    {isTL && <span className="tf-hint">Use "Add Member" above to store employee email IDs.</span>}
                  </div>
                ) : (
                  team.members.map((member) => {
                    const taskCount = getMemberTaskCount(member.name);
                    const isSelf = (user?.name || '').toLowerCase() === member.name.toLowerCase();

                    return (
                      <div key={member.id || member.name} className="tf-member-row">
                        <div className="tf-member-avatar-wrap">
                          <div className="tf-member-avatar">
                            {member.picture ? (
                              <img 
                                src={member.picture} 
                                alt={member.name} 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span>{member.avatar || member.name[0]}</span>
                            )}
                          </div>
                        </div>

                        <div className="tf-member-details">
                          <div className="tf-member-name-row">
                            <span className="tf-member-name">{member.name}</span>
                            {isSelf && <span className="tf-badge-you">You</span>}
                            <span className="tf-auth-login-badge" title="Employee email authorized for task login">
                              <ShieldCheck size={11} />
                              <span>Login Authorized</span>
                            </span>
                          </div>
                          <div className="tf-member-meta-row">
                            <span className="tf-member-role">{member.role}</span>
                            {member.email && (
                              <span className="tf-member-email">
                                <Mail size={12} />
                                {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="tf-member-email" title="Phone">
                                <Phone size={12} />
                                {member.phone}
                              </span>
                            )}
                            {member.department && (
                              <span className="tf-member-email" title="Department">
                                <Briefcase size={12} />
                                {member.department}
                              </span>
                            )}
                            {member.location && (
                              <span className="tf-member-email" title="Office Location">
                                <MapPin size={12} />
                                {member.location}
                              </span>
                            )}
                          </div>
                          {member.bio && (
                            <p className="tf-member-bio-text" style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                              "{member.bio}"
                            </p>
                          )}
                        </div>

                        <div className="tf-member-stats">
                          <span className="tf-task-badge">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        {/* Member Action Controls */}
                        <div className="tf-member-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="tf-btn-action-icon"
                            onClick={() => setEditingMember({ ...member, teamId: team.id })}
                            title={`Edit ${member.name}'s profile picture and contact details`}
                          >
                            <Edit3 size={14} />
                            <span style={{ fontSize: '0.78rem', marginLeft: '4px' }}>Edit</span>
                          </button>

                          {/* Kick Out / Remove Button (STRICTLY TL ONLY) */}
                          {isTL && (
                            <button
                              type="button"
                              className="tf-btn-kickout"
                              onClick={() => setKickoutTarget({ teamId: team.id, memberName: member.name, memberId: member.id })}
                              title={`Remove ${member.name} from squad & revoke login access`}
                            >
                              <UserMinus size={14} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Member Profile & Contact Details */}
      {editingMember && (
        <div className="tf-modal-backdrop" onClick={() => setEditingMember(null)}>
          <div className="tf-modal-card tf-profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div>
                <h3>Edit Member Profile & Contact Details</h3>
                <p>Update picture and contact information for <strong>{editingMember.name}</strong></p>
              </div>
              <button 
                type="button" 
                className="tf-modal-close-btn"
                onClick={() => setEditingMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMemberProfile} className="tf-profile-form">
              {/* Picture Preview and Selection */}
              <div className="tf-profile-pic-section">
                <div className="tf-profile-pic-preview-wrap">
                  {editingMember.picture ? (
                    <img src={editingMember.picture} alt="Preview" className="tf-profile-pic-preview" />
                  ) : (
                    <div className="tf-profile-pic-placeholder">
                      {editingMember.name ? editingMember.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <label className="tf-upload-btn-overlay" title="Upload new photo">
                    <Camera size={16} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            addToast('Profile picture must be under 2MB', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setEditingMember(prev => ({ ...prev, picture: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
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
                    value={editingMember.picture || ''}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, picture: e.target.value }))}
                  />

                  <div className="tf-preset-avatars-row">
                    <span className="tf-presets-label">Preset avatars:</span>
                    <div className="tf-preset-list">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`tf-preset-btn ${editingMember.picture === url ? 'selected' : ''}`}
                          onClick={() => setEditingMember(prev => ({ ...prev, picture: url }))}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tf-form-divider"></div>

              {/* Name & Role Row */}
              <div className="tf-form-row-2col">
                <div className="tf-form-group">
                  <label className="tf-label">Full Name *</label>
                  <input
                    type="text"
                    className="tf-form-input"
                    value={editingMember.name || ''}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">Designation / Role</label>
                  <input
                    type="text"
                    className="tf-form-input"
                    value={editingMember.role || ''}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
              </div>

              {/* Phone & Department */}
              <div className="tf-form-row-2col">
                <div className="tf-form-group">
                  <label className="tf-label">
                    <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    className="tf-form-input"
                    placeholder="+1 (555) 019-2834"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">
                    <Briefcase size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Department / Squad Focus
                  </label>
                  <input
                    type="text"
                    className="tf-form-input"
                    placeholder="e.g. Cloud & Core Infrastructure"
                    value={editingMember.department || ''}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="tf-form-group">
                <label className="tf-label">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Work Location
                </label>
                <input
                  type="text"
                  className="tf-form-input"
                  placeholder="e.g. San Francisco, CA / Hybrid Remote"
                  value={editingMember.location || ''}
                  onChange={(e) => setEditingMember(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Bio */}
              <div className="tf-form-group">
                <label className="tf-label">Bio / Profile Summary</label>
                <textarea
                  rows={3}
                  className="tf-form-textarea"
                  placeholder="Short bio or technical focus..."
                  value={editingMember.bio || ''}
                  onChange={(e) => setEditingMember(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div className="tf-modal-footer">
                <button
                  type="button"
                  className="tf-btn-secondary"
                  onClick={() => setEditingMember(null)}
                  disabled={savingMemberProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tf-btn-primary"
                  disabled={savingMemberProfile}
                >
                  <Check size={16} />
                  <span>{savingMemberProfile ? 'Saving...' : 'Save Member Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
