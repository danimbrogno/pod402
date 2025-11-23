import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Input({
  label,
  helperText,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-stone-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-stone-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
            : 'border-stone-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-rose-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>
      )}
    </div>
  );
}

