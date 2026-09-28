import React from 'react';
import { 
  Cloud, 
  Database, 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function Navbar({ 
  healthData, 
  theme, 
  onToggleTheme, 
  searchQuery, 
  onSearchChange, 
  onOpenCreateModal,
  onRefresh,
  isLoading
}) {
  const isCloud = healthData?.storage?.mode === 'cloud';
  const activeType = healthData?.storage?.activeType || 'local';
  const region = healthData?.storage?.region || 'us-east-1';

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo & Platform Info */}
        <div className="brand-section">
          <div className="brand-logo">
            <Cloud className="brand-icon" size={24} />
            <div className="logo-pulse"></div>
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span>Cloud</span>Task
              <span className="brand-badge">AWS</span>
            </div>
            <p className="brand-subtitle">FastAPI &bull; DynamoDB &bull; S3</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, descriptions, or #tags... (Press /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="search-clear-btn" 
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Right Section: Cloud Badge, Refresh, Theme, New Task */}
        <div className="navbar-actions">
          {/* Cloud Connection Badge */}
          <div className={`cloud-status-badge ${isCloud ? 'badge-aws' : 'badge-local'}`}>
            {isCloud ? (
              <>
                <Database size={14} className="status-icon" />
                <span className="status-text">DynamoDB &bull; {region}</span>
                <span className="status-indicator live"></span>
              </>
            ) : (
              <>
                <HardDrive size={14} className="status-icon" />
                <span className="status-text">Local Storage Engine</span>
                <span className="status-indicator local"></span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button 
            className={`btn-icon ${isLoading ? 'is-spinning' : ''}`} 
            onClick={onRefresh}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>

          {/* Theme Switcher */}
          <button 
            className="btn-icon" 
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* New Task Action */}
          <button 
            className="btn-primary" 
            onClick={onOpenCreateModal}
            id="btn-create-task"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
