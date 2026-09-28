import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Layers, 
  TrendingUp,
  Flame
} from 'lucide-react';

export default function StatsOverview({ stats }) {
  if (!stats) return null;

  const {
    total = 0,
    completed = 0,
    inProgress = 0,
    inReview = 0,
    backlog = 0,
    overdue = 0,
    completionRate = 0,
    byPriority = {}
  } = stats;

  const urgentCount = byPriority.urgent || 0;

  return (
    <section className="stats-grid" aria-label="Task Analytics">
      {/* Total Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper icon-total">
          <Layers size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Total Cloud Tasks</span>
          <div className="stat-number-row">
            <span className="stat-number">{total}</span>
            <span className="stat-subtext">{backlog} in backlog</span>
          </div>
        </div>
      </div>

      {/* In Progress Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper icon-progress">
          <Clock size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Active Work</span>
          <div className="stat-number-row">
            <span className="stat-number">{inProgress}</span>
            <span className="stat-subtext">{inReview} awaiting review</span>
          </div>
        </div>
      </div>

      {/* Overdue / High Priority Card */}
      <div className="stat-card">
        <div className={`stat-icon-wrapper ${overdue > 0 ? 'icon-overdue' : 'icon-priority'}`}>
          {overdue > 0 ? <AlertCircle size={20} /> : <Flame size={20} />}
        </div>
        <div className="stat-content">
          <span className="stat-label">Critical & Urgent</span>
          <div className="stat-number-row">
            <span className="stat-number">{overdue}</span>
            <span className="stat-subtext">{urgentCount} urgent priority</span>
          </div>
        </div>
      </div>

      {/* Completion Rate Card */}
      <div className="stat-card stat-card-progress">
        <div className="stat-icon-wrapper icon-completed">
          <TrendingUp size={20} />
        </div>
        <div className="stat-content stat-progress-content">
          <div className="stat-progress-header">
            <span className="stat-label">Completion Velocity</span>
            <span className="stat-rate-text">{completionRate}%</span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(100, completionRate)}%` }}
            ></div>
          </div>
          <span className="stat-subtext">{completed} of {total} resolved</span>
        </div>
      </div>
    </section>
  );
}
