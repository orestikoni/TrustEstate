'use client';

import { useState } from 'react';
import { useAuth } from '@/store/auth.context';
import Link from 'next/link';
import {
  Home,
  Plus,
  FileText,
  Settings,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Menu,
  X,
  Users,
  Image as ImageIcon,
  Upload,
  MessageSquare,
  Bell,
  Send,
  AlertCircle,
  ClipboardCheck,
  ArrowRight,
  Building,
  ChevronRight,
} from 'lucide-react';

type ListingStatus = 'pending_review' | 'corrections_requested' | 'active' | 'inactive';
type OfferStatus = 'pending' | 'countered' | 'accepted' | 'rejected';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  listingType: 'sale' | 'rent';
  image: string;
  images: string[];
  status: ListingStatus;
  agentName: string;
  agentId: number;
  createdDate: string;
  lastModified: string;
  views: number;
  favorites: number;
  offersCount: number;
  hasInspectionReport: boolean;
  hasActiveTransaction: boolean;
  correctionNote?: string;
}

interface Offer {
  id: number;
  listingId: number;
  buyerName: string;
  proposedPrice: number;
  status: OfferStatus;
  message: string;
  submittedDate: string;
  rounds: NegotiationRound[];
}

interface NegotiationRound {
  id: number;
  actor: 'buyer' | 'agent';
  action: 'offer' | 'counter' | 'accept' | 'reject';
  amount: number;
  message: string;
  date: string;
}

interface Notification {
  id: number;
  type: 'offer' | 'correction' | 'approval' | 'inspection' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  listingId?: number;
}

const mockListings: Listing[] = [
  {
    id: 1,
    title: 'Modern Luxury Villa',
    description: 'Stunning modern villa with ocean views and premium amenities',
    price: 1250000,
    location: 'Beverly Hills, CA',
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1759355787092-87e4eee09600?w=600&auto=format&fit=crop',
    images: [],
    status: 'active',
    agentName: 'Sarah Johnson',
    agentId: 1,
    createdDate: '2024-02-15',
    lastModified: '2024-03-01',
    views: 234,
    favorites: 45,
    offersCount: 3,
    hasInspectionReport: true,
    hasActiveTransaction: false,
  },
  {
    id: 2,
    title: 'Downtown Apartment',
    description: 'Beautiful apartment in the heart of downtown with city views',
    price: 850000,
    location: 'New York, NY',
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&auto=format&fit=crop',
    images: [],
    status: 'pending_review',
    agentName: 'Michael Chen',
    agentId: 2,
    createdDate: '2024-03-10',
    lastModified: '2024-03-10',
    views: 0,
    favorites: 0,
    offersCount: 0,
    hasInspectionReport: false,
    hasActiveTransaction: false,
  },
  {
    id: 3,
    title: 'Elegant Villa Estate',
    description: 'Luxurious estate with expansive grounds and premium finishes',
    price: 1850000,
    location: 'Miami Beach, FL',
    bedrooms: 6,
    bathrooms: 5,
    area: 5200,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1757264119066-2f627c6a6f03?w=600&auto=format&fit=crop',
    images: [],
    status: 'corrections_requested',
    agentName: 'Sarah Johnson',
    agentId: 1,
    createdDate: '2024-03-05',
    lastModified: '2024-03-08',
    views: 12,
    favorites: 2,
    offersCount: 0,
    hasInspectionReport: false,
    hasActiveTransaction: false,
    correctionNote:
      'Please add more interior photos and update the property description to include the new renovations.',
  },
];

const mockOffers: Offer[] = [
  {
    id: 1,
    listingId: 1,
    buyerName: 'John Smith',
    proposedPrice: 1200000,
    status: 'pending',
    message: 'Very interested in this property. Would like to schedule a viewing.',
    submittedDate: '2024-03-12',
    rounds: [
      {
        id: 1,
        actor: 'buyer',
        action: 'offer',
        amount: 1200000,
        message: 'Initial offer, ready to close within 30 days',
        date: '2024-03-12 10:30 AM',
      },
    ],
  },
  {
    id: 2,
    listingId: 1,
    buyerName: 'Emily Rodriguez',
    proposedPrice: 1225000,
    status: 'countered',
    message: 'Cash buyer, pre-approved and ready to proceed.',
    submittedDate: '2024-03-10',
    rounds: [
      {
        id: 1,
        actor: 'buyer',
        action: 'offer',
        amount: 1180000,
        message: 'Initial offer',
        date: '2024-03-10 09:15 AM',
      },
      {
        id: 2,
        actor: 'agent',
        action: 'counter',
        amount: 1225000,
        message: 'Counter offer - property recently appraised at $1.3M',
        date: '2024-03-10 02:30 PM',
      },
    ],
  },
];

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'offer',
    title: 'New Offer Received',
    message: 'John Smith submitted an offer of $1,200,000 for Modern Luxury Villa',
    timestamp: '2024-03-12 10:30 AM',
    read: false,
    listingId: 1,
  },
  {
    id: 2,
    type: 'correction',
    title: 'Corrections Requested',
    message: 'Agent Sarah Johnson requested corrections for Elegant Villa Estate',
    timestamp: '2024-03-08 03:15 PM',
    read: false,
    listingId: 3,
  },
  {
    id: 3,
    type: 'approval',
    title: 'Listing Approved',
    message: 'Your listing "Modern Luxury Villa" has been approved and is now active',
    timestamp: '2024-03-01 11:20 AM',
    read: true,
    listingId: 1,
  },
  {
    id: 4,
    type: 'inspection',
    title: 'Inspection Report Available',
    message: 'Inspection report for Modern Luxury Villa is now available for review',
    timestamp: '2024-02-28 09:00 AM',
    read: true,
    listingId: 1,
  },
];

export default function OwnerDashboardPage() {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Loading...';
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'create' | 'manage' | 'offers' | 'inspection' | 'messages'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [messageText, setMessageText] = useState('');
  const [notifications, setNotifications] = useState(mockNotifications);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusConfig = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle };
      case 'pending_review':
        return { label: 'Pending Agent Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'corrections_requested':
        return { label: 'Corrections Requested', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle };
      case 'inactive':
        return { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: XCircle };
    }
  };

  const getOfferStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'pending':   return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'countered': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'accepted':  return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':  return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const handleRemoveListing = (listing: Listing) => {
    if (listing.hasActiveTransaction) {
      alert('Cannot remove listing: Active transaction in progress. Please contact your agent.');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently remove "${listing.title}"?`)) {
      console.log('Removing listing:', listing.id);
    }
  };

  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-blue-500/30">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-lg">
            <img
              src="/images/logo.png"
              alt="TrustEstate"
              className="w-10 h-10 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          </div>
          <div>
            <p className="font-bold text-white text-lg">TrustEstate</p>
            <p className="text-xs text-blue-200">Property Owner</p>
          </div>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">
            {initials}
          </div>
          <div>
            <p className="font-bold text-white">{fullName}</p>
            <p className="text-sm text-blue-200">{user?.emailAddress ?? ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard', icon: <Home size={20} />, label: 'Dashboard' },
          { tab: 'create', icon: <Plus size={20} />, label: 'Create Listing' },
          { tab: 'manage', icon: <Building size={20} />, label: 'Manage Listings', count: mockListings.length },
          { tab: 'messages', icon: <MessageSquare size={20} />, label: 'Messages' },
        ].map(({ tab, icon, label, count }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as typeof activeTab); setSelectedListing(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'text-white hover:bg-blue-500/30'
            }`}
          >
            {icon}
            {label}
            {count !== undefined && (
              <span className="ml-auto bg-blue-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-blue-500/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-white hover:bg-blue-500/30 transition-all">
          <Settings size={20} />
          Settings
        </button>
        <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-80" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'dashboard' && 'Property Dashboard'}
                    {activeTab === 'create' && 'Create New Listing'}
                    {activeTab === 'manage' && 'Manage Listings'}
                    {activeTab === 'offers' && `Offers — ${selectedListing?.title}`}
                    {activeTab === 'inspection' && `Inspection Report — ${selectedListing?.title}`}
                    {activeTab === 'messages' && 'Messages'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeTab === 'dashboard' && 'Overview of all your listings and activity'}
                    {activeTab === 'create' && 'Add a new property to your portfolio'}
                    {activeTab === 'manage' && 'Edit and manage your property listings'}
                  </p>
                </div>
              </div>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={22} className="text-gray-700" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Listings */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-sm"
                      >
                        <Plus size={18} />
                        New Listing
                      </button>
                    </div>

                    <div className="space-y-4">
                      {mockListings.map((listing) => {
                        const statusConfig = getStatusConfig(listing.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div key={listing.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex gap-4">
                              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                <img
                                  src={listing.image}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{listing.title}</h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <MapPin size={14} />{listing.location}
                                    </p>
                                  </div>
                                  <p className="font-bold text-blue-600 ml-3">{formatPrice(listing.price)}</p>
                                </div>

                                <div className="flex items-center gap-4 mb-3">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusConfig.color}`}>
                                    <StatusIcon size={14} />
                                    {statusConfig.label}
                                  </span>
                                  <span className="text-xs text-gray-500">Agent: {listing.agentName}</span>
                                </div>

                                {listing.status === 'corrections_requested' && listing.correctionNote && (
                                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-xs font-semibold text-orange-900 mb-1">Correction Note:</p>
                                    <p className="text-xs text-orange-800">{listing.correctionNote}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => { setSelectedListing(listing); setActiveTab('offers'); }}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  >
                                    View Offers ({listing.offersCount})
                                  </button>
                                  {listing.hasInspectionReport && (
                                    <button
                                      onClick={() => { setSelectedListing(listing); setActiveTab('inspection'); }}
                                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                      Inspection Report
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setSelectedListing(listing); setActiveTab('messages'); }}
                                    className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center"
                                  >
                                    <MessageSquare size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Bell size={20} className="text-blue-600" />
                    Notifications
                  </h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => setNotifications(notifications.map((n) => n.id === notification.id ? { ...n, read: true } : n))}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'offer'      ? 'bg-blue-100 text-blue-600' :
                            notification.type === 'correction' ? 'bg-orange-100 text-orange-600' :
                            notification.type === 'approval'   ? 'bg-green-100 text-green-600' :
                            notification.type === 'inspection' ? 'bg-purple-100 text-purple-600' :
                                                                 'bg-gray-100 text-gray-600'
                          }`}>
                            {notification.type === 'offer'      && <DollarSign size={16} />}
                            {notification.type === 'correction' && <AlertCircle size={16} />}
                            {notification.type === 'approval'   && <CheckCircle size={16} />}
                            {notification.type === 'inspection' && <ClipboardCheck size={16} />}
                            {notification.type === 'message'    && <MessageSquare size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Create Listing Tab ── */}
          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Property Images *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                      <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 10MB each (minimum 6 images required)</p>
                      <button type="button" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                        <Upload size={20} />
                        Choose Files
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Property Title *</label>
                    <input type="text" placeholder="e.g., Modern Luxury Villa with Ocean Views" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Property Description *</label>
                    <textarea rows={6} placeholder="Provide a detailed description of your property including features, amenities, and unique selling points..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" required />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="text" placeholder="City, State, ZIP Code" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                  </div>

                  {/* Price & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Asking Price (USD) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="1,250,000" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Listing Type *</label>
                      <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white" required>
                        <option value="">Select listing type</option>
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Bedrooms *</label>
                      <input type="number" placeholder="5" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Bathrooms *</label>
                      <input type="number" placeholder="4" min="0" step="0.5" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Area (sq ft) *</label>
                      <input type="number" placeholder="4500" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                  </div>

                  {/* Agent */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Select Agent for Review *</label>
                    <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white" required>
                      <option value="">Choose an agent</option>
                      <option value="1">Sarah Johnson — Beverly Hills Specialist</option>
                      <option value="2">Michael Chen — Downtown Expert</option>
                      <option value="3">Emily Rodriguez — Luxury Properties</option>
                      <option value="4">David Park — Commercial & Residential</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-600">The selected agent will review your listing before it goes live.</p>
                  </div>

                  {/* Submit */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Before submitting:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensure all information is accurate and complete</li>
                        <li>• Upload high-quality photos (minimum 6 images)</li>
                        <li>• Review property description for clarity</li>
                        <li>• Verify contact information is current</li>
                      </ul>
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
                        Submit for Agent Review
                        <ArrowRight size={20} />
                      </button>
                      <button type="button" className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Save as Draft
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Manage Listings Tab ── */}
          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockListings.map((listing) => {
                const statusConfig = getStatusConfig(listing.status);
                const StatusIcon = statusConfig.icon;
                const canEdit = listing.status === 'pending_review' || listing.status === 'corrections_requested';

                return (
                  <div key={listing.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border backdrop-blur-sm ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin size={16} />
                        <span className="text-sm line-clamp-1">{listing.location}</span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mb-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Bed size={18} className="text-blue-600" />
                          <span className="text-sm font-semibold">{listing.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Bath size={18} className="text-blue-600" />
                          <span className="text-sm font-semibold">{listing.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Square size={18} className="text-blue-600" />
                          <span className="text-sm font-semibold">{listing.area}</span>
                        </div>
                      </div>

                      {listing.status === 'corrections_requested' && listing.correctionNote && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-xs font-bold text-orange-900 mb-1">Agent Notes:</p>
                          <p className="text-xs text-orange-800">{listing.correctionNote}</p>
                        </div>
                      )}

                      {listing.status === 'active' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900">
                            To edit this listing, please contact your agent {listing.agentName} through the messaging panel.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {canEdit ? (
                          <>
                            <button className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                              <Edit size={16} />
                              Edit & Resubmit
                            </button>
                            <button
                              onClick={() => handleRemoveListing(listing)}
                              className="w-full py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={16} />
                              Remove Listing
                            </button>
                          </>
                        ) : listing.status === 'active' ? (
                          <>
                            <button
                              onClick={() => { setSelectedListing(listing); setActiveTab('messages'); }}
                              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare size={16} />
                              Contact Agent
                            </button>
                            <button
                              onClick={() => handleRemoveListing(listing)}
                              className="w-full py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={16} />
                              Request Removal
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Offers Tab ── */}
          {activeTab === 'offers' && selectedListing && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
              >
                <ChevronRight size={20} className="rotate-180" />
                Back to Dashboard
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedListing.title}</h2>
                  <p className="text-gray-600">All offers are managed by your agent: {selectedListing.agentName}</p>
                </div>

                <div className="space-y-6">
                  {mockOffers.filter((o) => o.listingId === selectedListing.id).map((offer) => (
                    <div key={offer.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {offer.buyerName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{offer.buyerName}</h3>
                            <p className="text-sm text-gray-600">{offer.submittedDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Current Offer</p>
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(offer.proposedPrice)}</p>
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border mt-2 ${getOfferStatusColor(offer.status)}`}>
                            {offer.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Buyer Message:</p>
                        <p className="text-sm text-gray-600 italic">"{offer.message}"</p>
                      </div>

                      <p className="text-sm font-bold text-gray-900 mb-3">Negotiation History</p>
                      <div className="space-y-3">
                        {offer.rounds.map((round) => (
                          <div key={round.id} className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              round.actor === 'buyer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {round.actor === 'buyer' ? <Users size={18} /> : <CheckCircle size={18} />}
                            </div>
                            <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-gray-900">
                                  {round.actor === 'buyer' ? 'Buyer' : 'Agent'}{' '}
                                  {round.action === 'offer' ? 'Offer' : round.action === 'counter' ? 'Counter' : round.action}
                                </p>
                                <p className="text-sm font-bold text-blue-600">{formatPrice(round.amount)}</p>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{round.message}</p>
                              <p className="text-xs text-gray-500">{round.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Note:</strong> Only your assigned agent can accept, decline, or counter offers. Contact {selectedListing.agentName} through the messaging panel for questions.
                        </p>
                      </div>
                    </div>
                  ))}

                  {mockOffers.filter((o) => o.listingId === selectedListing.id).length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 font-semibold">No offers yet</p>
                      <p className="text-sm text-gray-500">Offers will appear here once buyers submit them</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Inspection Report Tab ── */}
          {activeTab === 'inspection' && selectedListing && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
              >
                <ChevronRight size={20} className="rotate-180" />
                Back to Dashboard
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Inspection Report</h2>
                  <p className="text-gray-600">{selectedListing.title}</p>
                  <p className="text-sm text-gray-500 mt-1">Inspected on: February 28, 2024</p>
                </div>

                <div className="mb-8 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-900">PASS — Property Approved</p>
                      <p className="text-sm text-green-800">Overall condition: Excellent</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800">This property has passed inspection with minor observations. No critical issues were found.</p>
                </div>

                <div className="space-y-6">
                  {[
                    { category: 'Structural Integrity', rating: 'Pass', severity: 'Low',    findings: 'Foundation and framing in excellent condition. Minor cosmetic cracks in garage floor.' },
                    { category: 'Plumbing',             rating: 'Pass', severity: 'Low',    findings: 'All plumbing systems functioning properly. Water pressure adequate throughout.' },
                    { category: 'Electrical',           rating: 'Pass', severity: 'Medium', findings: 'Electrical panel updated in 2020. Recommend adding GFCI outlets in bathrooms.' },
                    { category: 'HVAC',                 rating: 'Pass', severity: 'Low',    findings: 'Heating and cooling systems operational. Last serviced 3 months ago.' },
                    { category: 'Roof',                 rating: 'Pass', severity: 'Low',    findings: 'Roof in good condition with 10+ years remaining lifespan.' },
                    { category: 'Safety',               rating: 'Pass', severity: 'Low',    findings: 'Smoke detectors and CO detectors present and functional.' },
                  ].map((item, i) => (
                    <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{item.category}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.rating === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.rating}
                          </span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            item.severity === 'Low' ? 'bg-blue-100 text-blue-700' :
                            item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{item.findings}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Inspector:</strong> Certified Inspector Name<br />
                    <strong>License:</strong> #INS-12345-CA<br />
                    <strong>Report Date:</strong> February 28, 2024
                  </p>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> This report is read-only. For questions about the inspection, please contact your agent through the messaging panel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Select Listing</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      onChange={(e) => {
                        const listing = mockListings.find((l) => l.id === parseInt(e.target.value));
                        setSelectedListing(listing || null);
                      }}
                      value={selectedListing?.id || ''}
                    >
                      <option value="">Choose a listing to message about</option>
                      {mockListings.map((listing) => (
                        <option key={listing.id} value={listing.id}>
                          {listing.title} — Agent: {listing.agentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedListing && (
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedListing.agentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedListing.agentName}</p>
                        <p className="text-sm text-gray-600">Assigned Agent</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {selectedListing ? (
                    <>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {selectedListing.agentName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl rounded-tl-none p-4 border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-900">
                              Hello! I've reviewed your listing and it looks great. I have a few minor suggestions to improve the photos. Can you add some exterior shots?
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-1">March 8, 2024 at 2:30 PM</p>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <div className="flex-1 max-w-md">
                          <div className="bg-blue-600 rounded-2xl rounded-tr-none p-4 shadow-sm">
                            <p className="text-sm text-white">
                              Thank you for the feedback! I'll upload additional exterior photos today. Should I include night-time shots as well?
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 mr-1 text-right">March 8, 2024 at 3:45 PM</p>
                        </div>
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold flex-shrink-0">
                          {initials}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 font-semibold">Select a listing to start messaging</p>
                        <p className="text-sm text-gray-500">Choose a listing above to communicate with your agent</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {selectedListing && (
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <form
                      className="flex gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (messageText.trim()) {
                          console.log('Sending message:', messageText);
                          setMessageText('');
                        }
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Send size={20} />
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}