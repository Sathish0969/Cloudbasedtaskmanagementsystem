import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  User, 
  Folder, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  MessageCircleQuestion,
  Check,
  RefreshCw
} from 'lucide-react';
import { fetchQueries, createQuery, respondToQuery } from '../services/api';
import { taskWs } from '../services/websocket';

const FAQ_DATA = [
  {
    id: 'faq-1',
    question: 'How does real-time cloud synchronization work across teams in this system?',
    category: 'Cloud Architecture & Sync',
    summary: 'Instant sub-second updates powered by WebSockets and AWS cloud database storage.',
    answer: `Our cloud-based task management system utilizes an enterprise bidirectional WebSocket channel (/ws/tasks) coupled with FastAPI and AWS DynamoDB / JSON cloud persistence. Whenever a Team Leader creates an assignment, modifies sprint priorities, or resolves a member query, a real-time event is broadcast to all active browser sessions. This eliminates the need for manual page refreshes, guarantees single-source-of-truth accuracy, and ensures team members always work with up-to-the-minute requirements.`
  },
  {
    id: 'faq-2',
    question: 'What are the distinct responsibilities between Manager, Team Leader (TL), and Team Member?',
    category: 'Roles & Access Control',
    summary: 'A structured 3-tier hierarchy for governance, delegation, and focused execution.',
    answer: `The platform enforces clear Role-Based Access Control (RBAC):
• Engineering Manager: Oversees portfolio-level sprint health, overall project velocity, resource utilization, and executive sprint reports.
• Team Leader (TL): Authorized by the organization to store and manage team member rosters, delegate and assign sprint deliverables, approve task completion requests, and respond to member queries.
• Team Members: Pre-authorized employees who log in with their company email to view tasks specifically assigned to them, update deliverable progress, request task sign-offs, and escalate technical blockers directly to their Team Leader.`
  },
  {
    id: 'faq-3',
    question: 'How should team members handle blockers, dependencies, and deadline extensions?',
    category: 'Sprint Workflow & Escalation',
    summary: 'Use the integrated Query to TL option with urgency priority levels for swift resolution.',
    answer: `Instead of fragmented emails or informal chat messages where critical requests get lost, team members should use the "Query to TL" feature. You can categorize your query (e.g., Task Blocker, Technical Clarification, Deadline Request, or Resource Request), tag an associated task, and set the priority to "Urgent" or "High". The Team Leader receives the query immediately in their dashboard, reviews the context, and posts an official resolution with guidance.`
  },
  {
    id: 'faq-4',
    question: 'How are task attachments, cloud security, and access control safeguarded in the cloud?',
    category: 'Security & Cloud Storage',
    summary: 'Pre-signed S3 cryptographic tokens, TLS 1.3 in-transit encryption, and strict email verification.',
    answer: `Cloud security is architected on AWS best practices:
1. Attachments & Assets: Stored in Amazon S3 using short-lived pre-signed URLs, preventing direct public bucket exposure.
2. Authentication Guardrails: Only employee email addresses explicitly approved and stored by the Team Leader in the team roster are permitted to log in or create an account.
3. Least Privilege & Auditing: Changes, completions, and TL approvals are stamped with actor signatures and immutable timestamps in the activity audit log.`
  },
  {
    id: 'faq-5',
    question: 'Can team members access and update tasks offline or during intermittent network connectivity?',
    category: 'Resilience & Offline Handling',
    summary: 'Client-side caching with automatic reconnection and state resynchronization.',
    answer: `Yes. The web application maintains local state caching and optimistic UI updates. If your internet connection briefly drops, the top navigation live-sync indicator switches to "Offline" or "Reconnecting", while preserving your in-progress inputs. Once network connectivity is restored, the client automatically re-establishes the WebSocket connection and synchronizes changes with the cloud database seamlessly.`
  }
];

export default function QueriesView({
  role,
  user,
  tasks = [],
  addToast,
  onOpenTaskDetail
}) {
  const isTL = role === 'teamleader';
  const isManager = role === 'manager';
  const isEmployee = role === 'employee';

  // Navigation tab: 'queries' | 'faqs'
  const [activeTab, setActiveTab] = useState('queries');

  // Queries state
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Query Modal state (for team members)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState('Task Blocker');
  const [newPriority, setNewPriority] = useState('medium');
  const [newSelectedTaskId, setNewSelectedTaskId] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Response state (for Team Leader / Manager)
  const [respondingQueryId, setRespondingQueryId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('resolved');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // FAQ Accordion state
  const [expandedFaqId, setExpandedFaqId] = useState('faq-1');
  const [faqSearch, setFaqSearch] = useState('');

  // Load queries
  const loadQueries = async () => {
    try {
      setLoading(true);
      // If employee, filter by their own email so they see their queries
      const filterParams = isEmployee && user?.email ? { senderEmail: user.email } : {};
      const data = await fetchQueries(filterParams);
      setQueries(data);
    } catch (err) {
      console.error('Failed to load queries:', err);
      if (addToast) addToast('Failed to load queries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();

    // Real-Time WebSocket synchronization for member queries
    const unbindCreated = taskWs.on('QUERY_CREATED', (newQ) => {
      if (isEmployee && user?.email && (newQ.senderEmail || '').toLowerCase() !== user.email.toLowerCase()) {
        return;
      }
      setQueries((prev) => [newQ, ...prev.filter(q => q.id !== newQ.id)]);
    });

    const unbindUpdated = taskWs.on('QUERY_UPDATED', (updatedQ) => {
      setQueries((prev) => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    });

    const unbindDeleted = taskWs.on('QUERY_DELETED', ({ id }) => {
      setQueries((prev) => prev.filter(q => q.id !== id));
    });

    return () => {
      unbindCreated();
      unbindUpdated();
      unbindDeleted();
    };
  }, [role, user?.email, isEmployee]);

  // Handle new query submit
  const handleCreateQuerySubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      if (addToast) addToast('Please enter both subject and message', 'error');
      return;
    }

    try {
      setSubmittingQuery(true);
      const selectedTask = tasks.find(t => t.id === newSelectedTaskId);

      const payload = {
        taskId: newSelectedTaskId || null,
        taskTitle: selectedTask ? selectedTask.title : null,
        senderName: user?.name || 'Team Member',
        senderEmail: user?.email || 'employee@taskflow.cloud',
        teamLeader: 'Sabarinathan V',
        teamName: 'Cloud & Core Infrastructure Squad',
        subject: newSubject.trim(),
        message: newMessage.trim(),
        priority: newPriority,
        category: newCategory
      };

      const created = await createQuery(payload);
      setQueries(prev => [created, ...prev]);
      setIsNewModalOpen(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('Task Blocker');
      setNewPriority('medium');
      setNewSelectedTaskId('');

      if (addToast) addToast('Query sent to Team Leader Sabarinathan V successfully!', 'success');
    } catch (err) {
      console.error('Error creating query:', err);
      if (addToast) addToast(err.message || 'Failed to submit query', 'error');
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Handle TL respond submit
  const handleSendResponse = async (queryId) => {
    if (!responseText.trim()) {
      if (addToast) addToast('Please enter a response message', 'error');
      return;
    }

    try {
      setSubmittingResponse(true);
      const responder = isTL ? `${user?.name || 'Sabarinathan V'} (TL)` : `${user?.name || 'Manager'} (Lead)`;
      const updated = await respondToQuery(queryId, {
        response: responseText.trim(),
        status: responseStatus,
        respondedBy: responder
      });

      setQueries(prev => prev.map(q => q.id === queryId ? updated : q));
      setRespondingQueryId(null);
      setResponseText('');
      if (addToast) addToast('Response sent and query updated!', 'success');
    } catch (err) {
      console.error('Error sending response:', err);
      if (addToast) addToast(err.message || 'Failed to send response', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Filtered queries
  const filteredQueries = queries.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchSub = (q.subject || '').toLowerCase().includes(term);
      const matchMsg = (q.message || '').toLowerCase().includes(term);
      const matchSender = (q.senderName || '').toLowerCase().includes(term);
      const matchTask = (q.taskTitle || '').toLowerCase().includes(term);
      if (!matchSub && !matchMsg && !matchSender && !matchTask) return false;
    }
    return true;
  });

  const pendingCount = queries.filter(q => q.status === 'pending').length;
  const resolvedCount = queries.filter(q => q.status === 'resolved' || q.status === 'answered').length;

  // Filtered FAQs
  const filteredFaqs = FAQ_DATA.filter(faq => {
    if (!faqSearch.trim()) return true;
    const term = faqSearch.toLowerCase();
    return (
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="tf-queries-container">
      {/* Header Banner */}
      <div className="tf-queries-header">
        <div className="tf-queries-header-text">
          <div className="tf-queries-title-row">
            <h2>{isEmployee ? 'Query to Team Leader' : 'Team Member Queries & Support'}</h2>
            <span className={`tf-badge-pill ${isTL ? 'tf-badge-indigo' : isManager ? 'tf-badge-terracotta' : 'tf-badge-green'}`}>
              {isTL ? 'Team Leader Resolution Desk' : isManager ? 'Executive Oversight' : 'Employee Helpdesk'}
            </span>
          </div>
          <p className="tf-queries-subtitle">
            {isEmployee 
              ? 'Encountered a blocker, dependency, or technical question? Submit a direct query to Team Leader Sabarinathan V for swift unblocking.'
              : 'Direct queries, roadblocks, and technical questions submitted by pre-authorized squad members.'}
          </p>
        </div>

        {/* Action Button for Team Members */}
        {isEmployee && (
          <button 
            type="button" 
            className="tf-btn-primary tf-btn-new-query"
            onClick={() => setIsNewModalOpen(true)}
          >
            <Plus size={18} />
            <span>Raise Query to TL</span>
          </button>
        )}
      </div>

      {/* Main Tab Controls */}
      <div className="tf-queries-nav-tabs">
        <button
          type="button"
          className={`tf-qnav-tab ${activeTab === 'queries' ? 'active' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          <MessageSquare size={17} />
          <span>{isEmployee ? 'My Queries to TL' : 'Incoming Member Queries'}</span>
          <span className={`tf-qtab-counter ${pendingCount > 0 ? 'has-pending' : ''}`}>
            {queries.length}
          </span>
          {pendingCount > 0 && (
            <span className="tf-qtab-alert-pill" title={`${pendingCount} pending queries`}>
              {pendingCount} pending
            </span>
          )}
        </button>

        <button
          type="button"
          className={`tf-qnav-tab ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          <HelpCircle size={17} />
          <span>5 FAQs (Cloud Task Management)</span>
          <span className="tf-qtab-counter">5</span>
        </button>
      </div>

      {/* TAB 1: QUERIES INTERFACE */}
      {activeTab === 'queries' && (
        <div className="tf-queries-content">
          {/* Stats Bar (For TL & Manager, and summary for employee) */}
          <div className="tf-qstats-grid">
            <div className="tf-qstat-box">
              <span className="tf-qstat-number">{queries.length}</span>
              <span className="tf-qstat-label">Total Queries</span>
            </div>
            <div className="tf-qstat-box tf-qstat-amber">
              <span className="tf-qstat-number">{pendingCount}</span>
              <span className="tf-qstat-label">Awaiting Response</span>
            </div>
            <div className="tf-qstat-box tf-qstat-green">
              <span className="tf-qstat-number">{resolvedCount}</span>
              <span className="tf-qstat-label">Answered & Resolved</span>
            </div>
            <div className="tf-qstat-box tf-qstat-blue">
              <span className="tf-qstat-number">
                {queries.length > 0 ? `${Math.round((resolvedCount / queries.length) * 100)}%` : '100%'}
              </span>
              <span className="tf-qstat-label">Resolution Rate</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="tf-qfilter-bar">
            <div className="tf-qsearch-box">
              <Search size={16} className="tf-qsearch-icon" />
              <input
                type="text"
                placeholder="Search queries by subject, message, sender, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="tf-qfilter-group">
              <div className="tf-qfilter-select-wrap">
                <Filter size={14} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="tf-qselect"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending TL Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="answered">Answered</option>
                </select>
              </div>

              <div className="tf-qfilter-select-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="tf-qselect"
                >
                  <option value="all">All Categories</option>
                  <option value="Task Blocker">Task Blocker</option>
                  <option value="Technical Clarification">Technical Clarification</option>
                  <option value="Deadline Extension">Deadline Extension</option>
                  <option value="Resource Request">Resource Request</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              <button
                type="button"
                className="tf-btn-refresh-queries"
                onClick={loadQueries}
                title="Refresh queries"
              >
                <RefreshCw size={15} className={loading ? 'tf-spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Query Cards List */}
          {loading ? (
            <div className="tf-queries-empty-state">
              <RefreshCw size={28} className="tf-spinning" />
              <p>Loading queries from cloud database...</p>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="tf-queries-empty-state">
              <MessageCircleQuestion size={44} className="tf-empty-icon" />
              <h3>No Queries Found</h3>
              <p>
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No queries match your current filter parameters.'
                  : isEmployee
                  ? "You haven't submitted any queries yet. If you have questions about your tasks or need team leader guidance, click 'Raise Query to TL'."
                  : 'All queries from team members have been handled!'}
              </p>
              {isEmployee && (
                <button
                  type="button"
                  className="tf-btn-primary"
                  onClick={() => setIsNewModalOpen(true)}
                  style={{ marginTop: '12px' }}
                >
                  <Plus size={16} /> Raise First Query
                </button>
              )}
            </div>
          ) : (
            <div className="tf-query-cards-grid">
              {filteredQueries.map((q) => {
                const isPending = q.status === 'pending';
                const isResponding = respondingQueryId === q.id;

                return (
                  <div key={q.id} className={`tf-query-card ${isPending ? 'is-pending' : 'is-resolved'}`}>
                    {/* Top Row: Category, Priority, Status */}
                    <div className="tf-qcard-header">
                      <div className="tf-qcard-tags">
                        <span className={`tf-qcat-badge cat-${(q.category || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {q.category}
                        </span>
                        <span className={`tf-qpriority-badge prio-${q.priority}`}>
                          {q.priority.toUpperCase()}
                        </span>
                        {q.taskId && (
                          <span 
                            className="tf-qtask-tag"
                            onClick={() => onOpenTaskDetail && onOpenTaskDetail(q.taskId)}
                            title="Click to view related task"
                          >
                            <Folder size={12} /> {q.taskTitle || q.taskId}
                          </span>
                        )}
                      </div>

                      <div className="tf-qstatus-indicator">
                        {isPending ? (
                          <span className="tf-qstatus-pending">
                            <span className="tf-pulse-dot-amber"></span>
                            Awaiting TL Response
                          </span>
                        ) : (
                          <span className="tf-qstatus-resolved">
                            <CheckCircle2 size={15} />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subject and Message */}
                    <h3 className="tf-qcard-subject">{q.subject}</h3>
                    <p className="tf-qcard-message">{q.message}</p>

                    {/* Metadata Footer */}
                    <div className="tf-qcard-meta">
                      <div className="tf-qsender-info">
                        <div className="tf-qavatar">
                          {q.senderPicture ? (
                            <img src={q.senderPicture} alt={q.senderName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <span>{q.senderName ? q.senderName[0] : 'U'}</span>
                          )}
                        </div>
                        <div>
                          <span className="tf-qsender-name">{q.senderName}</span>
                          <span className="tf-qsender-email">{q.senderEmail}</span>
                        </div>
                      </div>
                      <div className="tf-qmeta-right">
                        <span className="tf-qtimestamp">
                          <Clock size={13} /> {new Date(q.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="tf-qtarget-tl">
                          To: <strong>{q.teamLeader || 'Sabarinathan V (TL)'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Team Leader Response Section (if answered/resolved) */}
                    {q.response && (
                      <div className="tf-qresponse-box">
                        <div className="tf-qresponse-header">
                          <div className="tf-qresponder-badge">
                            <ShieldCheck size={16} />
                            <span>Official Response by <strong>{q.respondedBy || 'Team Leader'}</strong></span>
                          </div>
                          {q.respondedAt && (
                            <span className="tf-qresponse-time">
                              {new Date(q.respondedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="tf-qresponse-body">{q.response}</p>
                      </div>
                    )}

                    {/* Team Leader / Manager Action Bar */}
                    {(isTL || isManager) && (
                      <div className="tf-qaction-bar">
                        {!isResponding ? (
                          <button
                            type="button"
                            className={`tf-btn-qreply ${isPending ? 'primary' : 'secondary'}`}
                            onClick={() => {
                              setRespondingQueryId(q.id);
                              setResponseText(q.response || '');
                              setResponseStatus(q.status === 'pending' ? 'resolved' : q.status);
                            }}
                          >
                            <Send size={15} />
                            <span>{q.response ? 'Update Response' : 'Reply & Resolve Query'}</span>
                          </button>
                        ) : (
                          <div className="tf-qreply-drawer">
                            <h4>Respond to {q.senderName} as Team Leader</h4>
                            <textarea
                              rows={4}
                              placeholder="Write clear guidance, architectural decisions, unblocking instructions, or approval..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              className="tf-qreply-textarea"
                            />
                            <div className="tf-qreply-controls">
                              <div className="tf-qstatus-select">
                                <label>Mark Status:</label>
                                <select 
                                  value={responseStatus} 
                                  onChange={(e) => setResponseStatus(e.target.value)}
                                >
                                  <option value="resolved">Resolved (Complete)</option>
                                  <option value="answered">Answered (Needs follow-up)</option>
                                </select>
                              </div>

                              <div className="tf-qreply-btns">
                                <button
                                  type="button"
                                  className="tf-btn-secondary"
                                  onClick={() => setRespondingQueryId(null)}
                                  disabled={submittingResponse}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="tf-btn-primary"
                                  onClick={() => handleSendResponse(q.id)}
                                  disabled={submittingResponse}
                                >
                                  {submittingResponse ? 'Sending...' : 'Submit Resolution'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 5 FREQUENTLY ASKED QUESTIONS */}
      {activeTab === 'faqs' && (
        <div className="tf-faqs-content">
          {/* FAQ Hero */}
          <div className="tf-faq-hero">
            <div className="tf-faq-hero-left">
              <span className="tf-faq-pill">
                <Sparkles size={14} /> Knowledge Base & Operational Guide
              </span>
              <h2>Frequently Asked Questions</h2>
              <p>
                Essential guide for team members, team leaders, and managers on utilizing this 
                cloud-based task management system with real-time cloud synchronization, role access, and escalation paths.
              </p>
            </div>

            {/* Search Box */}
            <div className="tf-faq-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search FAQs by keyword (e.g., sync, offline, permissions, blockers)..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 5 FAQs Accordion List */}
          <div className="tf-faq-accordion-list">
            {filteredFaqs.map((faq, index) => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <div key={faq.id} className={`tf-faq-accordion-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="tf-faq-question-btn"
                    onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="tf-faq-q-left">
                      <span className="tf-faq-number">0{index + 1}</span>
                      <div>
                        <span className="tf-faq-cat-tag">{faq.category}</span>
                        <h3 className="tf-faq-q-title">{faq.question}</h3>
                      </div>
                    </div>
                    <div className="tf-faq-toggle-icon">
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="tf-faq-answer-pane">
                      <div className="tf-faq-summary-box">
                        <Zap size={16} />
                        <strong>Key Takeaway: </strong>
                        <span>{faq.summary}</span>
                      </div>
                      <div className="tf-faq-answer-text">
                        {faq.answer.split('\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ Bottom Callout */}
          <div className="tf-faq-footer-callout">
            <div className="tf-faq-footer-icon">
              <MessageCircleQuestion size={32} />
            </div>
            <div className="tf-faq-footer-info">
              <h4>Still have questions or facing an urgent task blocker?</h4>
              <p>Reach out directly to Team Leader Sabarinathan V using the Query option.</p>
            </div>
            {isEmployee ? (
              <button 
                type="button" 
                className="tf-btn-primary"
                onClick={() => {
                  setActiveTab('queries');
                  setIsNewModalOpen(true);
                }}
              >
                <Plus size={16} /> Raise a Query to TL
              </button>
            ) : (
              <button 
                type="button" 
                className="tf-btn-primary"
                onClick={() => setActiveTab('queries')}
              >
                View Incoming Queries ({pendingCount} pending)
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT NEW QUERY (FOR TEAM MEMBERS) */}
      {isNewModalOpen && (
        <div className="tf-modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div className="tf-modal-card tf-query-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div>
                <h3>Submit Query to Team Leader</h3>
                <p>Recipient: <strong>Sabarinathan V (Team Leader)</strong></p>
              </div>
              <button 
                type="button" 
                className="tf-modal-close-btn"
                onClick={() => setIsNewModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateQuerySubmit} className="tf-query-form">
              {/* Category & Priority Row */}
              <div className="tf-form-row-2col">
                <div className="tf-form-group">
                  <label>Query Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="tf-form-input"
                  >
                    <option value="Task Blocker">Task Blocker (Requires TL Intervention)</option>
                    <option value="Technical Clarification">Technical Clarification</option>
                    <option value="Deadline Extension">Deadline Extension Request</option>
                    <option value="Resource Request">Resource / Access Request</option>
                    <option value="General Question">General Sprint Question</option>
                  </select>
                </div>

                <div className="tf-form-group">
                  <label>Urgency / Priority *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="tf-form-input"
                  >
                    <option value="urgent">Urgent (Sprint critical / Blocking)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Related Task Association (Optional) */}
              <div className="tf-form-group">
                <label>Associated Task (Optional)</label>
                <select
                  value={newSelectedTaskId}
                  onChange={(e) => setNewSelectedTaskId(e.target.value)}
                  className="tf-form-input"
                >
                  <option value="">-- No specific task (General sprint query) --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="tf-form-group">
                <label>Subject / Topic *</label>
                <input
                  type="text"
                  placeholder="e.g., DynamoDB Throttling issue in Task 103"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                  className="tf-form-input"
                />
              </div>

              {/* Message Details */}
              <div className="tf-form-group">
                <label>Query Details / Roadblock Description *</label>
                <textarea
                  rows={5}
                  placeholder="Describe what you are trying to accomplish, the error or dependency encountered, and what decision or guidance you need from the Team Leader..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required
                  className="tf-form-textarea"
                />
              </div>

              {/* Sender Info Preview */}
              <div className="tf-query-sender-pill">
                <User size={15} />
                <span>Sending as: <strong>{user?.name || 'Team Member'}</strong> ({user?.email || 'employee@taskflow.cloud'})</span>
              </div>

              {/* Footer Buttons */}
              <div className="tf-modal-footer">
                <button
                  type="button"
                  className="tf-btn-secondary"
                  onClick={() => setIsNewModalOpen(false)}
                  disabled={submittingQuery}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tf-btn-primary"
                  disabled={submittingQuery}
                >
                  <Send size={15} />
                  <span>{submittingQuery ? 'Submitting...' : 'Send Query to TL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
