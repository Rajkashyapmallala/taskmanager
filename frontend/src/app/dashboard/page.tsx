'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { tasksApi } from '@/lib/api';
import { Task, TasksResponse, TaskStatus, CreateTaskData, UpdateTaskData } from '@/types';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import PaginationBar from '@/components/PaginationBar';
import { AxiosError } from 'axios';

const STATUS_TABS: { label: string; value: TaskStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<TasksResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const fetchTasks = useCallback(async () => {
    setFetching(true);
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (status) params.status = status;
      if (search) params.search = search;
      const { data: res } = await tasksApi.getAll(params);
      setData(res);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setFetching(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusTab = (val: TaskStatus | '') => {
    setStatus(val);
    setPage(1);
  };

  const handleCreate = async (formData: CreateTaskData) => {
    setModalLoading(true);
    try {
      await tasksApi.create(formData);
      toast.success('Task created!');
      setModalOpen(false);
      setPage(1);
      fetchTasks();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      toast.error(e.response?.data?.error || 'Failed to create task');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (formData: UpdateTaskData) => {
    if (!editingTask) return;
    setModalLoading(true);
    try {
      await tasksApi.update(editingTask.id, formData);
      toast.success('Task updated!');
      setEditingTask(null);
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      toast.error(e.response?.data?.error || 'Failed to update task');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await tasksApi.delete(deleteId);
      toast.success('Task deleted');
      setDeleteId(null);
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await tasksApi.toggle(id);
      fetchTasks();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data
    ? {
        total: data.pagination.total,
        completed: data.tasks.filter((t) => t.status === 'COMPLETED').length,
        inProgress: data.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
            <span className="font-semibold text-slate-800">TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">👋 {user?.name}</span>
            <button onClick={logout} className="btn-secondary text-xs py-1.5 px-3">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Page title + Add button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Tasks</h1>
            {data && (
              <p className="text-sm text-slate-500 mt-0.5">
                {data.pagination.total} task{data.pagination.total !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
          <button
            onClick={() => { setEditingTask(null); setModalOpen(true); }}
            className="btn-primary gap-2"
          >
            <span className="text-lg leading-none">+</span> New Task
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-9"
              placeholder="Search tasks…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Status tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusTab(tab.value)}
                className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  status === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task grid */}
        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && data.tasks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
            <PaginationBar pagination={data.pagination} onPageChange={setPage} />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-semibold text-slate-700 mb-1">
              {search || status ? 'No tasks match your filters' : 'No tasks yet'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {search || status ? 'Try adjusting your search or filter' : 'Create your first task to get started'}
            </p>
            {!search && !status && (
              <button
                onClick={() => { setEditingTask(null); setModalOpen(true); }}
                className="btn-primary"
              >
                + Create Task
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleEdit : handleCreate}
        task={editingTask}
        loading={modalLoading}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
