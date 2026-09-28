import React from 'react';
import { Users, Check, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function StatCards({ role, stats, tasks = [] }) {
  const isManager = role === 'manager';

  // Calculate live stats from task list if available, or fall back to backend stats or mockup defaults
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const todoCount = tasks.filter(t => t.status === 'to-do' || t.status === 'backlog').length;
  const totalTasksCount = tasks.length;

  // Manager cards
  const managerCards = [
    {
      id: 'employees',
      label: 'Total Employees',
      value: stats?.totalEmployees ?? 8,
      icon: Users,
      cardClass: 'tf-stat-pink',
      iconClass: 'tf-icon-pink'
    },
    {
      id: 'completed',
      label: 'Completed Tasks',
      value: stats?.completed ?? (completedCount || 12),
      icon: Check,
      cardClass: 'tf-stat-green',
      iconClass: 'tf-icon-green'
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      value: stats?.inProgress ?? (inProgressCount || 5),
      icon: Clock,
      cardClass: 'tf-stat-amber',
      iconClass: 'tf-icon-amber'
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats?.overdue ?? (overdueCount || 3),
      icon: AlertCircle,
      cardClass: 'tf-stat-red',
      iconClass: 'tf-icon-red'
    }
  ];

  // Employee cards
  const employeeCards = [
    {
      id: 'completed',
      label: 'Completed',
      value: completedCount > 0 ? completedCount : 3,
      icon: Check,
      cardClass: 'tf-stat-green',
      iconClass: 'tf-icon-green'
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      value: inProgressCount > 0 ? inProgressCount : 4,
      icon: Clock,
      cardClass: 'tf-stat-amber',
      iconClass: 'tf-icon-amber'
    },
    {
      id: 'pending',
      label: 'Pending',
      value: todoCount > 0 ? todoCount : 2,
      icon: AlertCircle,
      cardClass: 'tf-stat-red',
      iconClass: 'tf-icon-red'
    },
    {
      id: 'total',
      label: 'Total Tasks',
      value: totalTasksCount > 0 ? totalTasksCount : 9,
      icon: Calendar,
      cardClass: 'tf-stat-blue',
      iconClass: 'tf-icon-blue'
    }
  ];

  const cards = isManager ? managerCards : employeeCards;

  return (
    <div className="tf-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`tf-stat-card ${card.cardClass}`}>
            <div className={`tf-stat-icon-wrap ${card.iconClass}`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="tf-stat-data">
              <span className="tf-stat-value">{card.value}</span>
              <span className="tf-stat-label">{card.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
