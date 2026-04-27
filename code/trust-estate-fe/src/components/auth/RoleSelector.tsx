import React from 'react';
import { Home, Briefcase, UserCheck, ClipboardList } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

type SelectableRole = Exclude<UserRole, 'Admin'>;

interface RoleOption {
  id: SelectableRole;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'Buyer', label: 'Buyer / Tenant', description: 'Search & make offers', icon: Home },
  { id: 'PropertyOwner', label: 'Property Owner', description: 'List your property', icon: Briefcase },
  { id: 'Agent', label: 'Agent', description: 'Manage listings', icon: UserCheck, badge: 'Requires verification' },
  { id: 'PropertyInspector', label: 'Property Inspector', description: 'Conduct inspections', icon: ClipboardList, badge: 'Requires verification' },
];

interface RoleSelectorProps {
  value: SelectableRole | '';
  onChange: (role: SelectableRole) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div>
      <p className="block text-sm font-semibold text-gray-700 mb-3">I am a…</p>
      <div className="grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((role) => {
          const Icon = role.icon;
          const selected = value === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              aria-pressed={selected}
              className={cn(
                'relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4',
                selected
                  ? 'border-blue-500 bg-blue-50 shadow-md focus:ring-blue-500/20'
                  : 'border-gray-200 bg-white/60 hover:border-blue-300 hover:bg-blue-50/50 focus:ring-blue-500/10',
              )}
            >
              <div className={cn('p-2.5 rounded-xl mb-2 transition-colors', selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500')}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className={cn('text-sm font-semibold leading-tight mb-0.5', selected ? 'text-blue-700' : 'text-gray-800')}>
                {role.label}
              </span>
              <span className="text-xs text-gray-500 leading-snug">{role.description}</span>
              {role.badge && (
                <span className="mt-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {role.badge}
                </span>
              )}
              {selected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}