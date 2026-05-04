'use client';

import { useState } from 'react';
import {
  Heart,
  Search,
  FileText,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Menu,
  X,
  Home,
} from 'lucide-react';


interface SavedProperty {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  savedDate: string;
}

interface Offer {
  id: number;
  propertyTitle: string;
  offerAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  submittedDate: string;
}

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning';
  message: string;
  time: string;
  read: boolean;
}

interface RecentSearch {
  id: number;
  query: string;
  location: string;
  date: string;
  results: number;
}

const savedProperties: SavedProperty[] = [
  {
    id: 1,
    title: 'Modern Architecture Home',
    price: 1450000,
    location: 'San Diego, CA',
    bedrooms: 4,
    bathrooms: 3,
    area: 3800,
    image: 'https://images.unsplash.com/photo-1627141234469-24711efb373c?w=600&auto=format&fit=crop',
    savedDate: '2 days ago',
  },
  {
    id: 2,
    title: 'Luxury Condo Building',
    price: 890000,
    location: 'Seattle, WA',
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    image: 'https://images.unsplash.com/photo-1766270596305-d0cfb9efaa52?w=600&auto=format&fit=crop',
    savedDate: '5 days ago',
  },
  {
    id: 3,
    title: 'Contemporary Townhouse',
    price: 675000,
    location: 'Portland, OR',
    bedrooms: 3,
    bathrooms: 2,
    area: 2000,
    image: 'https://images.unsplash.com/photo-1630404515111-2fc17457daa6?w=600&auto=format&fit=crop',
    savedDate: '1 week ago',
  },
  {
    id: 4,
    title: 'Beachfront Paradise',
    price: 2100000,
    location: 'Miami, FL',
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    image: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    savedDate: '1 week ago',
  },
];

const offers: Offer[] = [
  {
    id: 1,
    propertyTitle: 'Modern Luxury Villa',
    offerAmount: 1200000,
    status: 'pending',
    submittedDate: '2024-03-10',
  },
  {
    id: 2,
    propertyTitle: 'Downtown Penthouse',
    offerAmount: 850000,
    status: 'accepted',
    submittedDate: '2024-03-05',
  },
  {
    id: 3,
    propertyTitle: 'Suburban Family Home',
    offerAmount: 550000,
    status: 'rejected',
    submittedDate: '2024-03-01',
  },
];

const notifications: Notification[] = [
  {
    id: 1,
    type: 'success',
    message: 'Your offer on Modern Luxury Villa has been accepted!',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    message: 'New property matching your criteria in Beverly Hills',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'warning',
    message: 'Price drop on saved property: Beachfront Paradise',
    time: '1 day ago',
    read: true,
  },
  {
    id: 4,
    type: 'info',
    message: 'Agent responded to your inquiry about Downtown Condo',
    time: '2 days ago',
    read: true,
  },
];

const recentSearches: RecentSearch[] = [
  {
    id: 1,
    query: '3+ bedrooms, $500k-$1M',
    location: 'Los Angeles, CA',
    date: 'Today',
    results: 45,
  },
  {
    id: 2,
    query: 'Beachfront properties',
    location: 'Malibu, CA',
    date: 'Yesterday',
    results: 23,
  },
  {
    id: 3,
    query: 'Modern apartments',
    location: 'San Francisco, CA',
    date: '3 days ago',
    results: 67,
  },
];

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'offers' | 'searches'>(
    'overview'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Bell className="text-blue-500" size={20} />;
    }
  };

  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-500/30">
        <a href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
            <img
              src="/images/logo.png"
              alt="TrustEstate"
              className="w-10 h-10 object-contain"
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = 'none')
              }
            />
          </div>
          <span className="text-white font-bold text-lg">TrustEstate</span>
        </a>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
            JD
          </div>
          <div>
            <p className="font-bold text-white">John Doe</p>
            <p className="text-sm text-gray-300">Buyer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'overview', icon: <TrendingUp size={20} />, label: 'Overview' },
          {
            tab: 'saved',
            icon: <Heart size={20} />,
            label: 'Saved Properties',
            count: savedProperties.length,
          },
          {
            tab: 'offers',
            icon: <FileText size={20} />,
            label: 'My Offers',
            count: offers.length,
          },
          { tab: 'searches', icon: <Search size={20} />, label: 'Recent Searches' },
        ].map(({ tab, icon, label, count }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-200 hover:bg-gray-500/30'
            }`}
          >
            {icon}
            {label}
            {count !== undefined && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-500/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-200 hover:bg-gray-500/30 transition-all">
          <Settings size={20} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="fixed w-80 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-gray-700 to-gray-600 border-b border-gray-500 sticky top-0 z-30 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white">
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'saved' && 'Saved Properties'}
                  {activeTab === 'offers' && 'My Offers'}
                  {activeTab === 'searches' && 'Recent Searches'}
                </h1>
              </div>
              <a
                href="/search"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Browse Properties</span>
              </a>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Saved Properties</p>
                    <Heart className="text-red-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{savedProperties.length}</p>
                  <p className="text-sm text-green-600 mt-1">+2 this week</p>
                </div>
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Active Offers</p>
                    <FileText className="text-blue-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {offers.filter((o) => o.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Out of {offers.length} total</p>
                </div>
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Searches</p>
                    <Search className="text-purple-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{recentSearches.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Last 7 days</p>
                </div>
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Notifications</p>
                    <Bell className="text-orange-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {notifications.filter((n) => !n.read).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Unread</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Notifications */}
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
                    <Bell className="text-blue-600" size={24} />
                  </div>
                  <div className="space-y-4">
                    {notifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
                          notification.read
                            ? 'bg-gray-100 border-gray-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Offers */}
                <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Offers</h2>
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div key={offer.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{offer.propertyTitle}</h3>
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(offer.status)}`}
                          >
                            {offer.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign size={16} className="text-blue-600" />
                            <span className="font-semibold">{formatPrice(offer.offerAmount)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span>{offer.submittedDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recently Saved Properties */}
              <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recently Saved</h2>
                  <Heart className="text-red-500" size={24} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProperties.slice(0, 3).map((property) => (
                    <a
                      key={property.id}
                      href={`/property/${property.id}`}
                      className="group bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-300 hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-xl font-bold text-blue-600 mb-2">
                          {formatPrice(property.price)}
                        </p>
                        <h3 className="font-bold text-gray-900 mb-2">{property.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                          <MapPin size={14} />
                          <span>{property.location}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-700">
                          <div className="flex items-center gap-1">
                            <Bed size={16} className="text-blue-600" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath size={16} className="text-blue-600" />
                            <span>{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Square size={16} className="text-blue-600" />
                            <span>{property.area}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Saved Properties Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have {savedProperties.length} saved properties
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="group bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-300 hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg">
                          <Heart size={20} className="fill-red-500 text-red-500" />
                        </button>
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <Clock size={14} />
                          Saved {property.savedDate}
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          {formatPrice(property.price)}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <MapPin size={16} />
                          <span className="text-sm">{property.location}</span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Bed size={18} className="text-blue-600" />
                            <span className="text-sm font-semibold">{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Bath size={18} className="text-blue-600" />
                            <span className="text-sm font-semibold">{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Square size={18} className="text-blue-600" />
                            <span className="text-sm font-semibold">{property.area}</span>
                          </div>
                        </div>
                        <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have submitted {offers.length} offers
                </p>
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-6 bg-gray-100 rounded-2xl border-2 border-gray-300 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {offer.propertyTitle}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Calendar size={16} />
                            <span>Submitted on {offer.submittedDate}</span>
                          </div>
                        </div>
                        <span
                          className={`self-start sm:self-center px-4 py-2 text-sm font-bold rounded-xl border-2 ${getStatusColor(offer.status)}`}
                        >
                          {offer.status === 'pending' && (
                            <span className="flex items-center gap-2">
                              <Clock size={16} /> PENDING
                            </span>
                          )}
                          {offer.status === 'accepted' && (
                            <span className="flex items-center gap-2">
                              <CheckCircle size={16} /> ACCEPTED
                            </span>
                          )}
                          {offer.status === 'rejected' && (
                            <span className="flex items-center gap-2">
                              <XCircle size={16} /> REJECTED
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">Offer Amount:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatPrice(offer.offerAmount)}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                          {offer.status === 'pending' && (
                            <button className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Searches Tab */}
          {activeTab === 'searches' && (
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-3xl shadow-lg border-2 border-gray-300 p-6">
                <p className="text-gray-700 font-semibold mb-6">Your recent search history</p>
                <div className="space-y-4">
                  {recentSearches.map((search) => (
                    <div
                      key={search.id}
                      className="p-6 bg-gray-100 rounded-2xl border-2 border-gray-300 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Search className="text-blue-600" size={20} />
                            <h3 className="text-lg font-bold text-gray-900">{search.query}</h3>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gray-400" />
                              <span>{search.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-400" />
                              <span>{search.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home size={16} className="text-gray-400" />
                              <span>{search.results} properties found</span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                          Search Again
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}