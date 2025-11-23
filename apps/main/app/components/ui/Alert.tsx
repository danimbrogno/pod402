import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'success' | 'error' | 'info' | 'warning';
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const variants = {
    success:
      'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

