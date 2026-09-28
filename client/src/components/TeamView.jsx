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
  Sparkles
} from 'lucide-react';
import { 
  fetchTeams, 
  createTeam, 
  updateTeam, 
  addTeamMember, 
  removeTeamMember, 
  deleteTeam 
} from '../services/api';

// Candidate employees who can be assigned to teams by the Team Leader
const AVAILABLE_CANDIDATES = [
  { name: 'Sabarinathan V', email: 'sabarinathan.emp@taskflow.cloud', role: 'Senior Cloud Engineer' },
  { name: 'Arun K', email: 'arun@taskflow.cloud', role: 'Frontend Lead' },
  { name: 'Priya S', email: 'priya@taskflow.cloud', role: 'Backend Engineer' },
  { name: 'Vignesh M', email: 'vignesh@taskflow.cloud', role: 'Cloud Architect' },
  { name: 'Nivetha R', email: 'nivetha@taskflow.cloud', role: 'QA & UX Reviewer' },
  { name: 'Karthik D', email: 'karthik@taskflow.cloud', role: 'DevOps Specialist' },
  { name: 'Ananya R', email: 'ananya@taskflow.cloud', role: 'Product Designer' },
  { name: 'Vikram S', email: 'vikram@taskflow.cloud', role: 'Security Analyst' }
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

  // TL: Add Member to Team
  const handleAddMemberSubmit = async (teamId) => {
    if (!isTL) {
      addToast('🔒 Access Restricted: Only Team Leader can add members.', 'error');
      return;
    }

    const candidateObj = AVAILABLE_CANDIDATES.find((c) => c.name === selectedCandidate);
    if (!candidateObj) return;

    try {
      const updated = await addTeamMember(teamId, {
        name: candidateObj.name,
        email: candidateObj.email,
        role: candidateObj.role
      });
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
      setAddingMemberTeamId(null);
      addToast(`Added ${candidateObj.name} to the team!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to add member', 'error');
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
            <ShieldCheck size={16} />
            <span>
              <strong>Team Leader Authority:</strong> You have exclusive access to name teams, assign members, add new teammates, or kick out members.
            </span>
          </div>
        ) : isEmployee ? (
          <div className="tf-banner-emp">
            <Lock size={16} />
            <span>
              <strong>View-Only Team Member Access:</strong> You can view your team name and fellow teammates. Team name and member roster can only be modified by the Team Leader (TL).
            </span>
          </div>
        ) : (
          <div className="tf-banner-mgr">
            <Users size={16} />
            <span>
              <strong>Management Overview:</strong> Viewing all active squads. Team creation, member recruitment, and roster edits are orchestrated exclusively by Team Leaders.
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
                  <h5>Add Member to {team.name}</h5>
                  {availableToAdd.length === 0 ? (
                    <p className="tf-text-muted">All available employees are already in this team.</p>
                  ) : (
                    <div className="tf-add-member-form">
                      <select
                        className="tf-form-select"
                        value={selectedCandidate}
                        onChange={(e) => setSelectedCandidate(e.target.value)}
                      >
                        {availableToAdd.map((cand) => (
                          <option key={cand.name} value={cand.name}>
                            {cand.name} — {cand.role}
                          </option>
                        ))}
                      </select>
                      <div className="tf-add-actions">
                        <button
                          type="button"
                          className="tf-btn-teamleader tf-btn-sm"
                          onClick={() => handleAddMemberSubmit(team.id)}
                        >
                          Confirm Add
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
                    {isTL && <span className="tf-hint">Use "Add Member" above to assign employees.</span>}
                  </div>
                ) : (
                  team.members.map((member) => {
                    const taskCount = getMemberTaskCount(member.name);
                    const isSelf = (user?.name || '').toLowerCase() === member.name.toLowerCase();

                    return (
                      <div key={member.id || member.name} className="tf-member-row">
                        <div className="tf-member-avatar-wrap">
                          <div className="tf-member-avatar">
                            {member.avatar || member.name[0]}
                          </div>
                        </div>

                        <div className="tf-member-details">
                          <div className="tf-member-name-row">
                            <span className="tf-member-name">{member.name}</span>
                            {isSelf && <span className="tf-badge-you">You</span>}
                          </div>
                          <span className="tf-member-role">{member.role}</span>
                        </div>

                        <div className="tf-member-stats">
                          <span className="tf-task-badge">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        {/* Kick Out / Remove Button (STRICTLY TL ONLY) */}
                        {isTL && (
                          <button
                            type="button"
                            className="tf-btn-kickout"
                            onClick={() => setKickoutTarget({ teamId: team.id, memberName: member.name, memberId: member.id })}
                            title={`Kick out ${member.name} from team`}
                          >
                            <UserMinus size={14} />
                            <span>Kick out</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
