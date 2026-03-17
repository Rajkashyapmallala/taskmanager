'use client';

import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  PENDING:     { label: 'Pending',     class: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-100 text-blue-700' },
  COMPLETED:   { label: 'Completed',   class: 'bg-green-100 text-green-700' },
};

const priorityConfig = {
  LOW:    { label: 'Low',    class: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', class: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  HIGH:   { label: 'High',   class: 'bg-red-100 text-red-600',    dot: 'bg-red-500' },
};

export default function TaskCard({ task, onEdit, onDelete, onToggle }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className={`card p-4 hover:shadow-md transition-shadow ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Toggle checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'border-green-500 bg-green-500 text-white'
              : task.status === 'IN_PROGRESS'
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          {isCompleted && <span className="text-xs leading-none">✓</span>}
          {task.status === 'IN_PROGRESS' && <span className="w-2 h-2 rounded-full bg-blue-400 block" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-slate-800 text-sm leading-snug ${isCompleted ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${status.class}`}>{status.label}</span>
            <span className={`badge ${priority.class}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${priority.dot}`} />
              {priority.label}
            </span>
            {task.dueDate && (
              <span className="badge bg-slate-100 text-slate-500">
                📅 {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
