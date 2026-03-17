'use client';

import { Pagination } from '@/types';

interface PaginationBarProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({ pagination, onPageChange }: PaginationBarProps) {
  const { page, totalPages, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
      >
        ← Prev
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        return (
          <div key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && <span className="text-slate-400 px-1">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          </div>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
