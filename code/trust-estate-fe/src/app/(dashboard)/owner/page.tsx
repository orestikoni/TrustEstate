'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/store/auth.context';
import Link from 'next/link';
import {
  Home,
  Plus,
  FileText,
  Settings,
  LogOut,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Menu,
  X,
  Users,
  MessageSquare,
  Bell,
  Send,
  AlertCircle,
  ClipboardCheck,
  ArrowRight,
  Building,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import {
  listingService,
  type ApiListing,
  type AvailableAgent,
  type ApiListingStatus,
  type ListingType,
  type PropertyType,
} from '@/services/listing.service';
import { ApiRequestError } from '@/lib/api-client';

// ─────────────────────────── display types ───────────────────────────

type ListingStatus = 'pending_review' | 'corrections_requested' | 'active' | 'inactive';
type OfferStatus = 'pending' | 'countered' | 'accepted' | 'rejected';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  listingType: 'sale' | 'rent';
  propertyType: string;
  image: string;
  status: ListingStatus;
  apiStatus: ApiListingStatus;
  agentName: string;
  agentId: number;
  createdDate: string;
  lastModified: string;
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

interface ListingForm {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  askingPrice: string;
  listingType: ListingType | '';
  propertyType: PropertyType | '';
  agentId: string;
}

// ─────────────────────────── constants ───────────────────────────

const initialForm: ListingForm = {
  title: '',
  description: '',
  address: '',
  city: '',
  country: '',
  askingPrice: '',
  listingType: '',
  propertyType: '',
  agentId: '',
};

const STATUS_MAP: Record<ApiListingStatus, ListingStatus> = {
  PendingAgentReview: 'pending_review',
  CorrectionsRequested: 'corrections_requested',
  Active: 'active',
  UnderOffer: 'active',
  Suspended: 'inactive',
  Archived: 'inactive',
  Removed: 'inactive',
};

// ─────────────────────────── mock data (offers / notifications) ───────────────────────────

const mockOffers: Offer[] = [
  {
    id: 1,
    listingId: -1,
    buyerName: 'John Smith',
    proposedPrice: 1200000,
    status: 'pending',
    message: 'Very interested in this property. Would like to schedule a viewing.',
    submittedDate: '2024-03-12',
    rounds: [
      { id: 1, actor: 'buyer', action: 'offer', amount: 1200000, message: 'Initial offer, ready to close within 30 days', date: '2024-03-12 10:30 AM' },
    ],
  },
];

const mockNotifications: Notification[] = [
  { id: 1, type: 'offer',      title: 'New Offer Received',         message: 'You received a new offer on one of your listings.',        timestamp: '2 hours ago',   read: false },
  { id: 2, type: 'correction', title: 'Corrections Requested',      message: 'Your agent has requested corrections on a listing.',        timestamp: '1 day ago',     read: false },
  { id: 3, type: 'approval',   title: 'Listing Approved',           message: 'Your listing has been approved and is now live.',           timestamp: '3 days ago',    read: true  },
  { id: 4, type: 'inspection', title: 'Inspection Report Ready',    message: 'The inspection report for your property is now available.', timestamp: '5 days ago',    read: true  },
  { id: 5, type: 'message',    title: 'Message from Agent',         message: 'Your agent sent you a message regarding your listing.',     timestamp: '1 week ago',    read: true  },
];

// ─────────────────────────── mapper ───────────────────────────

function mapApiToDisplay(a: ApiListing, agents: AvailableAgent[]): Listing {
  const agent = agents.find((ag) => ag.userId === a.agentId);
  return {
    id: a.listingId,
    title: a.title,
    description: a.description,
    price: a.askingPrice,
    location: `${a.city}, ${a.country}`,
    listingType: a.listingType.toLowerCase() as 'sale' | 'rent',
    propertyType: a.propertyType,
    image: a.photos[0]?.photoUrl ?? '',
    status: STATUS_MAP[a.status] ?? 'inactive',
    apiStatus: a.status,
    agentName: agent
      ? `${agent.firstName} ${agent.lastName}`
      : a.agentId
        ? `Agent #${a.agentId}`
        : 'Unassigned',
    agentId: a.agentId ?? 0,
    createdDate: a.createdAt,
    lastModified: a.updatedAt,
    hasActiveTransaction: a.status === 'UnderOffer',
    correctionNote: a.correctionNotes ?? undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
//                        COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function OwnerDashboardPage() {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Loading...';
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  // ── tab / ui state
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'create' | 'manage' | 'offers' | 'inspection' | 'messages'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [messageText, setMessageText] = useState('');
  const [notifications, setNotifications] = useState(mockNotifications);

  // ── api state
  const [apiListings, setApiListings] = useState<ApiListing[]>([]);
  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── form state
  const [editingListingId, setEditingListingId] = useState<number | null>(null);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── derived
  const displayListings = apiListings.map((l) => mapApiToDisplay(l, agents));

  // ── data loading
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [listings, agentList] = await Promise.all([
        listingService.getMyListings(),
        listingService.getAgents(),
      ]);
      setApiListings(listings);
      setAgents(agentList);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── helpers
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getStatusConfig = (status: ListingStatus) => {
    switch (status) {
      case 'active':                return { label: 'Active',                color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'pending_review':        return { label: 'Pending Agent Review',  color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'corrections_requested': return { label: 'Corrections Requested', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle };
      case 'inactive':              return { label: 'Inactive',              color: 'bg-gray-100 text-gray-700 border-gray-300',       icon: XCircle };
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

  // ── actions
  const handleRemoveListing = async (listing: Listing) => {
    if (listing.hasActiveTransaction) {
      alert('Cannot remove listing: active transaction in progress. Please contact your agent.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently remove "${listing.title}"?`)) return;
    try {
      await listingService.deleteListing(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      await loadData();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to remove listing.');
    }
  };

  const handleEditListing = (listing: Listing) => {
    const raw = apiListings.find((l) => l.listingId === listing.id);
    if (!raw) return;
    setForm({
      title: raw.title,
      description: raw.description,
      address: raw.address,
      city: raw.city,
      country: raw.country,
      askingPrice: String(raw.askingPrice),
      listingType: raw.listingType,
      propertyType: raw.propertyType,
      agentId: '',
    });
    setEditingListingId(listing.id);
    setFormError(null);
    setActiveTab('create');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.listingType || !form.propertyType) {
      setFormError('Please select a listing type and property type.');
      return;
    }
    const price = parseFloat(form.askingPrice);
    if (isNaN(price) || price <= 0) {
      setFormError('Please enter a valid asking price.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingListingId !== null) {
        await listingService.updateListing(editingListingId, {
          title: form.title,
          description: form.description,
          address: form.address,
          city: form.city,
          country: form.country,
          askingPrice: price,
          listingType: form.listingType as ListingType,
          propertyType: form.propertyType as PropertyType,
          photoUrls: [],
        });
      } else {
        if (!form.agentId) {
          setFormError('Please select an agent.');
          setIsSubmitting(false);
          return;
        }
        await listingService.createListing({
          title: form.title,
          description: form.description,
          address: form.address,
          city: form.city,
          country: form.country,
          askingPrice: price,
          listingType: form.listingType as ListingType,
          propertyType: form.propertyType as PropertyType,
          agentId: parseInt(form.agentId),
          photoUrls: [],
        });
      }
      setForm(initialForm);
      setEditingListingId(null);
      await loadData();
      setActiveTab('manage');
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to save listing. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── sidebar
  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col shadow-2xl">
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

      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard', icon: <Home size={20} />,        label: 'Dashboard' },
          { tab: 'create',    icon: <Plus size={20} />,        label: 'Create Listing' },
          { tab: 'manage',    icon: <Building size={20} />,    label: 'Manage Listings', count: displayListings.length },
          { tab: 'messages',  icon: <MessageSquare size={20} />, label: 'Messages' },
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

      <div className="p-4 border-t border-blue-500/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-white hover:bg-blue-500/30 transition-all">
          <Settings size={20} />
          Settings
        </button>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── loading / error skeleton
  const LoadingState = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="mx-auto text-blue-600 mb-4 animate-spin" size={40} />
        <p className="text-gray-600 font-semibold">Loading your listings…</p>
      </div>
    </div>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
        <p className="text-gray-900 font-semibold mb-2">Failed to load listings</p>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <button
          onClick={loadData}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════
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
                    {activeTab === 'dashboard'  && 'Property Dashboard'}
                    {activeTab === 'create'     && (editingListingId ? 'Edit Listing' : 'Create New Listing')}
                    {activeTab === 'manage'     && 'Manage Listings'}
                    {activeTab === 'offers'     && `Offers — ${selectedListing?.title}`}
                    {activeTab === 'inspection' && `Inspection Report — ${selectedListing?.title}`}
                    {activeTab === 'messages'   && 'Messages'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeTab === 'dashboard' && 'Overview of all your listings and activity'}
                    {activeTab === 'create'    && (editingListingId ? 'Update your listing details and resubmit for review' : 'Add a new property to your portfolio')}
                    {activeTab === 'manage'    && 'Edit and manage your property listings'}
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

                    {isLoading && <LoadingState />}
                    {loadError && <ErrorState message={loadError} />}

                    {!isLoading && !loadError && displayListings.length === 0 && (
                      <div className="text-center py-12">
                        <Building className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 font-semibold">No listings yet</p>
                        <p className="text-sm text-gray-500 mb-4">Create your first listing to get started.</p>
                        <button
                          onClick={() => setActiveTab('create')}
                          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Create Listing
                        </button>
                      </div>
                    )}

                    {!isLoading && !loadError && (
                      <div className="space-y-4">
                        {displayListings.map((listing) => {
                          const statusConfig = getStatusConfig(listing.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <div key={listing.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                              <div className="flex gap-4">
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                  {listing.image ? (
                                    <img src={listing.image} alt={listing.title} className="w-full h-full object-cover"
                                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Building size={32} className="text-gray-400" />
                                    </div>
                                  )}
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
                                    {listing.agentName !== 'Unassigned' && (
                                      <span className="text-xs text-gray-500">Agent: {listing.agentName}</span>
                                    )}
                                  </div>

                                  {listing.status === 'corrections_requested' && listing.correctionNote && (
                                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                      <p className="text-xs font-semibold text-orange-900 mb-1">Correction Note:</p>
                                      <p className="text-xs text-orange-800">{listing.correctionNote}</p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      onClick={() => { setSelectedListing(listing); setActiveTab('messages'); }}
                                      className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-1"
                                    >
                                      <MessageSquare size={14} />
                                      Message Agent
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
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
                          {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Create / Edit Listing Tab ── */}
          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

                {editingListingId && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <p className="text-sm font-semibold text-blue-900">
                      Editing listing — update the details and resubmit for agent review.
                    </p>
                    <button
                      onClick={() => { setEditingListingId(null); setForm(initialForm); setFormError(null); }}
                      className="text-sm text-blue-700 underline ml-4"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}

                {formError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmitForm}>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Property Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={updateForm('title')}
                      placeholder="e.g., Modern Luxury Villa with Ocean Views"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Property Description *</label>
                    <textarea
                      rows={6}
                      value={form.description}
                      onChange={updateForm('description')}
                      placeholder="Provide a detailed description including features, amenities, and unique selling points…"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Street Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={form.address}
                        onChange={updateForm('address')}
                        placeholder="e.g., 123 Sunset Boulevard"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* City / Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">City *</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={updateForm('city')}
                        placeholder="e.g., Los Angeles"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Country *</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={updateForm('country')}
                        placeholder="e.g., United States"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Price / Listing Type / Property Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Asking Price (USD) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.askingPrice}
                          onChange={updateForm('askingPrice')}
                          placeholder="1250000"
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Listing Type *</label>
                      <select
                        value={form.listingType}
                        onChange={updateForm('listingType')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Sale">For Sale</option>
                        <option value="Rent">For Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Property Type *</label>
                      <select
                        value={form.propertyType}
                        onChange={updateForm('propertyType')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Select property type</option>
                        <option value="Apartment">Apartment</option>
                        <option value="House">House</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Land">Land</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Agent (create only) */}
                  {!editingListingId && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Select Agent for Review *</label>
                      {agents.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-3">
                          No verified agents are available at the moment. Please try again later.
                        </p>
                      ) : (
                        <select
                          value={form.agentId}
                          onChange={updateForm('agentId')}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          required
                        >
                          <option value="">Choose an agent</option>
                          {agents.map((agent) => (
                            <option key={agent.userId} value={agent.userId}>
                              {agent.firstName} {agent.lastName}
                              {agent.agencyName ? ` — ${agent.agencyName}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="mt-2 text-sm text-gray-600">
                        The selected agent will review your listing before it goes live.
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Before submitting:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensure all information is accurate and complete</li>
                        <li>• Review your property description for clarity</li>
                        <li>• Verify address details are correct</li>
                      </ul>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                          : <>{editingListingId ? 'Resubmit for Agent Review' : 'Submit for Agent Review'} <ArrowRight size={20} /></>
                        }
                      </button>
                      {editingListingId && (
                        <button
                          type="button"
                          onClick={() => { setEditingListingId(null); setForm(initialForm); setFormError(null); setActiveTab('manage'); }}
                          className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Manage Listings Tab ── */}
          {activeTab === 'manage' && (
            <>
              {isLoading && <LoadingState />}
              {loadError && <ErrorState message={loadError} />}

              {!isLoading && !loadError && displayListings.length === 0 && (
                <div className="text-center py-20">
                  <Building className="mx-auto text-gray-400 mb-4" size={56} />
                  <p className="text-gray-600 font-semibold text-lg mb-2">No listings yet</p>
                  <p className="text-sm text-gray-500 mb-6">Create your first listing to start attracting buyers.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} /> Create Listing
                  </button>
                </div>
              )}

              {!isLoading && !loadError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayListings.map((listing) => {
                    const statusConfig = getStatusConfig(listing.status);
                    const StatusIcon = statusConfig.icon;
                    const canEdit = listing.apiStatus === 'PendingAgentReview' || listing.apiStatus === 'CorrectionsRequested';

                    return (
                      <div key={listing.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                        <div className="relative h-48 overflow-hidden bg-gray-200">
                          {listing.image ? (
                            <img src={listing.image} alt={listing.title} className="w-full h-full object-cover"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border backdrop-blur-sm ${statusConfig.color}`}>
                              <StatusIcon size={14} />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <MapPin size={16} />
                            <span className="text-sm line-clamp-1">{listing.location}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full capitalize">
                              {listing.propertyType}
                            </span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">
                              For {listing.listingType}
                            </span>
                          </div>

                          {listing.agentName !== 'Unassigned' && (
                            <p className="text-xs text-gray-500 mb-4">Agent: {listing.agentName}</p>
                          )}

                          {listing.status === 'corrections_requested' && listing.correctionNote && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-xs font-bold text-orange-900 mb-1">Agent Notes:</p>
                              <p className="text-xs text-orange-800">{listing.correctionNote}</p>
                            </div>
                          )}

                          {listing.apiStatus === 'Active' && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs font-semibold text-blue-900">
                                To edit this listing, please contact your agent through the messaging panel.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            {canEdit ? (
                              <>
                                <button
                                  onClick={() => handleEditListing(listing)}
                                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Edit size={16} />
                                  Edit &amp; Resubmit
                                </button>
                                <button
                                  onClick={() => handleRemoveListing(listing)}
                                  className="w-full py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Trash2 size={16} />
                                  Remove Listing
                                </button>
                              </>
                            ) : listing.apiStatus === 'Active' || listing.apiStatus === 'UnderOffer' ? (
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
            </>
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
              <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
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
                            item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
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
                        const listing = displayListings.find((l) => l.id === parseInt(e.target.value));
                        setSelectedListing(listing ?? null);
                      }}
                      value={selectedListing?.id ?? ''}
                    >
                      <option value="">Choose a listing to message about</option>
                      {displayListings.map((listing) => (
                        <option key={listing.id} value={listing.id}>
                          {listing.title}
                          {listing.agentName !== 'Unassigned' ? ` — Agent: ${listing.agentName}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedListing && selectedListing.agentName !== 'Unassigned' && (
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
                              Hello! I've reviewed your listing. Please use the messaging feature here once messaging is fully connected to the backend.
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-1">Messages coming soon</p>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <div className="flex-1 max-w-md">
                          <div className="bg-blue-600 rounded-2xl rounded-tr-none p-4 shadow-sm">
                            <p className="text-sm text-white">
                              Thank you! I'll be in touch soon.
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 mr-1 text-right">Messages coming soon</p>
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
                        placeholder="Type your message…"
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
