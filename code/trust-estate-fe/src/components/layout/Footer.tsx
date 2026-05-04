'use client';

import { MapPin, Phone, Mail } from 'lucide-react';
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa6';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 border-t-4 border-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & About */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
              <div className="p-1.5 bg-blue-600 rounded-xl">
                <img
                  src="/images/logo.png"
                  alt="TrustEstate"
                  className="w-8 h-8 object-contain"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display = 'none')
                  }
                />
              </div>
              TrustEstate
            </div>
            <p className="text-sm font-semibold text-blue-400 tracking-wide italic">
              Where Prestige Finds Its Address
            </p>
            <p className="text-gray-400 leading-relaxed text-sm">
              Your trusted partner in finding the perfect property. We provide a seamless
              experience to help you discover, buy, or rent your dream home with confidence.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: <FaFacebook size={18} />, href: '#', label: 'Facebook' },
                { icon: <FaXTwitter size={18} />, href: '#', label: 'X (Twitter)' },
                { icon: <FaInstagram size={18} />, href: '#', label: 'Instagram' },
                { icon: <FaLinkedinIn size={18} />, href: '#', label: 'LinkedIn' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-4 text-sm">
              {['About Us', 'Properties', 'Our Agents', 'Blog & News', 'Contact Us'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-blue-500 rounded-full" />
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">
              Our Services
            </h4>
            <ul className="space-y-4 text-sm">
              {[
                'Buy Property',
                'Rent Property',
                'Sell Property',
                'Property Management',
                'Mortgage Service',
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">
              Contact Info
            </h4>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500 shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="text-gray-400 leading-relaxed">
                  123 Real Estate Avenue,
                  <br />
                  Suite 400, New York,
                  <br />
                  NY 10001
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500 shrink-0">
                  <Phone size={16} />
                </div>
                <span className="text-gray-400">+1 (800) TRUST-EST</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500 shrink-0">
                  <Mail size={16} />
                </div>
                <span className="text-gray-400">info@trustestate.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TrustEstate. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
