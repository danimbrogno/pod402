import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  helperText,
  error,
  options,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-stone-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-stone-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
            : 'border-stone-300'
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-rose-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>
      )}
    </div>
  );
}

