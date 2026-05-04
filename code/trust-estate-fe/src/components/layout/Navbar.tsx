'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home } from 'lucide-react';

// TODO:
// Place your logo image at: public/images/logo.png

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/search' },
  { label: 'Agents', href: '/agents' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gray-900/95 backdrop-blur-md shadow-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              {/* Logo image — place at public/images/logo.png */}
              <img
                src="/images/logo.png"
                alt="TrustEstate"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback if logo image is missing
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback icon shown if image fails */}
              <Home size={20} className="text-white hidden" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              TrustEstate
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-5 py-2 text-gray-300 hover:text-white font-semibold text-sm transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full transition-all shadow-md shadow-blue-600/30"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900/98 backdrop-blur-md border-t border-gray-700 px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-gray-300 hover:text-white font-medium text-base py-2 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-700">
            <a
              href="/login"
              className="text-center py-3 text-gray-300 font-semibold border border-gray-600 rounded-full hover:border-gray-400 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="text-center py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
};