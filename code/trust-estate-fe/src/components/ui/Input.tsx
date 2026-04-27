import React, { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      containerClassName,
      className,
      id: idProp,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            className={cn(
              'block w-full rounded-xl border-2 bg-white/60 py-4 text-gray-900 placeholder-gray-400',
              'transition-all duration-200 focus:outline-none focus:ring-4 focus:bg-white',
              leftIcon ? 'pl-12' : 'pl-4',
              rightElement ? 'pr-12' : 'pr-4',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10',
              disabled && 'cursor-not-allowed opacity-60 bg-gray-50',
              className,
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };