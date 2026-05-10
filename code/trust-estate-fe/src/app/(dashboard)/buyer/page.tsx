'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
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
  DollarSign,
  Calendar,
  Menu,
  X,
  MessageSquare,
  Eye,
  ArrowRight,
  Send,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
  Users,
  Edit3,
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
  hasActiveOffer: boolean;
}

interface Offer {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string;
  offerAmount: number;
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn';
  submittedDate: string;
  agentName: string;
  agentId: number;
  message: string;
  rounds: NegotiationRound[];
  canRevise: boolean;
  canWithdraw: boolean;
  hasInspectionReport: boolean;
}

interface NegotiationRound {
  id: number;
  actor: 'buyer' | 'agent';
  action: 'offer' | 'counter' | 'accept' | 'reject' | 'withdraw' | 'revise';
  amount: number;
  message: string;
  date: string;
}

interface Notification {
  id: number;
  type: 'offer_update' | 'new_listing' | 'price_drop' | 'inspection' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  propertyId?: number;
}

interface Message {
  id: number;
  propertyId: number;
  sender: 'buyer' | 'agent';
  senderName: string;
  content: string;
  timestamp: string;
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
    hasActiveOffer: true,
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
    hasActiveOffer: false,
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
    hasActiveOffer: false,
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
    hasActiveOffer: false,
  },
];

const offers: Offer[] = [
  {
    id: 1,
    propertyId: 1,
    propertyTitle: 'Modern Architecture Home',
    propertyImage: 'https://images.unsplash.com/photo-1627141234469-24711efb373c?w=600&auto=format&fit=crop',
    offerAmount: 1400000,
    status: 'accepted',
    submittedDate: '2024-03-10',
    agentName: 'Sarah Johnson',
    agentId: 1,
    message: 'Very interested in this property. Ready to close within 30 days.',
    canRevise: false,
    canWithdraw: false,
    hasInspectionReport: true,
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer',   amount: 1350000, message: 'Initial offer - pre-approved, ready to close quickly',        date: '2024-03-10 10:30 AM' },
      { id: 2, actor: 'agent', action: 'counter', amount: 1400000, message: 'Property recently appraised at $1.45M. This is our best offer.', date: '2024-03-10 02:15 PM' },
      { id: 3, actor: 'buyer', action: 'accept',  amount: 1400000, message: 'Accepted! Looking forward to proceeding.',                     date: '2024-03-11 09:00 AM' },
    ],
  },
  {
    id: 2,
    propertyId: 5,
    propertyTitle: 'Downtown Penthouse',
    propertyImage: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&auto=format&fit=crop',
    offerAmount: 920000,
    status: 'countered',
    submittedDate: '2024-03-12',
    agentName: 'Michael Chen',
    agentId: 2,
    message: 'Cash buyer, flexible closing date.',
    canRevise: true,
    canWithdraw: true,
    hasInspectionReport: false,
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer',   amount: 870000, message: 'Initial offer - cash buyer',                            date: '2024-03-12 11:00 AM' },
      { id: 2, actor: 'agent', action: 'counter', amount: 920000, message: 'Seller willing to negotiate. Counter offer at $920k.', date: '2024-03-12 04:30 PM' },
    ],
  },
  {
    id: 3,
    propertyId: 6,
    propertyTitle: 'Suburban Family Home',
    propertyImage: 'https://images.unsplash.com/photo-1765370214754-7f43f88e6298?w=600&auto=format&fit=crop',
    offerAmount: 550000,
    status: 'pending',
    submittedDate: '2024-03-14',
    agentName: 'Emily Rodriguez',
    agentId: 3,
    message: 'Perfect home for our family. Hope to hear back soon!',
    canRevise: true,
    canWithdraw: true,
    hasInspectionReport: false,
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer', amount: 550000, message: 'Offering asking price - very motivated buyer', date: '2024-03-14 09:15 AM' },
    ],
  },
];

const notifications: Notification[] = [
  { id: 1, type: 'offer_update', title: 'Offer Accepted!',          message: 'Your offer on Modern Architecture Home has been accepted at $1,400,000', timestamp: '2 hours ago',  read: false, propertyId: 1 },
  { id: 2, type: 'offer_update', title: 'Counter Offer Received',   message: 'Agent countered your offer on Downtown Penthouse at $920,000',           timestamp: '5 hours ago',  read: false, propertyId: 5 },
  { id: 3, type: 'inspection',   title: 'Inspection Report Available', message: 'Inspection report for Modern Architecture Home is now ready for review', timestamp: '1 day ago',   read: true,  propertyId: 1 },
  { id: 4, type: 'new_listing',  title: 'New Listing Match',         message: 'New property matching your criteria in San Diego, CA',                   timestamp: '1 day ago',   read: true },
  { id: 5, type: 'price_drop',   title: 'Price Drop Alert',          message: 'Beachfront Paradise reduced by $150,000',                               timestamp: '2 days ago',  read: true,  propertyId: 4 },
];

const mockMessages: Message[] = [
  { id: 1, propertyId: 1, sender: 'agent', senderName: 'Sarah Johnson', content: "Congratulations on your accepted offer! I'll be in touch shortly with next steps for the closing process.", timestamp: '2024-03-11 10:30 AM' },
  { id: 2, propertyId: 1, sender: 'buyer', senderName: 'You',           content: "Thank you! I'm very excited. When can we schedule the inspection?",                                          timestamp: '2024-03-11 11:15 AM' },
];

export default function BuyerDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'favorites' | 'offers' | 'messages' | 'notifications' | 'inspection'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [messageText, setMessageText] = useState('');
  const [reviseAmount, setReviseAmount] = useState('');
  const [reviseMessage, setReviseMessage] = useState('');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getOfferStatusConfig = (status: Offer['status']) => {
    switch (status) {
      case 'pending':   return { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'countered': return { label: 'Counter Offer',  color: 'bg-purple-100 text-purple-700 border-purple-300', icon: TrendingUp };
      case 'accepted':  return { label: 'Accepted',       color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'rejected':  return { label: 'Rejected',       color: 'bg-red-100 text-red-700 border-red-300',         icon: XCircle };
      case 'withdrawn': return { label: 'Withdrawn',      color: 'bg-gray-100 text-gray-700 border-gray-300',      icon: XCircle };
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'offer_update': return <FileText    className="text-blue-600"   size={16} />;
      case 'new_listing':  return <Home        className="text-green-600"  size={16} />;
      case 'price_drop':   return <TrendingUp  className="text-orange-600" size={16} />;
      case 'inspection':   return <ClipboardCheck className="text-purple-600" size={16} />;
      case 'message':      return <MessageSquare  className="text-blue-600"   size={16} />;
    }
  };

  const handleWithdrawOffer = (offer: Offer) => {
    if (window.confirm(`Are you sure you want to withdraw your offer on "${offer.propertyTitle}"?`)) {
      console.log('Withdrawing offer:', offer.id);
    }
  };

  const handleReviseOffer = (offer: Offer) => {
    if (!reviseAmount || !reviseMessage) {
      alert('Please enter both a revised amount and message.');
      return;
    }
    console.log('Revising offer:', offer.id, { amount: reviseAmount, message: reviseMessage });
    setReviseAmount('');
    setReviseMessage('');
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
            <p className="text-xs text-blue-200">Buyer Portal</p>
          </div>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">
            JD
          </div>
          <div>
            <p className="font-bold text-white">John Doe</p>
            <p className="text-sm text-blue-200">john.doe@email.com</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',     icon: <Home size={20} />,          label: 'Dashboard' },
          { tab: 'favorites',     icon: <Heart size={20} />,         label: 'Saved Favorites',  count: savedProperties.length },
          { tab: 'offers',        icon: <FileText size={20} />,      label: 'My Offers',        count: offers.length },
          { tab: 'messages',      icon: <MessageSquare size={20} />, label: 'Messages' },
          { tab: 'notifications', icon: <Bell size={20} />,          label: 'Notifications',
            count: notifications.filter((n) => !n.read).length,
            countColor: 'bg-red-500' },
        ].map(({ tab, icon, label, count, countColor }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as typeof activeTab); setSelectedOffer(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'text-white hover:bg-blue-500/30'
            }`}
          >
            {icon}
            {label}
            {count !== undefined && count > 0 && (
              <span className={`ml-auto ${countColor ?? 'bg-blue-400'} text-white text-xs font-bold px-2 py-1 rounded-full`}>
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
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all">
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
              <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
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
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'dashboard'     && 'Buyer Dashboard'}
                    {activeTab === 'favorites'     && 'Saved Favorites'}
                    {activeTab === 'offers'        && (selectedOffer ? `Offer Details — ${selectedOffer.propertyTitle}` : 'My Offers')}
                    {activeTab === 'messages'      && 'Messages'}
                    {activeTab === 'notifications' && 'Notifications'}
                    {activeTab === 'inspection'    && 'Inspection Report'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeTab === 'dashboard' && 'Overview of your property search activity'}
                    {activeTab === 'favorites' && "Properties you've saved for later"}
                    {activeTab === 'offers' && !selectedOffer && 'Track all your submitted offers'}
                  </p>
                </div>
              </div>
              <Link
                href="/search"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Browse Properties</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Saved Properties', value: savedProperties.length,                                              sub: '+2 this week',    subColor: 'text-green-600', icon: <Heart className="text-red-500" size={24} /> },
                  { label: 'Active Offers',    value: offers.filter((o) => o.status === 'pending' || o.status === 'countered').length, sub: `Out of ${offers.length} total`, subColor: 'text-gray-600', icon: <FileText className="text-blue-500" size={24} /> },
                  { label: 'Accepted Offers',  value: offers.filter((o) => o.status === 'accepted').length,                sub: 'Ready to proceed', subColor: 'text-gray-600', icon: <CheckCircle className="text-green-500" size={24} /> },
                  { label: 'Notifications',    value: notifications.filter((n) => !n.read).length,                        sub: 'Unread',           subColor: 'text-gray-600', icon: <Bell className="text-orange-500" size={24} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.subColor}`}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Offers */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Recent Offers</h2>
                      <button onClick={() => setActiveTab('offers')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    <div className="space-y-4">
                      {offers.slice(0, 3).map((offer) => {
                        const sc = getOfferStatusConfig(offer.status);
                        const Icon = sc.icon;
                        return (
                          <div
                            key={offer.id}
                            onClick={() => { setSelectedOffer(offer); setActiveTab('offers'); }}
                            className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex gap-4">
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={offer.propertyImage} alt={offer.propertyTitle} className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-gray-900 truncate">{offer.propertyTitle}</h3>
                                  <span className={`ml-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${sc.color}`}>
                                    <Icon size={14} />{sc.label}
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recently Saved */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Recently Saved</h2>
                      <button onClick={() => setActiveTab('favorites')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedProperties.slice(0, 4).map((property) => (
                        <Link
                          key={property.id}
                          href={`/property/${property.id}`}
                          className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                          <div className="relative h-32 overflow-hidden">
                            <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                            {property.hasActiveOffer && (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">
                                Offer Submitted
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-lg font-bold text-blue-600 mb-1">{formatPrice(property.price)}</p>
                            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin size={12} />
                              <span className="line-clamp-1">{property.location}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notifications Panel */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Bell size={20} className="text-blue-600" />
                      Notifications
                    </h2>
                    <button onClick={() => setActiveTab('notifications')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-xl border transition-all cursor-pointer ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'offer_update' ? 'bg-blue-100' :
                            notification.type === 'new_listing'  ? 'bg-green-100' :
                            notification.type === 'price_drop'   ? 'bg-orange-100' :
                            notification.type === 'inspection'   ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Saved Favorites Tab ── */}
          {activeTab === 'favorites' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">You have {savedProperties.length} saved properties</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property) => (
                  <div key={property.id} className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="relative h-56 overflow-hidden">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg">
                        <Heart size={20} className="fill-red-500 text-red-500" />
                      </button>
                      {property.hasActiveOffer && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">
                          Offer Submitted
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-lg flex items-center gap-1">
                        <Clock size={14} />
                        Saved {property.savedDate}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(property.price)}</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin size={16} />
                        <span className="text-sm">{property.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
                        <div className="flex items-center gap-1.5 text-gray-700"><Bed  size={18} className="text-blue-600" /><span className="text-sm font-semibold">{property.bedrooms}</span></div>
                        <div className="flex items-center gap-1.5 text-gray-700"><Bath size={18} className="text-blue-600" /><span className="text-sm font-semibold">{property.bathrooms}</span></div>
                        <div className="flex items-center gap-1.5 text-gray-700"><Square size={18} className="text-blue-600" /><span className="text-sm font-semibold">{property.area}</span></div>
                      </div>
                      <Link href={`/property/${property.id}`} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        View Details <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Offers List Tab ── */}
          {activeTab === 'offers' && !selectedOffer && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">You have submitted {offers.length} offers</p>
              <div className="space-y-4">
                {offers.map((offer) => {
                  const sc = getOfferStatusConfig(offer.status);
                  const Icon = sc.icon;
                  return (
                    <div key={offer.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex gap-4 mb-4">
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={offer.propertyImage} alt={offer.propertyTitle} className="w-full h-full object-cover"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.propertyTitle}</h3>
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Calendar size={16} />
                                <span>Submitted on {offer.submittedDate}</span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border ${sc.color}`}>
                              <Icon size={16} />{sc.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Agent: {offer.agentName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-medium">Current Offer:</span>
                            <span className="text-2xl font-bold text-blue-600">{formatPrice(offer.offerAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => setSelectedOffer(offer)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                          <Eye size={16} /> View Full Details
                        </button>
                        {offer.hasInspectionReport && (
                          <button onClick={() => { setSelectedOffer(offer); setActiveTab('inspection'); }} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <ClipboardCheck size={16} /> View Inspection
                          </button>
                        )}
                        {offer.canRevise && (
                          <button onClick={() => setSelectedOffer(offer)} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                            <Edit3 size={16} /> Revise Offer
                          </button>
                        )}
                        {offer.canWithdraw && (
                          <button onClick={() => handleWithdrawOffer(offer)} className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
                            Withdraw
                          </button>
                        )}
                      </div>

                      {offer.status === 'countered' && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-bold text-purple-900 mb-1">Counter Offer Received</p>
                          <p className="text-sm text-purple-800">Review the agent's counter offer and decide whether to accept, revise, or withdraw.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Offer Detail View ── */}
          {activeTab === 'offers' && selectedOffer && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedOffer(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Offers
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                {/* Property Header */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex gap-6 mb-4">
                    <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                      <img src={selectedOffer.propertyImage} alt={selectedOffer.propertyTitle} className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedOffer.propertyTitle}</h2>
                      <p className="text-gray-600 mb-3">Agent: {selectedOffer.agentName}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-gray-600">Current Offer:</span>
                        <span className="text-3xl font-bold text-blue-600">{formatPrice(selectedOffer.offerAmount)}</span>
                        {(() => {
                          const sc = getOfferStatusConfig(selectedOffer.status);
                          const Icon = sc.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${sc.color}`}>
                              <Icon size={14} />{sc.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Negotiation History */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Negotiation History</h3>
                  <div className="space-y-4">
                    {selectedOffer.rounds.map((round) => (
                      <div key={round.id} className="flex gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${round.actor === 'buyer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {round.actor === 'buyer' ? <Users size={20} /> : <CheckCircle size={20} />}
                        </div>
                        <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-gray-900">
                              {round.actor === 'buyer' ? 'You' : 'Agent'}{' '}
                              {round.action === 'offer' ? 'submitted offer' : round.action === 'counter' ? 'sent counter' : round.action}
                            </p>
                            <p className="text-lg font-bold text-blue-600">{formatPrice(round.amount)}</p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">"{round.message}"</p>
                          <p className="text-xs text-gray-500">{round.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revise Offer Form */}
                {selectedOffer.canRevise && (
                  <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Revise Your Offer</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Revised Amount (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input type="text" placeholder="1,400,000" value={reviseAmount} onChange={(e) => setReviseAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Message to Agent</label>
                        <textarea rows={3} placeholder="Add a message explaining your revised offer..." value={reviseMessage} onChange={(e) => setReviseMessage(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                      </div>
                      <button onClick={() => handleReviseOffer(selectedOffer)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        Submit Revised Offer <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>Note:</strong> You can only have one active offer per property.{' '}
                    {selectedOffer.canWithdraw ? "You can withdraw or revise this offer at any time while it's pending." : 'This offer cannot be modified.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Inspection Report Tab ── */}
          {activeTab === 'inspection' && selectedOffer && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setActiveTab('offers')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to Offers
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Inspection Report</h2>
                  <p className="text-gray-600">{selectedOffer.propertyTitle}</p>
                  <p className="text-sm text-gray-500 mt-1">Inspected on: March 8, 2024</p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900"><strong>Access Granted:</strong> You can view this inspection report because your offer has been accepted.</p>
                  </div>
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
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.rating === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.rating}</span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.severity === 'Low' ? 'bg-blue-100 text-blue-700' : item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.severity}</span>
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
                    <strong>Report Date:</strong> March 8, 2024
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Select Property to Message About</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      onChange={(e) => { const o = offers.find((o) => o.propertyId === parseInt(e.target.value)); setSelectedOffer(o || null); }}
                      value={selectedOffer?.propertyId || ''}
                    >
                      <option value="">Choose a property</option>
                      {offers.map((offer) => (
                        <option key={offer.propertyId} value={offer.propertyId}>
                          {offer.propertyTitle} — Agent: {offer.agentName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedOffer && (
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedOffer.agentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedOffer.agentName}</p>
                        <p className="text-sm text-gray-600">Property Agent</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {selectedOffer ? (
                    mockMessages.filter((msg) => msg.propertyId === selectedOffer.propertyId).map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.sender === 'buyer' ? 'justify-end' : ''}`}>
                        {message.sender === 'agent' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {message.senderName.charAt(0)}
                          </div>
                        )}
                        <div className={`flex-1 ${message.sender === 'buyer' ? 'max-w-md' : ''}`}>
                          <div className={`rounded-2xl p-4 shadow-sm ${message.sender === 'buyer' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className={`text-xs text-gray-500 mt-1 ${message.sender === 'buyer' ? 'text-right mr-1' : 'ml-1'}`}>{message.timestamp}</p>
                        </div>
                        {message.sender === 'buyer' && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold flex-shrink-0">JD</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 font-semibold">Select a property to start messaging</p>
                        <p className="text-sm text-gray-500">Choose a property above to communicate with the agent</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedOffer && (
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); if (messageText.trim()) { console.log('Sending:', messageText); setMessageText(''); } }}>
                      <input type="text" placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Send size={20} /> Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have {notifications.filter((n) => !n.read).length} unread notifications
                </p>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-5 rounded-xl border transition-all ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          notification.type === 'offer_update' ? 'bg-blue-100' :
                          notification.type === 'new_listing'  ? 'bg-green-100' :
                          notification.type === 'price_drop'   ? 'bg-orange-100' :
                          notification.type === 'inspection'   ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 mb-2">{notification.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                        </div>
                        {!notification.read && <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
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