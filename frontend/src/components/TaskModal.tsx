'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Task, CreateTaskData } from '@/types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  task?: Task | null;
  loading?: boolean;
}

export default function TaskModal({ open, onClose, onSubmit, task, loading }: TaskModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskData>();

  useEffect(() => {
    if (open) {
      reset(task
        ? {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          }
        : { title: '', description: '', priority: 'MEDIUM', dueDate: '' }
      );
    }
  }, [open, task, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="What needs to be done?"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Add more details…"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select className="input" {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}