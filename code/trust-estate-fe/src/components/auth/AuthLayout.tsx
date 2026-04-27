import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80&auto=format"
          alt=""
          fill
          priority
          className="object-cover opacity-20"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500/50 via-blue-400/30 to-purple-600/50" />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group" aria-label="TrustEstate home">
              <div className="p-3 rounded-2xl bg-white shadow-xl group-hover:bg-gray-50 transition-all duration-300">
                <svg className="w-12 h-12 text-blue-700" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <rect width="48" height="48" rx="8" fill="currentColor" opacity="0.1" />
                  <path d="M24 8L6 20v2h36v-2L24 8zM10 22v14h6V26h16v10h6V22H10z" fill="currentColor" />
                  <rect x="20" y="30" width="8" height="6" fill="currentColor" />
                </svg>
              </div>
            </Link>

            <p className="text-xs font-bold text-white/80 mb-3 tracking-widest uppercase">
              Where Prestige Finds Its Address
            </p>

            <h1 className="text-4xl font-bold text-white leading-tight">{title}</h1>

            {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}