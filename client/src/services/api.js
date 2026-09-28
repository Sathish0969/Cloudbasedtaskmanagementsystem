const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTasks({ status, priority, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (priority && priority !== 'all') params.append('priority', priority);
  if (search && search.trim()) params.append('search', search.trim());

  const url = `${API_BASE}/tasks${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load tasks: ${res.statusText}`);
  return res.json();
}

export async function fetchTaskStats() {
  const res = await fetch(`${API_BASE}/tasks/stats`);
  if (!res.ok) throw new Error(`Failed to load stats: ${res.statusText}`);
  return res.json();
}

export async function fetchTaskById(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error(`Failed to load task ${id}: ${res.statusText}`);
  return res.json();
}

export async function createTask(taskData) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update task');
  }
  return res.json();
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update status');
  }
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete task: ${res.statusText}`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to post comment');
  }
  return res.json();
}

