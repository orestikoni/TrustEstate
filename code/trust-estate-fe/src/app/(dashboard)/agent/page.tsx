'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Menu,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Bell,
  Users,
  Calendar,
  Send,
  Clock,
  Eye,
  TrendingUp,
  ChevronRight,
  Award,
  Building,
  Check,
  X as XIcon,
  UserCheck,
} from 'lucide-react';

type ListingStatus = 'pending_assignment' | 'pending_review' | 'corrections_requested' | 'active' | 'under_offer' | 'closed';
type OfferStatus = 'pending' | 'countered' | 'accepted' | 'declined';
type TransactionStatus = 'offer_accepted' | 'inspection_scheduled' | 'inspection_completed' | 'ready_to_close' | 'closed';

interface ListingAssignment {
  id: number;
  listingId: number;
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
  ownerName: string;
  ownerId: number;
  assignmentStatus: 'pending' | 'accepted' | 'declined';
  listingStatus: ListingStatus;
  assignedDate: string;
  correctionNote?: string;
}

interface Offer {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImage: string;
  buyerName: string;
  buyerId: number;
  proposedPrice: number;
  status: OfferStatus;
  message: string;
  submittedDate: string;
  rounds: NegotiationRound[];
  maxRounds: number;
  currentRound: number;
}

interface NegotiationRound {
  id: number;
  actor: 'buyer' | 'agent';
  action: 'offer' | 'counter' | 'accept' | 'decline';
  amount: number;
  message: string;
  date: string;
}

interface PropertyInspector {
  id: number;
  name: string;
  licenseNumber: string;
  verified: boolean;
  rating: number;
  completedInspections: number;
  specialties: string[];
  available: boolean;
  nextAvailableDate: string;
}

interface Transaction {
  id: number;
  listingId: number;
  listingTitle: string;
  buyerName: string;
  ownerName: string;
  offerAmount: number;
  status: TransactionStatus;
  offerAcceptedDate?: string;
  inspectionScheduledDate?: string;
  inspectionCompletedDate?: string;
  estimatedClosingDate?: string;
  canClose: boolean;
}

interface Conversation {
  id: number;
  listingId: number;
  listingTitle: string;
  participantType: 'buyer' | 'owner';
  participantName: string;
  participantId: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Notification {
  id: number;
  type: 'assignment' | 'offer' | 'correction_response' | 'inspection' | 'transaction' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  listingId?: number;
}

const mockAssignments: ListingAssignment[] = [
  {
    id: 1, listingId: 101,
    title: 'Modern Luxury Villa',
    description: 'Stunning modern villa with ocean views and premium amenities',
    price: 1250000, location: 'Beverly Hills, CA', bedrooms: 5, bathrooms: 4, area: 4500,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1759355787092-87e4eee09600?w=600&auto=format&fit=crop',
    images: [], ownerName: 'Robert Chen', ownerId: 1,
    assignmentStatus: 'pending', listingStatus: 'pending_assignment', assignedDate: '2024-03-14',
  },
  {
    id: 2, listingId: 102,
    title: 'Downtown Apartment',
    description: 'Beautiful apartment in the heart of downtown with city views',
    price: 850000, location: 'New York, NY', bedrooms: 3, bathrooms: 2, area: 2200,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&auto=format&fit=crop',
    images: [], ownerName: 'Jennifer Martinez', ownerId: 2,
    assignmentStatus: 'accepted', listingStatus: 'pending_review', assignedDate: '2024-03-10',
  },
  {
    id: 3, listingId: 103,
    title: 'Elegant Villa Estate',
    description: 'Luxurious estate with expansive grounds and premium finishes',
    price: 1850000, location: 'Miami Beach, FL', bedrooms: 6, bathrooms: 5, area: 5200,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1757264119066-2f627c6a6f03?w=600&auto=format&fit=crop',
    images: [], ownerName: 'David Thompson', ownerId: 3,
    assignmentStatus: 'accepted', listingStatus: 'corrections_requested', assignedDate: '2024-03-05',
    correctionNote: 'Please add more interior photos and update the property description to include the new renovations.',
  },
  {
    id: 4, listingId: 104,
    title: 'Beachfront Paradise',
    description: 'Luxury beachfront property with stunning ocean views',
    price: 2100000, location: 'San Diego, CA', bedrooms: 5, bathrooms: 4, area: 4500,
    listingType: 'sale',
    image: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    images: [], ownerName: 'Lisa Anderson', ownerId: 4,
    assignmentStatus: 'accepted', listingStatus: 'active', assignedDate: '2024-02-20',
  },
];

const mockOffers: Offer[] = [
  {
    id: 1, listingId: 104, listingTitle: 'Beachfront Paradise',
    listingImage: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    buyerName: 'John Smith', buyerId: 10, proposedPrice: 2050000, status: 'pending',
    message: 'Very interested in this property. Ready to close within 30 days.',
    submittedDate: '2024-03-14', maxRounds: 3, currentRound: 1,
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer', amount: 2050000, message: 'Initial offer - pre-approved, ready to close quickly', date: '2024-03-14 10:30 AM' },
    ],
  },
  {
    id: 2, listingId: 104, listingTitle: 'Beachfront Paradise',
    listingImage: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    buyerName: 'Emily Rodriguez', buyerId: 11, proposedPrice: 2000000, status: 'countered',
    message: 'Cash buyer, flexible closing date.',
    submittedDate: '2024-03-12', maxRounds: 3, currentRound: 2,
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer',   amount: 1950000, message: 'Initial offer - cash buyer',                               date: '2024-03-12 09:00 AM' },
      { id: 2, actor: 'agent', action: 'counter', amount: 2000000, message: 'Property recently appraised at $2.1M. Counter at $2M.', date: '2024-03-12 02:30 PM' },
    ],
  },
];

const mockInspectors: PropertyInspector[] = [
  { id: 1, name: 'John Smith',      licenseNumber: 'INS-12345-CA', verified: true, rating: 4.9, completedInspections: 487, specialties: ['Residential', 'Luxury Properties', 'Foundation'], available: true,  nextAvailableDate: '2024-03-18' },
  { id: 2, name: 'Maria Garcia',    licenseNumber: 'INS-23456-CA', verified: true, rating: 4.8, completedInspections: 342, specialties: ['Residential', 'Commercial', 'Plumbing'],            available: true,  nextAvailableDate: '2024-03-16' },
  { id: 3, name: 'Robert Johnson',  licenseNumber: 'INS-34567-CA', verified: true, rating: 5.0, completedInspections: 612, specialties: ['Luxury Properties', 'Electrical', 'HVAC'],          available: false, nextAvailableDate: '2024-03-25' },
];

const mockTransactions: Transaction[] = [
  {
    id: 1, listingId: 104, listingTitle: 'Beachfront Paradise',
    buyerName: 'John Smith', ownerName: 'Lisa Anderson',
    offerAmount: 2050000, status: 'offer_accepted',
    offerAcceptedDate: '2024-03-14', canClose: false,
  },
];

const mockConversations: Conversation[] = [
  { id: 1, listingId: 104, listingTitle: 'Beachfront Paradise',    participantType: 'buyer', participantName: 'John Smith',     participantId: 10, lastMessage: 'When can we schedule the inspection?',       lastMessageTime: '2 hours ago',  unreadCount: 2 },
  { id: 2, listingId: 103, listingTitle: 'Elegant Villa Estate',   participantType: 'owner', participantName: 'David Thompson', participantId: 3,  lastMessage: "I've uploaded the new photos you requested.", lastMessageTime: '5 hours ago',  unreadCount: 1 },
];

const mockNotifications: Notification[] = [
  { id: 1, type: 'assignment',          title: 'New Listing Assignment',  message: 'Robert Chen has requested you to review Modern Luxury Villa',             timestamp: '1 hour ago',  read: false, listingId: 101 },
  { id: 2, type: 'offer',               title: 'New Offer Received',      message: 'John Smith submitted an offer of $2,050,000 for Beachfront Paradise',     timestamp: '3 hours ago', read: false, listingId: 104 },
  { id: 3, type: 'correction_response', title: 'Corrections Submitted',   message: 'David Thompson has resubmitted Elegant Villa Estate with corrections',     timestamp: '5 hours ago', read: false, listingId: 103 },
];

export default function AgentDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'assignments' | 'listings' | 'offers' | 'transactions' | 'messages' | 'notifications'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingAssignment | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getListingStatusConfig = (status: ListingStatus) => {
    switch (status) {
      case 'pending_assignment':    return { label: 'Pending Assignment',   color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'pending_review':        return { label: 'Pending Review',        color: 'bg-blue-100 text-blue-700 border-blue-300',       icon: Eye };
      case 'corrections_requested': return { label: 'Corrections Requested', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle };
      case 'active':                return { label: 'Active',                color: 'bg-green-100 text-green-700 border-green-300',    icon: CheckCircle };
      case 'under_offer':           return { label: 'Under Offer',           color: 'bg-purple-100 text-purple-700 border-purple-300', icon: FileText };
      case 'closed':                return { label: 'Closed',                color: 'bg-gray-100 text-gray-700 border-gray-300',       icon: XCircle };
    }
  };

  const getOfferStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'countered': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'accepted':  return 'bg-green-100 text-green-700 border-green-300';
      case 'declined':  return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getTransactionStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'offer_accepted':        return { label: 'Offer Accepted',        color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'inspection_scheduled':  return { label: 'Inspection Scheduled',  color: 'bg-blue-100 text-blue-700 border-blue-300',      icon: Calendar };
      case 'inspection_completed':  return { label: 'Inspection Completed',  color: 'bg-purple-100 text-purple-700 border-purple-300',icon: ClipboardCheck };
      case 'ready_to_close':        return { label: 'Ready to Close',        color: 'bg-orange-100 text-orange-700 border-orange-300',icon: AlertCircle };
      case 'closed':                return { label: 'Closed',                color: 'bg-gray-100 text-gray-700 border-gray-300',      icon: XCircle };
    }
  };

  const resetTabs = () => { setSelectedListing(null); setSelectedOffer(null); };

  const handleAcceptAssignment   = (a: ListingAssignment) => console.log('Accepting assignment:', a.id);
  const handleDeclineAssignment  = (a: ListingAssignment) => { if (window.confirm(`Decline "${a.title}"?`)) console.log('Declining:', a.id); };
  const handleApproveListing     = (l: ListingAssignment) => console.log('Approving listing:', l.id);
  const handleRequestCorrections = (l: ListingAssignment) => { if (!correctionNote) { alert('Please provide a correction note.'); return; } console.log('Corrections:', { listingId: l.id, note: correctionNote }); setCorrectionNote(''); };
  const handleAcceptOffer        = (o: Offer) => { if (window.confirm(`Accept offer of ${formatPrice(o.proposedPrice)} from ${o.buyerName}?`)) console.log('Accepting offer:', o.id); };
  const handleDeclineOffer       = (o: Offer) => { if (window.confirm(`Decline offer from ${o.buyerName}?`)) console.log('Declining offer:', o.id); };
  const handleCounterOffer       = (o: Offer) => { if (!counterAmount || !counterMessage) { alert('Please provide both counter amount and message.'); return; } if (o.currentRound >= o.maxRounds) { alert('Maximum negotiation rounds reached.'); return; } console.log('Counter offer:', { offerId: o.id, amount: counterAmount, message: counterMessage }); setCounterAmount(''); setCounterMessage(''); };
  const handleAssignInspector    = (i: PropertyInspector, date: string) => { console.log('Assigning inspector:', { inspectorId: i.id, date }); setShowInspectorModal(false); };
  const handleCloseTransaction   = (t: Transaction) => { if (!t.canClose) { alert('Transaction cannot be closed yet.'); return; } if (window.confirm(`Close transaction for "${t.listingTitle}"?`)) console.log('Closing transaction:', t.id); };

  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-blue-500/30">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-lg">
            <img src="/images/logo.png" alt="TrustEstate" className="w-10 h-10 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          </div>
          <div>
            <p className="font-bold text-white text-lg">TrustEstate</p>
            <p className="text-xs text-blue-200">Agent Portal</p>
          </div>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">SA</div>
          <div>
            <p className="font-bold text-white">Sarah Anderson</p>
            <p className="text-sm text-blue-200">sarah.a@email.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 rounded-lg">
          <Award className="text-yellow-400" size={16} />
          <span className="text-sm text-white font-medium">Verified Agent</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',     icon: <Home size={20} />,          label: 'Dashboard' },
          { tab: 'assignments',   icon: <UserCheck size={20} />,     label: 'Assignments',
            count: mockAssignments.filter(a => a.assignmentStatus === 'pending').length,
            countColor: 'bg-yellow-500' },
          { tab: 'listings',      icon: <Building size={20} />,      label: 'Listing Review',
            count: mockAssignments.filter(a => a.assignmentStatus === 'accepted').length },
          { tab: 'offers',        icon: <FileText size={20} />,      label: 'Offer Management',
            count: mockOffers.length },
          { tab: 'transactions',  icon: <ClipboardCheck size={20} />,label: 'Transactions' },
          { tab: 'messages',      icon: <MessageSquare size={20} />, label: 'Messages',
            count: mockConversations.reduce((s, c) => s + c.unreadCount, 0),
            countColor: 'bg-red-500' },
          { tab: 'notifications', icon: <Bell size={20} />,          label: 'Notifications',
            count: mockNotifications.filter(n => !n.read).length,
            countColor: 'bg-red-500' },
        ].map(({ tab, icon, label, count, countColor }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as typeof activeTab); resetTabs(); }}
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

      {/* Bottom */}
      <div className="p-4 border-t border-blue-500/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-white hover:bg-blue-500/30 transition-all">
          <Settings size={20} /> Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={20} /> Sign Out
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
        <div className="fixed w-80 h-screen overflow-y-auto"><Sidebar /></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu size={24} className="text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'dashboard'    && 'Agent Dashboard'}
                  {activeTab === 'assignments'  && 'Assignment Requests'}
                  {activeTab === 'listings'     && (selectedListing ? `Review — ${selectedListing.title}` : 'Listing Review')}
                  {activeTab === 'offers'       && (selectedOffer ? `Offer Details — ${selectedOffer.listingTitle}` : 'Offer Management')}
                  {activeTab === 'transactions' && 'Transaction Management'}
                  {activeTab === 'messages'     && 'Messages'}
                  {activeTab === 'notifications'&& 'Notifications'}
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {activeTab === 'dashboard'   && 'Overview of your assigned listings and activity'}
                  {activeTab === 'assignments' && 'Accept or decline listing assignments'}
                  {activeTab === 'listings'    && !selectedListing && 'Review and approve property listings'}
                  {activeTab === 'offers'      && !selectedOffer   && 'Manage offers on your assigned listings'}
                </p>
              </div>
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
                  { label: 'Pending Assignments', value: mockAssignments.filter(a => a.assignmentStatus === 'pending').length,                           sub: 'Awaiting response', icon: <UserCheck className="text-yellow-500" size={24} /> },
                  { label: 'Active Listings',     value: mockAssignments.filter(a => a.listingStatus === 'active').length,                              sub: `Total: ${mockAssignments.filter(a => a.assignmentStatus === 'accepted').length}`, icon: <Building className="text-green-500" size={24} /> },
                  { label: 'Pending Offers',      value: mockOffers.filter(o => o.status === 'pending' || o.status === 'countered').length,             sub: 'Require action',    icon: <FileText className="text-blue-500" size={24} /> },
                  { label: 'Active Transactions', value: mockTransactions.filter(t => t.status !== 'closed').length,                                   sub: 'In progress',       icon: <ClipboardCheck className="text-purple-500" size={24} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.sub}</p>
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
                      {mockOffers.slice(0, 3).map((offer) => (
                        <div key={offer.id} onClick={() => { setSelectedOffer(offer); setActiveTab('offers'); }}
                          className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img src={offer.listingImage} alt={offer.listingTitle} className="w-full h-full object-cover"
                                onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-gray-900">{offer.listingTitle}</h3>
                                <span className={`ml-3 px-3 py-1 text-xs font-bold rounded-full border ${getOfferStatusColor(offer.status)}`}>
                                  {offer.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">From: {offer.buyerName}</p>
                              <div className="flex items-center gap-2">
                                <DollarSign size={16} className="text-blue-600" />
                                <span className="font-bold text-blue-600">{formatPrice(offer.proposedPrice)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Reviews */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
                      <button onClick={() => setActiveTab('listings')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    <div className="space-y-4">
                      {mockAssignments.filter(a => a.listingStatus === 'pending_review' || a.listingStatus === 'corrections_requested').slice(0, 2).map((listing) => {
                        const sc = getListingStatusConfig(listing.listingStatus);
                        const Icon = sc.icon;
                        return (
                          <div key={listing.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex gap-4">
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={listing.image} alt={listing.title} className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 mb-1">{listing.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">Owner: {listing.ownerName}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${sc.color}`}>
                                  <Icon size={14} />{sc.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notifications Panel */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Bell size={20} className="text-blue-600" /> Notifications
                    </h2>
                    <button onClick={() => setActiveTab('notifications')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {mockNotifications.slice(0, 5).map((n) => (
                      <div key={n.id} className={`p-3 rounded-xl border cursor-pointer ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${n.type === 'assignment' ? 'bg-yellow-100' : n.type === 'offer' ? 'bg-blue-100' : n.type === 'correction_response' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            {n.type === 'assignment'          && <UserCheck   size={16} className="text-yellow-600" />}
                            {n.type === 'offer'               && <FileText    size={16} className="text-blue-600" />}
                            {n.type === 'correction_response' && <AlertCircle size={16} className="text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{n.title}</p>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-500">{n.timestamp}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Assignments Tab ── */}
          {activeTab === 'assignments' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">
                You have {mockAssignments.filter(a => a.assignmentStatus === 'pending').length} pending assignment requests
              </p>
              <div className="space-y-6">
                {mockAssignments.filter(a => a.assignmentStatus === 'pending').map((assignment) => (
                  <div key={assignment.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex gap-6 mb-4">
                      <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                        <img src={assignment.image} alt={assignment.title} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-gray-600"><MapPin size={16} /><span className="text-sm">{assignment.location}</span></div>
                          <div className="flex items-center gap-2"><span className="text-sm text-gray-600">Owner:</span><span className="text-sm font-semibold text-gray-900">{assignment.ownerName}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-gray-700"><Bed    size={18} className="text-blue-600" /><span className="text-sm font-semibold">{assignment.bedrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Bath   size={18} className="text-blue-600" /><span className="text-sm font-semibold">{assignment.bathrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Square size={18} className="text-blue-600" /><span className="text-sm font-semibold">{assignment.area} sq ft</span></div>
                          <div className="ml-auto"><p className="text-2xl font-bold text-blue-600">{formatPrice(assignment.price)}</p></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-4">Requested on: {assignment.assignedDate}</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleAcceptAssignment(assignment)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                          <Check size={20} /> Accept Assignment
                        </button>
                        <button onClick={() => handleDeclineAssignment(assignment)} className="flex-1 py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                          <XIcon size={20} /> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {mockAssignments.filter(a => a.assignmentStatus === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 font-semibold">No pending assignments</p>
                    <p className="text-sm text-gray-500">New assignment requests will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Listing Review List ── */}
          {activeTab === 'listings' && !selectedListing && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">
                You have {mockAssignments.filter(a => a.assignmentStatus === 'accepted').length} assigned listings
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAssignments.filter(a => a.assignmentStatus === 'accepted').map((listing) => {
                  const sc = getListingStatusConfig(listing.listingStatus);
                  const Icon = sc.icon;
                  return (
                    <div key={listing.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                      <div className="relative h-48 overflow-hidden">
                        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border backdrop-blur-sm ${sc.color}`}>
                            <Icon size={14} />{sc.label}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-4"><MapPin size={16} /><span className="text-sm line-clamp-1">{listing.location}</span></div>
                        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
                          <div className="flex items-center gap-1.5 text-gray-700"><Bed    size={18} className="text-blue-600" /><span className="text-sm font-semibold">{listing.bedrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Bath   size={18} className="text-blue-600" /><span className="text-sm font-semibold">{listing.bathrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Square size={18} className="text-blue-600" /><span className="text-sm font-semibold">{listing.area}</span></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Owner: {listing.ownerName}</p>
                        <button onClick={() => setSelectedListing(listing)} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <Eye size={18} /> Review Listing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Listing Detail Review ── */}
          {activeTab === 'listings' && selectedListing && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedListing(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Listings
              </button>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedListing.title}</h2>
                      <p className="text-gray-600 mb-3">{selectedListing.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Owner:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedListing.ownerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600 mb-2">{formatPrice(selectedListing.price)}</p>
                      {(() => {
                        const sc = getListingStatusConfig(selectedListing.listingStatus);
                        const Icon = sc.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${sc.color}`}>
                            <Icon size={14} />{sc.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-gray-600"><MapPin size={16} /><span className="text-sm">{selectedListing.location}</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Bed    size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedListing.bedrooms} Bedrooms</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Bath   size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedListing.bathrooms} Bathrooms</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Square size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedListing.area} sq ft</span></div>
                  </div>
                </div>

                {selectedListing.listingStatus === 'corrections_requested' && selectedListing.correctionNote && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm font-bold text-orange-900 mb-2">Previous Correction Request:</p>
                    <p className="text-sm text-orange-800">{selectedListing.correctionNote}</p>
                  </div>
                )}

                {(selectedListing.listingStatus === 'pending_review' || selectedListing.listingStatus === 'corrections_requested') && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Request Corrections (Optional)</label>
                      <textarea rows={4} placeholder="Describe what needs to be corrected or improved..." value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleApproveListing(selectedListing)} className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle size={20} /> Approve & Make Active
                      </button>
                      <button onClick={() => handleRequestCorrections(selectedListing)} disabled={!correctionNote}
                        className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <AlertCircle size={20} /> Request Corrections
                      </button>
                    </div>
                  </div>
                )}

                {selectedListing.listingStatus === 'active' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-bold text-green-900 mb-1">Listing is Active</p>
                    <p className="text-sm text-green-800">This listing is currently live and visible to buyers.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Offers List ── */}
          {activeTab === 'offers' && !selectedOffer && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">You have {mockOffers.length} offers to manage</p>
              <div className="space-y-4">
                {mockOffers.map((offer) => (
                  <div key={offer.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex gap-4 mb-4">
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={offer.listingImage} alt={offer.listingTitle} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.listingTitle}</h3>
                            <p className="text-sm text-gray-600">From: {offer.buyerName}</p>
                          </div>
                          <span className={`px-4 py-2 text-sm font-bold rounded-xl border ${getOfferStatusColor(offer.status)}`}>
                            {offer.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-600">Offer Amount:</span>
                          <span className="text-2xl font-bold text-blue-600">{formatPrice(offer.proposedPrice)}</span>
                        </div>
                        <p className="text-sm text-gray-600">Round {offer.currentRound} of {offer.maxRounds}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedOffer(offer)} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      View Full Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Offer Detail ── */}
          {activeTab === 'offers' && selectedOffer && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedOffer(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Offers
              </button>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex gap-6 mb-4">
                    <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                      <img src={selectedOffer.listingImage} alt={selectedOffer.listingTitle} className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedOffer.listingTitle}</h2>
                      <p className="text-gray-600 mb-3">Buyer: {selectedOffer.buyerName}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-gray-600">Current Offer:</span>
                        <span className="text-3xl font-bold text-blue-600">{formatPrice(selectedOffer.proposedPrice)}</span>
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getOfferStatusColor(selectedOffer.status)}`}>
                          {selectedOffer.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Negotiation Round: {selectedOffer.currentRound} of {selectedOffer.maxRounds}</p>
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
                              {round.actor === 'buyer' ? 'Buyer' : 'Agent (You)'}{' '}
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

                {/* Counter Offer Form */}
                {(selectedOffer.status === 'pending' || selectedOffer.status === 'countered') && (
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="text-lg font-bold text-blue-900 mb-4">Counter Offer</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Counter Amount (USD)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="2,100,000" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Message to Buyer</label>
                          <textarea rows={3} placeholder="Explain your counter offer..." value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => handleAcceptOffer(selectedOffer)} className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle size={20} /> Accept Offer
                      </button>
                      <button onClick={() => handleCounterOffer(selectedOffer)} className="py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                        <TrendingUp size={20} /> Send Counter
                      </button>
                      <button onClick={() => handleDeclineOffer(selectedOffer)} className="py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <XCircle size={20} /> Decline Offer
                      </button>
                    </div>
                  </div>
                )}

                {selectedOffer.status === 'accepted' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-bold text-green-900 mb-1">Offer Accepted</p>
                    <p className="text-sm text-green-800">This offer has been accepted. Proceed to assign an inspector and manage the transaction.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Transactions Tab ── */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have {mockTransactions.length} active transaction{mockTransactions.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-6">
                  {mockTransactions.map((transaction) => {
                    const sc = getTransactionStatusConfig(transaction.status);
                    const Icon = sc.icon;
                    return (
                      <div key={transaction.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{transaction.listingTitle}</h3>
                            <p className="text-sm text-gray-600">Buyer: {transaction.buyerName}</p>
                            <p className="text-sm text-gray-600">Owner: {transaction.ownerName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-gray-600">Sale Amount:</span>
                              <span className="text-xl font-bold text-blue-600">{formatPrice(transaction.offerAmount)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${sc.color}`}>
                            <Icon size={14} />{sc.label}
                          </span>
                        </div>

                        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Transaction Progress</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="text-green-600" size={18} />
                              <span className="text-sm text-gray-700">Offer Accepted — {transaction.offerAcceptedDate}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {transaction.inspectionScheduledDate ? <CheckCircle className="text-green-600" size={18} /> : <Clock className="text-gray-400" size={18} />}
                              <span className="text-sm text-gray-700">Inspection {transaction.inspectionScheduledDate ? `Scheduled — ${transaction.inspectionScheduledDate}` : 'Pending'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {transaction.inspectionCompletedDate ? <CheckCircle className="text-green-600" size={18} /> : <Clock className="text-gray-400" size={18} />}
                              <span className="text-sm text-gray-700">Inspection {transaction.inspectionCompletedDate ? `Completed — ${transaction.inspectionCompletedDate}` : 'Pending'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {!transaction.inspectionScheduledDate && (
                            <button onClick={() => { setSelectedTransaction(transaction); setShowInspectorModal(true); }}
                              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                              <Calendar size={18} /> Assign Inspector
                            </button>
                          )}
                          {transaction.canClose && (
                            <button onClick={() => handleCloseTransaction(transaction)}
                              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                              <CheckCircle size={18} /> Close Transaction
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspector Modal */}
              {showInspectorModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Assign Property Inspector</h2>
                        <button onClick={() => setShowInspectorModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <X size={24} />
                        </button>
                      </div>
                      <p className="text-gray-600 mt-2">Select a verified inspector for: {selectedTransaction.listingTitle}</p>
                    </div>
                    <div className="p-6 space-y-4">
                      {mockInspectors.map((inspector) => (
                        <div key={inspector.id} className={`p-6 rounded-xl border-2 transition-all ${inspector.available ? 'border-gray-200 hover:border-blue-500 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{inspector.name}</h3>
                                {inspector.verified && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                    <CheckCircle size={14} /><span className="text-xs font-bold">Verified</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">License: {inspector.licenseNumber}</p>
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1"><span className="text-yellow-500">★</span><span className="text-sm font-semibold text-gray-900">{inspector.rating}</span></div>
                                <span className="text-sm text-gray-600">{inspector.completedInspections} inspections</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {inspector.specialties.map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              {inspector.available
                                ? <><p className="text-sm text-gray-600 mb-2">Next Available:</p><p className="text-sm font-bold text-green-600">{inspector.nextAvailableDate}</p></>
                                : <p className="text-sm font-bold text-red-600">Not Available</p>
                              }
                            </div>
                          </div>
                          {inspector.available && (
                            <button onClick={() => handleAssignInspector(inspector, inspector.nextAvailableDate)}
                              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                              Assign Inspector
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversation List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Conversations</h2>
                  <div className="space-y-2">
                    {mockConversations.map((conv) => (
                      <div key={conv.id} onClick={() => setSelectedConversation(conv)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{conv.participantName}</p>
                            <p className="text-xs text-gray-600 truncate">{conv.listingTitle}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-500">{conv.lastMessageTime}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    {selectedConversation ? (
                      <>
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {selectedConversation.participantName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{selectedConversation.participantName}</p>
                              <p className="text-sm text-gray-600">{selectedConversation.participantType === 'buyer' ? 'Buyer' : 'Property Owner'} — {selectedConversation.listingTitle}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {selectedConversation.participantName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-2xl rounded-tl-none p-4 border border-gray-200 shadow-sm">
                                <p className="text-sm text-gray-900">{selectedConversation.lastMessage}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-1">{selectedConversation.lastMessageTime}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 bg-white">
                          <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); if (messageText.trim()) { console.log('Sending:', messageText); setMessageText(''); } }}>
                            <input type="text" placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)}
                              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                              <Send size={20} /> Send
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-600 font-semibold">Select a conversation</p>
                          <p className="text-sm text-gray-500">Choose a conversation to start messaging</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have {mockNotifications.filter(n => !n.read).length} unread notifications
                </p>
                <div className="space-y-3">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className={`p-5 rounded-xl border transition-all ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${n.type === 'assignment' ? 'bg-yellow-100' : n.type === 'offer' ? 'bg-blue-100' : n.type === 'correction_response' ? 'bg-orange-100' : n.type === 'inspection' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          {n.type === 'assignment'          && <UserCheck   size={16} className="text-yellow-600" />}
                          {n.type === 'offer'               && <FileText    size={16} className="text-blue-600" />}
                          {n.type === 'correction_response' && <AlertCircle size={16} className="text-orange-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 mb-2">{n.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                          <p className="text-xs text-gray-500">{n.timestamp}</p>
                        </div>
                        {!n.read && <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
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