'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-6 shadow-xl">
        <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 bg-red-600 text-white hover:bg-red-700">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
