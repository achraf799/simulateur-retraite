import React from 'react';

interface StatusBadgeProps {
  status: 'GREEN' | 'YELLOW' | 'RED' | 'BLUE';
  text: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, size = 'md' }) => {
  const colorClasses = {
    GREEN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    YELLOW: 'bg-amber-100 text-amber-800 border-amber-300',
    RED: 'bg-rose-100 text-rose-800 border-rose-300',
    BLUE: 'bg-blue-100 text-blue-800 border-blue-300',
  }[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm font-medium',
    lg: 'px-3.5 py-1.5 text-base font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${colorClasses} ${sizeClasses}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'GREEN'
            ? 'bg-emerald-500'
            : status === 'YELLOW'
            ? 'bg-amber-500'
            : status === 'RED'
            ? 'bg-rose-500'
            : 'bg-blue-500'
        }`}
      />
      {text}
    </span>
  );
};
