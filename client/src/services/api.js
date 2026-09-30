const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

function getAuthHeaders() {
  const role = localStorage.getItem('tf_role') || 'manager';
  const headers = { 'X-User-Role': role };
  try {
    const user = JSON.parse(localStorage.getItem('tf_user') || '{}');
    if (user.name) headers['X-User-Name'] = user.name;
    if (user.email) headers['X-User-Email'] = user.email;
  } catch {}
  return headers;
}

export async function fetchTasks({ status, priority, search, assignedTo } = {}) {
  const authHeaders = getAuthHeaders();
  const currentRole = authHeaders['X-User-Role'];
  const userName = authHeaders['X-User-Name'];

  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (priority && priority !== 'all') params.append('priority', priority);
  if (search && search.trim()) params.append('search', search.trim());
  if (assignedTo && assignedTo.trim()) {
    params.append('assignedTo', assignedTo.trim());
  } else if (currentRole === 'employee' && userName) {
    params.append('assignedTo', userName);
  }

  const url = `${API_BASE}/tasks${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: authHeaders
  });
  if (!res.ok) throw new Error(`Failed to load tasks: ${res.statusText}`);
  return res.json();
}

export async function fetchTaskStats() {
  const res = await fetch(`${API_BASE}/tasks/stats`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load stats: ${res.statusText}`);
  return res.json();
}

export async function fetchTaskById(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load task ${id}: ${res.statusText}`);
  return res.json();
}

export async function createTask(taskData, role) {
  const currentRole = role || localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Role': currentRole
    },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create task');
  }
  return res.json();
}

export async function updateTask(id, taskData) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update task');
  }
  return res.json();
}

export async function updateTaskStatus(id, status, user = 'User', notes = null) {
  const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ status, user, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update status');
  }
  return res.json();
}

export async function requestTaskCompletion(id, user = 'Employee', notes = '') {
  const res = await fetch(`${API_BASE}/tasks/${id}/request-completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ status: 'in-review', user, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to request completion');
  }
  return res.json();
}

export async function approveTaskCompletion(id, userName = 'Team Leader') {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/tasks/${id}/approve-completion?user_name=${encodeURIComponent(userName)}`, {
    method: 'POST',
    headers: {
      'X-User-Role': currentRole,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to approve completion');
  }
  return res.json();
}

export async function rejectTaskCompletion(id, userName = 'Team Leader') {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/tasks/${id}/reject-completion?user_name=${encodeURIComponent(userName)}`, {
    method: 'POST',
    headers: {
      'X-User-Role': currentRole,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reject completion');
  }
  return res.json();
}

export async function deleteTask(id) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': currentRole,
    },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to delete task: ${res.statusText}`);
  }
  return true;
}

export async function uploadAttachment(file) {
  // 1. Request presigned upload metadata
  const presignRes = await fetch(`${API_BASE}/attachments/presign-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  });

  if (!presignRes.ok) {
    throw new Error(`Attachment signing failed: ${presignRes.statusText}`);
  }

  const { mode, uploadUrl, fileUrl, filename } = await presignRes.json();

  // 2. Perform actual file upload
  if (mode === 's3') {
    const s3Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!s3Res.ok) {
      throw new Error(`Direct S3 upload failed: ${s3Res.statusText}`);
    }
  } else {
    // Local fallback
    const formData = new FormData();
    formData.append('file', file);
    const localRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
    });
    if (!localRes.ok) {
      throw new Error(`Local file upload failed: ${localRes.statusText}`);
    }
  }

  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    filename,
    fileUrl,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function addComment(taskId, { author, text }) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ author, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to post comment');
  }
  return res.json();
}

// ==========================================
// Teams API (Role-Based Team Orchestration)
// ==========================================

export async function fetchTeams() {
  const res = await fetch(`${API_BASE}/teams`);
  if (!res.ok) {
    throw new Error(`Failed to fetch teams: ${res.statusText}`);
  }
  return res.json();
}

export async function createTeam(teamData) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
    },
    body: JSON.stringify(teamData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create team');
  }
  return res.json();
}

export async function updateTeam(teamId, updates) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update team');
  }
  return res.json();
}

export async function addTeamMember(teamId, memberData) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams/${teamId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
    },
    body: JSON.stringify(memberData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to add team member');
  }
  return res.json();
}

export async function updateTeamMember(teamId, memberIdOrName, memberData) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams/${teamId}/members/${encodeURIComponent(memberIdOrName)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
    },
    body: JSON.stringify(memberData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update member profile');
  }
  return res.json();
}

export async function updateUserProfile(profileData) {
  const res = await fetch(`${API_BASE}/teams/profile/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update user profile');
  }
  return res.json();
}

export async function removeTeamMember(teamId, memberIdOrName) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams/${teamId}/members/${encodeURIComponent(memberIdOrName)}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': currentRole,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to remove team member');
  }
  return res.json();
}

export async function deleteTeam(teamId) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': currentRole,
    },
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete team');
  }
  return true;
}

export async function fetchAuthorizedMembers() {
  const res = await fetch(`${API_BASE}/teams/members/authorized`);
  if (!res.ok) {
    throw new Error(`Failed to fetch authorized members: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyTeamMemberEmail(email) {
  const res = await fetch(`${API_BASE}/teams/verify-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: (email || '').trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Member verification check failed');
  }
  return res.json();
}

// ==========================================
// Queries API (Team Member to Team Leader)
// ==========================================

export async function fetchQueries({ senderEmail, status, category } = {}) {
  const params = new URLSearchParams();
  if (senderEmail && senderEmail.trim()) params.append('senderEmail', senderEmail.trim());
  if (status && status !== 'all') params.append('status', status);
  if (category && category !== 'all') params.append('category', category);

  const url = `${API_BASE}/queries${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load queries: ${res.statusText}`);
  return res.json();
}

export async function createQuery(queryData) {
  const currentRole = localStorage.getItem('tf_role') || 'employee';
  const res = await fetch(`${API_BASE}/queries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
      'X-User-Name': queryData.senderName || 'Team Member'
    },
    body: JSON.stringify(queryData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit query');
  }
  return res.json();
}

export async function respondToQuery(queryId, { response, status = 'resolved', respondedBy = 'Team Leader' }) {
  const currentRole = localStorage.getItem('tf_role') || 'teamleader';
  const res = await fetch(`${API_BASE}/queries/${queryId}/respond`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
      'X-User-Name': respondedBy
    },
    body: JSON.stringify({ response, status, respondedBy }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit response');
  }
  return res.json();
}

export async function deleteQuery(queryId) {
  const res = await fetch(`${API_BASE}/queries/${queryId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete query');
  }
  return true;
}




