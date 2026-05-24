'use client';

import styles from './owner.module.css';
import React, { useState, useEffect, useCallback } from 'react';
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
  ImagePlus,
  Shield,
} from 'lucide-react';

import {
  listingService,
  type ApiListing,
  type AvailableAgent,
  type ApiListingStatus,
  type ListingType,
  type PropertyType,
} from '@/services/listing.service';
import { offerService } from '@/services/offer.service';
import { inspectionService, type InspectionReportDto } from '@/services/inspection.service';
import { disputeService, type DisputeDto } from '@/services/dispute.service';
import { ApiRequestError } from '@/lib/api-client';
import type { OfferDto } from '@/types';
import { notificationService, type ApiNotification, formatNotificationDate } from '@/services/notification.service';
import { messageService, type MessageThreadDto, type MessageDto } from '@/services/message.service';

// ─────────────────────────── display types ───────────────────────────

type ListingStatus = 'pending_review' | 'corrections_requested' | 'active' | 'under_offer' | 'inactive';
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
  photoUrls: string[];
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
  photoUrls: [],
};

const STATUS_MAP: Record<ApiListingStatus, ListingStatus> = {
  PendingAgentReview: 'pending_review',
  CorrectionsRequested: 'corrections_requested',
  Active: 'active',
  UnderOffer: 'under_offer',
  Suspended: 'inactive',
  Archived: 'inactive',
  Removed: 'inactive',
};

// ─────────────────────────── mock data (offers / notifications) ───────────────────────────

// Offers are loaded dynamically from the API — see listingOffers state


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
    'dashboard' | 'create' | 'manage' | 'offers' | 'inspection' | 'disputes' | 'messages'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activeThread, setActiveThread] = useState<MessageThreadDto | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageDto[]>([]);
  const [threadMessagesLoading, setThreadMessagesLoading] = useState(false);
  const [ownerMsgText, setOwnerMsgText] = useState('');
  const [msgSendLoading, setMsgSendLoading] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  // ── api state
  const [apiListings, setApiListings] = useState<ApiListing[]>([]);
  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── offers state
  const [listingOffers, setListingOffers] = useState<OfferDto[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // ── inspection report state
  const [inspectionListingId, setInspectionListingId] = useState<number | null>(null);
  const [ownerInspectionReport, setOwnerInspectionReport] = useState<InspectionReportDto | null>(null);
  const [ownerReportLoading, setOwnerReportLoading] = useState(false);
  const [ownerReportAvailable, setOwnerReportAvailable] = useState(false);

  // ── disputes state
  const [disputes, setDisputes] = useState<DisputeDto[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeListingId, setDisputeListingId] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSubmitError, setDisputeSubmitError] = useState<string | null>(null);
  const [disputeSubmitSuccess, setDisputeSubmitSuccess] = useState(false);

  // ── form state
  const [editingListingId, setEditingListingId] = useState<number | null>(null);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [photoInput, setPhotoInput] = useState('');
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

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Load offers when navigating to offers tab for a selected listing
  useEffect(() => {
    if (activeTab !== 'offers' || !selectedListing) return;
    setOffersLoading(true);
    offerService.getOffersByListingOwner(selectedListing.id)
      .then(setListingOffers)
      .catch(() => setListingOffers([]))
      .finally(() => setOffersLoading(false));
  }, [activeTab, selectedListing]);

  // Load inspection report when a listing is selected in the inspection tab
  useEffect(() => {
    if (activeTab !== 'inspection' || !inspectionListingId) return;
    setOwnerReportLoading(true);
    setOwnerInspectionReport(null);
    setOwnerReportAvailable(false);
    inspectionService.getOwnerInspectionReport(inspectionListingId)
      .then((report) => { setOwnerInspectionReport(report); setOwnerReportAvailable(true); })
      .catch(() => { setOwnerReportAvailable(false); })
      .finally(() => setOwnerReportLoading(false));
  }, [activeTab, inspectionListingId]);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const data = await messageService.getThreads();
      setThreads(data);
    } catch { /* silently ignore */ }
    finally { setThreadsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') loadThreads();
  }, [activeTab, loadThreads]);

  const loadDisputes = useCallback(async () => {
    setDisputesLoading(true);
    try {
      const data = await disputeService.getMyDisputes();
      setDisputes(data);
    } catch { /* silently ignore */ }
    finally { setDisputesLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'disputes') loadDisputes();
  }, [activeTab, loadDisputes]);

  const handleSelectThread = useCallback(async (thread: MessageThreadDto) => {
    setActiveThread(thread);
    setThreadMessagesLoading(true);
    try {
      const msgs = await messageService.getThreadMessages(thread.threadId);
      setThreadMessages(msgs);
      setThreads((prev) =>
        prev.map((t) => t.threadId === thread.threadId ? { ...t, unreadCount: 0 } : t),
      );
    } catch { /* silently ignore */ }
    finally { setThreadMessagesLoading(false); }
  }, []);

  const handleContactAgent = useCallback(async (listing: Listing) => {
    if (!listing.agentId) return;
    try {
      const thread = await messageService.getOrCreateThread(listing.agentId, listing.id);
      const [data, msgs] = await Promise.all([
        messageService.getThreads(),
        messageService.getThreadMessages(thread.threadId),
      ]);
      setThreads(data);
      setActiveThread(thread);
      setThreadMessages(msgs);
      setActiveTab('messages');
    } catch { /* silently ignore */ }
  }, []);

  const handleSendOwnerMessage = useCallback(async () => {
    if (!activeThread || !ownerMsgText.trim() || !user) return;
    const content = ownerMsgText.trim();
    const recipientId =
      user.userId === activeThread.participantOneId
        ? activeThread.participantTwoId
        : activeThread.participantOneId;
    setMsgSendLoading(true);
    try {
      const msg = await messageService.sendMessage({
        recipientId,
        listingId: activeThread.listingId,
        content,
      });
      setThreadMessages((prev) => [...prev, msg]);
      setOwnerMsgText('');
    } catch { /* silently ignore */ }
    finally { setMsgSendLoading(false); }
  }, [activeThread, ownerMsgText, user]);

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
    } catch { /* silently ignore */ }
  }, []);

  // ── helpers
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getStatusConfig = (status: ListingStatus) => {
    switch (status) {
      case 'active':                return { label: 'Active',                color: 'bg-green-100 text-green-700 border-green-300',    icon: CheckCircle };
      case 'under_offer':           return { label: 'Under Offer',           color: 'bg-purple-100 text-purple-700 border-purple-300', icon: DollarSign };
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
      photoUrls: raw.photos.map((p) => p.photoUrl),
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
          photoUrls: form.photoUrls,
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
          photoUrls: form.photoUrls,
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

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeListingId) { setDisputeSubmitError('Please select a listing.'); return; }
    if (!disputeDescription.trim()) { setDisputeSubmitError('Please enter a description.'); return; }
    setDisputeSubmitting(true);
    setDisputeSubmitError(null);
    setDisputeSubmitSuccess(false);
    try {
      await disputeService.submitDispute({ listingId: parseInt(disputeListingId), description: disputeDescription.trim() });
      setDisputeDescription('');
      setDisputeListingId('');
      setDisputeSubmitSuccess(true);
      await loadDisputes();
    } catch (err) {
      setDisputeSubmitError(err instanceof ApiRequestError ? err.apiError.message : 'Failed to submit dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // ── sidebar
  const sidebarContent = (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-blue-500/30">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
            <img
              src="/images/logo.svg"
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
          { tab: 'dashboard',  icon: <Home size={20} />,           label: 'Dashboard' },
          { tab: 'create',     icon: <Plus size={20} />,           label: 'Create Listing' },
          { tab: 'manage',     icon: <Building size={20} />,       label: 'Manage Listings', count: displayListings.length },
          { tab: 'inspection', icon: <ClipboardCheck size={20} />, label: 'Inspection' },
          { tab: 'disputes',   icon: <Shield size={20} />,         label: 'Disputes',
            count: disputes.filter(d => d.status === 'Open' || d.status === 'UnderReview').length || undefined },
          { tab: 'messages',   icon: <MessageSquare size={20} />,  label: 'Messages',
            count: threads.reduce((s, t) => s + t.unreadCount, 0) || undefined },
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
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="fixed w-80 h-screen overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {activeTab === 'dashboard'  && 'Property Dashboard'}
                    {activeTab === 'create'     && (editingListingId ? 'Edit Listing' : 'Create New Listing')}
                    {activeTab === 'manage'     && 'Manage Listings'}
                    {activeTab === 'offers'     && `Offers — ${selectedListing?.title}`}
                    {activeTab === 'inspection' && (inspectionListingId ? `Inspection — ${displayListings.find(l => l.id === inspectionListingId)?.title ?? ''}` : 'Property Inspection')}
                    {activeTab === 'disputes'   && 'Disputes'}
                    {activeTab === 'messages'   && 'Messages'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate hidden sm:block">
                    {activeTab === 'dashboard' && 'Overview of all your listings and activity'}
                    {activeTab === 'create'    && (editingListingId ? 'Update your listing details and resubmit for review' : 'Add a new property to your portfolio')}
                    {activeTab === 'manage'    && 'Edit and manage your property listings'}
                  </p>
                </div>
              </div>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={22} className="text-gray-700" />
                {notifications.filter((n) => !n.isRead).length > 0 && (
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
                                    {listing.agentId > 0 && (
                                    <button
                                      onClick={() => handleContactAgent(listing)}
                                      className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-1"
                                    >
                                      <MessageSquare size={14} />
                                      Message Agent
                                    </button>
                                  )}
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
                        key={notification.notificationId}
                        onClick={() => handleMarkAsRead(notification.notificationId)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'OfferResponse'     ? 'bg-blue-100 text-blue-600' :
                            notification.type === 'DisputeUpdate'     ? 'bg-red-100 text-red-600' :
                            notification.type === 'AccountDecision'   ? 'bg-green-100 text-green-600' :
                            notification.type === 'ListingStatus'     ? 'bg-green-100 text-green-600' :
                            notification.type === 'InspectionUpdate'  ? 'bg-purple-100 text-purple-600' :
                            notification.type === 'MessageReceived'   ? 'bg-gray-100 text-gray-600' :
                                                                        'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.type === 'OfferResponse'    && <DollarSign size={16} />}
                            {notification.type === 'DisputeUpdate'    && <AlertCircle size={16} />}
                            {notification.type === 'AccountDecision'  && <CheckCircle size={16} />}
                            {notification.type === 'ListingStatus'    && <CheckCircle size={16} />}
                            {notification.type === 'InspectionUpdate' && <ClipboardCheck size={16} />}
                            {notification.type === 'MessageReceived'  && <MessageSquare size={16} />}
                            {notification.type === 'TransactionClosed' && <CheckCircle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600 mb-2">{notification.body}</p>
                            <p className="text-xs text-gray-500">{formatNotificationDate(notification.createdAt)}</p>
                          </div>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">

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

                  {/* Photo URLs */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Property Photos <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <ImagePlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="url"
                          value={photoInput}
                          onChange={(e) => setPhotoInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const url = photoInput.trim();
                              if (url) { setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, url] })); setPhotoInput(''); }
                            }
                          }}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = photoInput.trim();
                          if (!url) return;
                          setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, url] }));
                          setPhotoInput('');
                        }}
                        className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Add Photo
                      </button>
                    </div>
                    {form.photoUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {form.photoUrls.map((url, i) => (
                          <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                            <img
                              src={url}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '';
                                (e.currentTarget.parentElement as HTMLElement).classList.add('flex', 'items-center', 'justify-center');
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, photoUrls: f.photoUrls.filter((_, j) => j !== i) }))}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs truncate">{url}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.photoUrls.length === 0 && (
                      <p className="text-xs text-gray-500">Paste a public image URL and click "Add Photo". You can add multiple photos.</p>
                    )}
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
                    {!editingListingId && agents.length === 0 && (
                      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          No verified agents are available to review your listing. Submission is disabled until at least one agent is verified by the admin.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                      {editingListingId && (
                        <button
                          type="button"
                          onClick={() => { setEditingListingId(null); setForm(initialForm); setFormError(null); setActiveTab('manage'); }}
                          className="w-full sm:w-auto sm:px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || (!editingListingId && agents.length === 0)}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                          : <>{editingListingId ? 'Resubmit for Agent Review' : 'Submit for Agent Review'} <ArrowRight size={20} /></>
                        }
                      </button>
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
                                  onClick={() => handleContactAgent(listing)}
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
                  {offersLoading && (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-blue-600" size={36} />
                    </div>
                  )}

                  {!offersLoading && listingOffers.map((offer) => (
                    <div key={offer.offerId} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {offer.buyerFullName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{offer.buyerFullName}</h3>
                            <p className="text-sm text-gray-600">{offer.submittedAt.split('T')[0]}</p>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-sm text-gray-600 mb-1">Current Offer</p>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatPrice(offer.proposedPrice)}</p>
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border mt-2 ${getOfferStatusColor(offer.status.toLowerCase() as OfferStatus)}`}>
                            {offer.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Round {offer.negotiationRound}</p>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Buyer Message:</p>
                          <p className="text-sm text-gray-600 italic">"{offer.message}"</p>
                        </div>
                      )}

                      {offer.negotiations.length > 0 && (
                        <>
                          <p className="text-sm font-bold text-gray-900 mb-3">Negotiation History</p>
                          <div className="space-y-3">
                            {offer.negotiations.map((neg) => (
                              <div key={neg.negotiationId} className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  neg.actorRole === 'Buyer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                }`}>
                                  {neg.actorRole === 'Buyer' ? <Users size={18} /> : <CheckCircle size={18} />}
                                </div>
                                <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-gray-900">
                                      {neg.actorRole === 'Buyer' ? 'Buyer' : 'Agent'} — {neg.action}
                                    </p>
                                    <p className="text-sm font-bold text-blue-600">{formatPrice(neg.proposedPrice)}</p>
                                  </div>
                                  {neg.message && <p className="text-xs text-gray-600 mb-1">"{neg.message}"</p>}
                                  <p className="text-xs text-gray-500">{new Date(neg.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Note:</strong> Only your assigned agent can accept, decline, or counter offers. Contact {selectedListing.agentName} through the messaging panel for questions.
                        </p>
                      </div>
                    </div>
                  ))}

                  {!offersLoading && listingOffers.length === 0 && (
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
          {activeTab === 'inspection' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Inspection Report</h2>
                  <p className="text-gray-600">View the locked inspection report for your properties under offer.</p>
                </div>

                {/* Listing picker */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Select Property</label>
                  {(() => {
                    const underOfferListings = displayListings.filter(l => l.apiStatus === 'UnderOffer');
                    if (underOfferListings.length === 0) return (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                        <ClipboardCheck className="mx-auto text-blue-400 mb-2" size={32} />
                        <p className="text-blue-900 font-semibold">No properties under offer</p>
                        <p className="text-sm text-blue-800 mt-1">Inspection reports are available once an offer has been accepted on your listing.</p>
                      </div>
                    );
                    return (
                      <select
                        value={inspectionListingId ?? ''}
                        onChange={(e) => setInspectionListingId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Choose a property…</option>
                        {underOfferListings.map((l) => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {inspectionListingId && (
                  <>
                    {ownerReportLoading && (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                      </div>
                    )}

                    {!ownerReportLoading && !ownerReportAvailable && (
                      <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
                        <ClipboardCheck className="mx-auto text-blue-400 mb-3" size={40} />
                        <p className="text-blue-900 font-semibold mb-1">Inspection Report Not Yet Available</p>
                        <p className="text-sm text-blue-800">The report will appear here once the inspector submits and locks it.</p>
                      </div>
                    )}

                    {!ownerReportLoading && ownerReportAvailable && ownerInspectionReport && (() => {
                      const r = ownerInspectionReport;
                      const verdictColor = r.finalVerdict === 'Passed'
                        ? 'bg-green-50 border-green-300'
                        : r.finalVerdict === 'Failed'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-yellow-50 border-yellow-300';
                      const verdictTextColor = r.finalVerdict === 'Passed' ? 'text-green-900' : r.finalVerdict === 'Failed' ? 'text-red-900' : 'text-yellow-900';
                      return (
                        <>
                          {r.finalVerdict && (
                            <div className={`mb-8 p-6 border-2 rounded-xl ${verdictColor}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${r.finalVerdict === 'Passed' ? 'bg-green-500' : r.finalVerdict === 'Failed' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                  <CheckCircle className="text-white" size={24} />
                                </div>
                                <p className={`text-lg font-bold ${verdictTextColor}`}>
                                  {r.finalVerdict === 'PassedWithConditions' ? 'Passed With Conditions' : r.finalVerdict}
                                </p>
                              </div>
                              {r.verdictSubmittedAt && (
                                <p className={`text-sm ${verdictTextColor}`}>Submitted: {new Date(r.verdictSubmittedAt).toLocaleDateString()}</p>
                              )}
                            </div>
                          )}

                          <div className="space-y-4">
                            {r.categories.map((cat) => (
                              <div key={cat.categoryId} className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{cat.categoryName}</h3>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${cat.passFail === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {cat.passFail}
                                    </span>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                      cat.severity === 'Minor' ? 'bg-blue-100 text-blue-700' :
                                      cat.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>{cat.severity}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700">{cat.findings}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>Note:</strong> This report is read-only. Contact your agent through Messages for any questions.
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Disputes Tab ── */}
          {activeTab === 'disputes' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Submit a Dispute
                </h2>

                {disputeSubmitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <p className="text-sm text-green-700 font-semibold">Dispute submitted successfully.</p>
                  </div>
                )}

                {disputeSubmitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-600" />
                    <p className="text-sm text-red-700">{disputeSubmitError}</p>
                  </div>
                )}

                {(() => {
                  const underOfferListings = displayListings.filter(l => l.apiStatus === 'UnderOffer');
                  if (underOfferListings.length === 0) return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                      <Shield className="mx-auto text-blue-400 mb-2" size={32} />
                      <p className="text-blue-900 font-semibold">No eligible listings</p>
                      <p className="text-sm text-blue-800 mt-1">Disputes can only be submitted for listings currently under offer.</p>
                    </div>
                  );
                  return (
                    <form onSubmit={handleSubmitDispute} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Property</label>
                        <select
                          value={disputeListingId}
                          onChange={(e) => { setDisputeListingId(e.target.value); setDisputeSubmitError(null); setDisputeSubmitSuccess(false); }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">Select a property…</option>
                          {underOfferListings.map((l) => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                        <textarea
                          rows={5}
                          value={disputeDescription}
                          onChange={(e) => { setDisputeDescription(e.target.value); setDisputeSubmitError(null); setDisputeSubmitSuccess(false); }}
                          placeholder="Describe the issue in detail…"
                          maxLength={5000}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{disputeDescription.length}/5000</p>
                      </div>
                      <button
                        type="submit"
                        disabled={disputeSubmitting || !disputeListingId || !disputeDescription.trim()}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {disputeSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                        Submit Dispute
                      </button>
                    </form>
                  );
                })()}
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">My Disputes</h2>
                {disputesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : disputes.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-500">No disputes submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((d) => {
                      const statusColor =
                        d.status === 'Resolved'    ? 'bg-green-100 text-green-700 border-green-300' :
                        d.status === 'Escalated'   ? 'bg-red-100 text-red-700 border-red-300' :
                        d.status === 'UnderReview' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                     'bg-blue-100 text-blue-700 border-blue-300';
                      return (
                        <div key={d.disputeId} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-gray-900">Dispute #{d.disputeId}</p>
                              <p className="text-xs text-gray-500 mt-1">Transaction #{d.transactionId} · Submitted {new Date(d.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor}`}>{d.status}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{d.description}</p>
                          {d.resolutionOutcome && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs font-bold text-green-900 mb-1">Resolution</p>
                              <p className="text-sm text-green-800">{d.resolutionOutcome}</p>
                              {d.resolvedAt && <p className="text-xs text-green-700 mt-1">Resolved: {new Date(d.resolvedAt).toLocaleDateString()}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {/* Mobile: single column toggled by activeThread; Desktop: fixed-height two-column */}
          {activeTab === 'messages' && (
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100dvh-180px)]">

              {/* Thread list — full width on mobile when no thread selected, sidebar on desktop */}
              <div className={`${activeThread ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 lg:flex-shrink-0 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden`}>
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" /> Conversations
                  </h2>
                </div>
                <div className={`flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none ${styles.scrollableArea}`}>
                  {threadsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="animate-spin text-blue-600" size={28} />
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center py-10">
                      <MessageSquare className="text-gray-300 mb-3" size={40} />
                      <p className="text-sm text-gray-500 font-medium">No conversations yet.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click "Contact Agent" on a listing to start one.
                      </p>
                    </div>
                  ) : (
                    threads.map((thread) => {
                      const otherName =
                        user?.userId === thread.participantOneId
                          ? thread.participantTwoFullName
                          : thread.participantOneFullName;
                      const isActive = activeThread?.threadId === thread.threadId;
                      return (
                        <button
                          key={thread.threadId}
                          onClick={() => handleSelectThread(thread)}
                          className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                            isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">{otherName}</p>
                            {thread.unreadCount > 0 && (
                              <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-600 font-medium truncate mb-1">
                            {thread.listingTitle}
                          </p>
                          {thread.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {thread.lastMessage.content}
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Message pane — full width on mobile when thread selected, flex-1 on desktop */}
              <div className={`${!activeThread ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden min-h-[400px] lg:min-h-0`}>
                {!activeThread ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <MessageSquare className="text-gray-300 mb-4" size={56} />
                    <p className="text-gray-600 font-semibold">Select a conversation</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Choose a thread on the left to read and reply to messages.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: back to thread list */}
                    <button
                      onClick={() => setActiveThread(null)}
                      className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors font-semibold text-sm flex-shrink-0"
                    >
                      <ChevronRight size={16} className="rotate-180" /> All Conversations
                    </button>

                    {/* Thread header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                      <p className="font-bold text-gray-900">
                        {user?.userId === activeThread.participantOneId
                          ? activeThread.participantTwoFullName
                          : activeThread.participantOneFullName}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">
                        Re: {activeThread.listingTitle}
                      </p>
                    </div>

                    {/* Messages */}
                    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50 ${styles.scrollableArea}`}>
                      {threadMessagesLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="animate-spin text-blue-600" size={28} />
                        </div>
                      ) : threadMessages.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">
                          No messages yet. Say hello!
                        </p>
                      ) : (
                        threadMessages.map((msg) => {
                          const isMine = msg.senderId === user?.userId;
                          return (
                            <div
                              key={msg.messageId}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                                  isMine
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                                }`}
                              >
                                {!isMine && (
                                  <p className="text-xs font-semibold mb-1 text-blue-600">
                                    {msg.senderFullName}
                                  </p>
                                )}
                                <p className="leading-relaxed">{msg.content}</p>
                                <p className={`text-xs mt-1.5 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {new Date(msg.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Send bar */}
                    <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleSendOwnerMessage(); }}
                        className="flex gap-3"
                      >
                        <input
                          type="text"
                          placeholder="Type a message…"
                          value={ownerMsgText}
                          onChange={(e) => setOwnerMsgText(e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          type="submit"
                          disabled={msgSendLoading || !ownerMsgText.trim()}
                          className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {msgSendLoading
                            ? <Loader2 size={18} className="animate-spin" />
                            : <Send size={18} />}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
