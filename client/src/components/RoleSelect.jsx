import React, { useState } from 'react';
import { ArrowRight, Mail, X } from 'lucide-react';

export default function RoleSelect({ onSelectRole }) {
  const [modalType, setModalType] = useState(null);

  return (
    <div className="tf-auth-page">
      {/* Top Header */}
      <header className="tf-auth-header">
        <div className="tf-brand">
          <div className="tf-logo-icon tf-terracotta-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="tf-brand-name">Task Management</span>
        </div>

        <nav className="tf-auth-nav">
          <button 
            className="tf-nav-link" 
            onClick={() => setModalType('about')}
            type="button"
          >
            About
          </button>
          <button 
            className="tf-nav-link" 
            onClick={() => setModalType('contact')}
            type="button"
          >
            Contact
          </button>
        </nav>
      </header>

      {/* Main Role Selection Area */}
      <main className="tf-role-main">
        <div className="tf-role-hero">
          <span className="tf-tagline">CLOUD BASED</span>
          <h1 className="tf-hero-title">Task Management System</h1>
          <p className="tf-hero-subtitle">
            Plan <span>•</span> Collaborate <span>•</span> Achieve
          </p>
          <p className="tf-role-prompt">Choose your role to continue</p>
        </div>

        <div className="tf-role-cards-grid">
          {/* Manager Card */}
          <div className="tf-role-card tf-role-manager" onClick={() => onSelectRole('manager')}>
            <div className="tf-role-avatar-circle tf-manager-circle">
              <div className="tf-manager-svg-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm0 12c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5zm0 2.2c1.8 0 3.8.72 4.9 1.8H7.1c1.1-1.08 3.1-1.8 4.9-1.8z" />
                </svg>
              </div>
            </div>

            <h2 className="tf-role-name">Manager</h2>
            <p className="tf-role-desc">
              Strategic overview, sprint health, and workload analytics. <em>(Task assignment delegated to TL)</em>
            </p>

            <button 
              className="tf-role-btn tf-btn-manager"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('manager', 'login');
              }}
              type="button"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="tf-role-create-link"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('manager', 'create-account');
              }}
            >
              or Create Manager Account
            </button>
          </div>

          {/* Team Leader (TL) Card */}
          <div className="tf-role-card tf-role-teamleader" onClick={() => onSelectRole('teamleader', 'login')}>
            <div className="tf-role-highlight-badge">Exclusive Assigner</div>
            <div className="tf-role-avatar-circle tf-teamleader-circle">
              <div className="tf-teamleader-svg-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
            </div>

            <h2 className="tf-role-name">Team Leader (TL)</h2>
            <p className="tf-role-desc">
              Authorize and assign tasks from the manager to team members. <strong>Only TL has task assignment/creation access.</strong>
            </p>

            <button 
              className="tf-role-btn tf-btn-teamleader"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('teamleader', 'login');
              }}
              type="button"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="tf-role-create-link"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('teamleader', 'create-account');
              }}
            >
              or Create Team Leader Account
            </button>
          </div>

          {/* Employee Card */}
          <div className="tf-role-card tf-role-employee" onClick={() => onSelectRole('employee', 'login')}>
            <div className="tf-role-avatar-circle tf-employee-circle">
              <div className="tf-employee-svg-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm0 12c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                </svg>
              </div>
            </div>

            <h2 className="tf-role-name">Employee</h2>
            <p className="tf-role-desc">
              View your deliverables, update status and complete subtasks. <em>(Read-only task creation)</em>
            </p>

            <button 
              className="tf-role-btn tf-btn-employee"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('employee', 'login');
              }}
              type="button"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="tf-role-create-link"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('employee', 'create-account');
              }}
            >
              or Create Employee Account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="tf-auth-footer">
        <div className="tf-footer-divider"></div>
        <div className="tf-footer-content">
          <span className="tf-footer-copy">© 2026 Task Management. All rights reserved.</span>
          <span className="tf-footer-motto">Plan Today. A Better Tomorrow.</span>
        </div>
      </footer>

      {/* About Modal */}
      {modalType === 'about' && (
        <div className="tf-info-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="tf-info-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="tf-info-close" onClick={() => setModalType(null)}>
              <X size={18} />
            </button>
            <div className="tf-info-header">
              <div className="tf-logo-icon tf-terracotta-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3>About Task Management</h3>
            </div>
            <p className="tf-info-body">
              Task Management is a high-performance, cloud-native task management ecosystem built with FastAPI, AWS DynamoDB, Amazon S3, and React 19. It empowers managers to orchestrate complex sprints and gives employees focused clarity on daily deliverables.
            </p>
            <button className="tf-btn-modal-action" onClick={() => setModalType(null)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {modalType === 'contact' && (
        <div className="tf-info-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="tf-info-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="tf-info-close" onClick={() => setModalType(null)}>
              <X size={18} />
            </button>
            <div className="tf-info-header">
              <div className="tf-logo-icon tf-terracotta-bg">
                <Mail size={18} />
              </div>
              <h3>Contact Task Management Support</h3>
            </div>
            <p className="tf-info-body">
              Have questions or need assistance? Reach out to our engineering team at <strong>support@taskflow.cloud</strong> or collaborate directly via your company workspace.
            </p>
            <button className="tf-btn-modal-action" onClick={() => setModalType(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
