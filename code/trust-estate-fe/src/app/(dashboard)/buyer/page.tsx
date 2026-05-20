'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService, type ApiNotification, formatNotificationDate } from '@/services/notification.service';
import { authService } from '@/services/auth.service';
import { tokenStorage, ApiRequestError } from '@/lib/api-client';
import { offerService } from '@/services/offer.service';
import { listingService, type ApiListing } from '@/services/listing.service';
import { messageService, type MessageThreadDto, type MessageDto } from '@/services/message.service';
import type { User, OfferDto, PostInspectionOptionsDto } from '@/types';
import { PostInspectionPanel } from '@/components/shared/PostInspectionPanel';
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
  Loader2,
} from 'lucide-react';

// ─── Local display types ──────────────────────────────────────────────────────

type DisplayOfferStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'withdrawn' | 'expired' | 'closed';

interface NegotiationRound {
  id: number;
  actor: 'buyer' | 'agent';
  action: string;
  amount: number;
  message: string;
  date: string;
}

interface Offer {
  id: number;
  listingId: number;
  agentId: number | null;
  propertyTitle: string;
  propertyImage: string;
  offerAmount: number;
  status: DisplayOfferStatus;
  submittedDate: string;
  message: string;
  negotiationRound: number;
  responseDeadline: string | null;
  rounds: NegotiationRound[];
  canRevise: boolean;
  canWithdraw: boolean;
  canAcceptCounter: boolean;
  canDeclineCounter: boolean;
  postInspectionOptions?: PostInspectionOptionsDto;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapApiStatus(s: string): DisplayOfferStatus {
  const map: Record<string, DisplayOfferStatus> = {
    Pending: 'pending',
    Countered: 'countered',
    Accepted: 'accepted',
    Declined: 'declined',
    Withdrawn: 'withdrawn',
    Expired: 'expired',
    Closed: 'closed',
  };
  return map[s] ?? 'pending';
}

function mapOfferDto(dto: OfferDto, listing?: ApiListing): Offer {
  const status = mapApiStatus(dto.status);
  return {
    id: dto.offerId,
    listingId: dto.listingId,
    agentId: listing?.agentId ?? null,
    propertyTitle: listing?.title ?? `Listing #${dto.listingId}`,
    propertyImage: listing?.photos[0]?.photoUrl ?? '',
    offerAmount: dto.proposedPrice,
    status,
    submittedDate: dto.submittedAt.split('T')[0],
    message: dto.message ?? '',
    negotiationRound: dto.negotiationRound,
    responseDeadline: dto.responseDeadline,
    rounds: dto.negotiations.map((n) => ({
      id: n.negotiationId,
      actor: n.actorRole.toLowerCase() as 'buyer' | 'agent',
      action: n.action.toLowerCase(),
      amount: n.proposedPrice,
      message: n.message ?? '',
      date: n.createdAt,
    })),
    canWithdraw: status === 'pending',
    canRevise: status === 'countered',
    canAcceptCounter: status === 'countered',
    canDeclineCounter: status === 'countered',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuyerDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'favorites' | 'offers' | 'messages' | 'notifications' | 'browse'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  // Messages state
  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activeThread, setActiveThread] = useState<MessageThreadDto | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageDto[]>([]);
  const [threadMessagesLoading, setThreadMessagesLoading] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [messageSendLoading, setMessageSendLoading] = useState(false);
  const [reviseAmount, setReviseAmount] = useState('');
  const [reviseMessage, setReviseMessage] = useState('');
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [postInspectionLoading, setPostInspectionLoading] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<ApiListing[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Browse listings state
  const [browseListings, setBrowseListings] = useState<ApiListing[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);


  useEffect(() => {
    authService.me().then(setCurrentUser).catch(() => {});
  }, []);

  // ── Load offers ────────────────────────────────────────────────────────────

  const loadOffers = useCallback(async () => {
    setOffersLoading(true);
    setOffersError(null);
    try {
      const dtos = await offerService.getMyOffers();
      // Fetch listing details for unique listing IDs
      const uniqueListingIds = [...new Set(dtos.map((d) => d.listingId))];
      const listingMap = new Map<number, ApiListing>();
      await Promise.allSettled(
        uniqueListingIds.map(async (id) => {
          try {
            const listing = await listingService.getListing(id);
            listingMap.set(id, listing);
          } catch { /* listing details unavailable */ }
        }),
      );
      setOffers(dtos.map((d) => mapOfferDto(d, listingMap.get(d.listingId))));
    } catch (err) {
      setOffersError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load offers.',
      );
    } finally {
      setOffersLoading(false);
    }
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  // ── Load favorites ─────────────────────────────────────────────────────────

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const data = await listingService.getFavorites();
      setFavorites(data);
    } catch { /* silently ignore */ }
    finally { setFavoritesLoading(false); }
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  // ── Load active listings (Browse tab) ──────────────────────────────────────

  const loadBrowseListings = useCallback(async () => {
    setBrowseLoading(true);
    setBrowseError(null);
    try {
      const result = await listingService.getActiveListings({ pageSize: 20 });
      setBrowseListings(result.items);
    } catch (err) {
      setBrowseError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load listings.',
      );
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') loadBrowseListings();
  }, [activeTab, loadBrowseListings]);

  // ── Messages ───────────────────────────────────────────────────────────────

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

  const handleSelectThread = useCallback(async (thread: MessageThreadDto) => {
    setActiveThread(thread);
    setThreadMessagesLoading(true);
    try {
      const msgs = await messageService.getThreadMessages(thread.threadId);
      setThreadMessages(msgs);
      // Refresh threads to reset unread count
      setThreads((prev) =>
        prev.map((t) => t.threadId === thread.threadId ? { ...t, unreadCount: 0 } : t),
      );
    } catch { /* silently ignore */ }
    finally { setThreadMessagesLoading(false); }
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newMessageText.trim()) return;
    const content = newMessageText.trim();
    const recipientId =
      currentUser?.userId === activeThread.participantOneId
        ? activeThread.participantTwoId
        : activeThread.participantOneId;
    setMessageSendLoading(true);
    try {
      const msg = await messageService.sendMessage({
        recipientId,
        listingId: activeThread.listingId,
        content,
      });
      setThreadMessages((prev) => [...prev, msg]);
      setNewMessageText('');
    } catch { /* silently ignore */ }
    finally { setMessageSendLoading(false); }
  }, [activeThread, newMessageText, currentUser]);

  const handleMessageAgent = useCallback(async (offer: Offer) => {
    if (!offer.agentId) return;
    try {
      const thread = await messageService.getOrCreateThread(offer.agentId, offer.listingId);
      const [data, msgs] = await Promise.all([
        messageService.getThreads(),
        messageService.getThreadMessages(thread.threadId),
      ]);
      setThreads(data);
      setActiveThread(thread);
      setThreadMessages(msgs);
      setSelectedOffer(null);
      setActiveTab('messages');
    } catch { /* silently ignore */ }
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n)),
      );
    } catch { /* silently ignore */ }
  }, []);

  const handleSignOut = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    tokenStorage.clear();
    router.push('/');
  }, [router]);

  // ── Offer actions ──────────────────────────────────────────────────────────

  const handleWithdrawOffer = useCallback(async (offer: Offer) => {
    if (!window.confirm(`Withdraw your offer on "${offer.propertyTitle}"?`)) return;
    setActionLoading(true);
    try {
      await offerService.withdrawOffer(offer.id);
      await loadOffers();
      setSelectedOffer(null);
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to withdraw offer.');
    } finally {
      setActionLoading(false);
    }
  }, [loadOffers]);

  const handleReviseOffer = useCallback(async (offer: Offer) => {
    const price = parseFloat(reviseAmount.replace(/,/g, ''));
    if (isNaN(price) || price <= 0) { alert('Please enter a valid revised amount.'); return; }
    setActionLoading(true);
    try {
      await offerService.submitRevisedOffer(offer.id, { revisedPrice: price, message: reviseMessage || undefined });
      await loadOffers();
      setReviseAmount('');
      setReviseMessage('');
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to submit revised offer.');
    } finally {
      setActionLoading(false);
    }
  }, [reviseAmount, reviseMessage, loadOffers]);

  const handleAcceptCounter = useCallback(async (offer: Offer) => {
    if (!window.confirm('Accept this counter offer?')) return;
    setActionLoading(true);
    try {
      await offerService.acceptCounterOffer(offer.id);
      await loadOffers();
      setSelectedOffer(null);
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to accept counter offer.');
    } finally {
      setActionLoading(false);
    }
  }, [loadOffers]);

  const handleDeclineCounter = useCallback(async (offer: Offer) => {
    if (!window.confirm('Decline this counter offer?')) return;
    setActionLoading(true);
    try {
      await offerService.declineCounterOffer(offer.id);
      await loadOffers();
      setSelectedOffer(null);
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to decline counter offer.');
    } finally {
      setActionLoading(false);
    }
  }, [loadOffers]);

  // ── Post-inspection actions ────────────────────────────────────────────────

  const handlePostInspectionWithdraw = useCallback(async () => {
    if (!selectedOffer) return;
    setPostInspectionLoading(true);
    try {
      await offerService.withdrawAfterInspection(selectedOffer.id);
      await loadOffers();
      setSelectedOffer(null);
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.apiError.message
          : 'Failed to withdraw offer after inspection.',
      );
    } finally {
      setPostInspectionLoading(false);
    }
  }, [selectedOffer, loadOffers]);

  const handlePostInspectionRevise = useCallback(
    async (newAmount: number) => {
      if (!selectedOffer) return;
      setPostInspectionLoading(true);
      try {
        await offerService.reviseAfterInspection(selectedOffer.id, newAmount);
        await loadOffers();
        setSelectedOffer(null);
      } catch (err) {
        alert(
          err instanceof ApiRequestError
            ? err.apiError.message
            : 'Failed to revise offer after inspection.',
        );
      } finally {
        setPostInspectionLoading(false);
      }
    },
    [selectedOffer, loadOffers],
  );

  // ── Fetch post-inspection options when an offer is selected ───────────────

  useEffect(() => {
    if (!selectedOffer) return;
    // Only fetch for statuses where a window could be open
    if (!['accepted', 'pending', 'countered'].includes(selectedOffer.status)) return;
    let cancelled = false;
    offerService.getPostInspectionOptions(selectedOffer.id).then((opts) => {
      if (cancelled) return;
      if (opts.windowOpen) {
        setSelectedOffer((prev) =>
          prev ? { ...prev, postInspectionOptions: opts } : prev,
        );
      }
    }).catch(() => { /* silently ignore — window simply not open */ });
    return () => { cancelled = true; };
  }, [selectedOffer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getOfferStatusConfig = (status: DisplayOfferStatus) => {
    switch (status) {
      case 'pending':   return { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'countered': return { label: 'Counter Offer',  color: 'bg-purple-100 text-purple-700 border-purple-300', icon: TrendingUp };
      case 'accepted':  return { label: 'Accepted',       color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'declined':  return { label: 'Declined',       color: 'bg-red-100 text-red-700 border-red-300',         icon: XCircle };
      case 'withdrawn': return { label: 'Withdrawn',      color: 'bg-gray-100 text-gray-700 border-gray-300',      icon: XCircle };
      case 'expired':   return { label: 'Expired',        color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle };
      case 'closed':    return { label: 'Closed',         color: 'bg-gray-100 text-gray-700 border-gray-300',      icon: CheckCircle };
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OfferResponse':    return <DollarSign     className="text-blue-600"   size={16} />;
      case 'ListingStatus':    return <Home            className="text-green-600"  size={16} />;
      case 'InspectionUpdate': return <ClipboardCheck  className="text-purple-600" size={16} />;
      case 'MessageReceived':  return <MessageSquare   className="text-gray-600"   size={16} />;
      case 'AccountDecision':  return <CheckCircle     className="text-green-600"  size={16} />;
      case 'DisputeUpdate':    return <AlertCircle     className="text-red-600"    size={16} />;
      case 'TransactionClosed':return <TrendingUp      className="text-blue-600"   size={16} />;
      default:                 return <Bell            className="text-gray-600"   size={16} />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'OfferResponse':    return 'bg-blue-100';
      case 'ListingStatus':    return 'bg-green-100';
      case 'InspectionUpdate': return 'bg-purple-100';
      case 'AccountDecision':  return 'bg-green-100';
      case 'DisputeUpdate':    return 'bg-red-100';
      case 'TransactionClosed':return 'bg-blue-100';
      default:                 return 'bg-gray-100';
    }
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-blue-500/30">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-lg">
            <img src="/images/logo.png" alt="TrustEstate" className="w-10 h-10 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          </div>
          <div>
            <p className="font-bold text-white text-lg">TrustEstate</p>
            <p className="text-xs text-blue-200">Buyer Portal</p>
          </div>
        </Link>
      </div>

      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">
            {currentUser ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}` : '…'}
          </div>
          <div>
            <p className="font-bold text-white">
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
            </p>
            <p className="text-sm text-blue-200">{currentUser?.emailAddress ?? ''}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',     icon: <Home size={20} />,          label: 'Dashboard' },
          { tab: 'browse',        icon: <Search size={20} />,        label: 'Browse Properties' },
          { tab: 'favorites',     icon: <Heart size={20} />,         label: 'Saved Favorites', count: favorites.length },
          { tab: 'offers',        icon: <FileText size={20} />,      label: 'My Offers',       count: offers.length },
          { tab: 'messages',      icon: <MessageSquare size={20} />, label: 'Messages' },
          { tab: 'notifications', icon: <Bell size={20} />,          label: 'Notifications',
            count: notifications.filter((n) => !n.isRead).length, countColor: 'bg-red-500' },
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

      <div className="p-4 border-t border-blue-500/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-white hover:bg-blue-500/30 transition-all">
          <Settings size={20} /> Settings
        </button>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex">
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

      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="fixed w-80 h-screen overflow-y-auto"><Sidebar /></div>
      </aside>

      <main className="flex-1 overflow-auto">
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
                    {activeTab === 'browse'        && 'Browse Properties'}
                    {activeTab === 'favorites'     && 'Saved Favorites'}
                    {activeTab === 'offers'        && (selectedOffer ? `Offer — ${selectedOffer.propertyTitle}` : 'My Offers')}
                    {activeTab === 'messages'      && 'Messages'}
                    {activeTab === 'notifications' && 'Notifications'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeTab === 'dashboard' && 'Overview of your property search activity'}
                    {activeTab === 'browse'    && 'All active listings available for purchase or rent'}
                    {activeTab === 'favorites' && "Properties you've saved for later"}
                    {activeTab === 'offers' && !selectedOffer && 'Track all your submitted offers'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('browse')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Browse Properties</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Browse Properties Tab ── */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {browseLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
              ) : browseError ? (
                <div className="text-center py-16">
                  <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                  <p className="text-red-600 font-semibold">{browseError}</p>
                  <button
                    onClick={loadBrowseListings}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : browseListings.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No active listings found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {browseListings.map((listing) => {
                    const alreadyFavorited = favorites.some((f) => f.listingId === listing.listingId);
                    return (
                      <div
                        key={listing.listingId}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 duration-300 flex flex-col"
                      >
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
                          {listing.photos[0] ? (
                            <img
                              src={listing.photos[0].photoUrl}
                              alt={listing.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Home size={48} />
                            </div>
                          )}
                          {/* Listing type badge */}
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow">
                            For {listing.listingType}
                          </span>
                          {/* Favorite toggle */}
                          <button
                            onClick={async () => {
                              try {
                                if (alreadyFavorited) {
                                  await listingService.removeFavorite(listing.listingId);
                                } else {
                                  await listingService.saveFavorite(listing.listingId);
                                }
                                await loadFavorites();
                              } catch { /* ignore */ }
                            }}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-white transition-all"
                          >
                            <Heart
                              size={18}
                              className={alreadyFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                            />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-5 flex flex-col flex-1">
                          <p className="text-xl font-bold text-blue-600 mb-1">
                            {formatPrice(listing.askingPrice)}
                            {listing.listingType === 'Rent' && (
                              <span className="text-sm font-medium text-gray-500">/mo</span>
                            )}
                          </p>
                          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
                            <MapPin size={13} />
                            <span className="truncate">{listing.city}, {listing.country}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-4">{listing.propertyType}</p>

                          {/* Actions */}
                          <div className="mt-auto flex gap-2">
                            <Link
                              href={`/properties/${listing.listingId}`}
                              className="flex-1 py-2.5 text-center bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-1.5"
                            >
                              <Eye size={15} /> View
                            </Link>
                            <Link
                              href={`/properties/${listing.listingId}`}
                              className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1.5"
                            >
                              <Send size={15} /> Offer
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Saved Properties', value: favorites.length,                                                                               sub: 'Total saved',       subColor: 'text-gray-600',  icon: <Heart       className="text-red-500"    size={24} /> },
                  { label: 'Active Offers',    value: offers.filter((o) => o.status === 'pending' || o.status === 'countered').length,                sub: `of ${offers.length} total`, subColor: 'text-gray-600', icon: <FileText    className="text-blue-500"   size={24} /> },
                  { label: 'Accepted Offers',  value: offers.filter((o) => o.status === 'accepted').length,                                           sub: 'Ready to proceed',  subColor: 'text-gray-600',  icon: <CheckCircle className="text-green-500"  size={24} /> },
                  { label: 'Notifications',    value: notifications.filter((n) => !n.isRead).length,                                                  sub: 'Unread',             subColor: 'text-gray-600',  icon: <Bell        className="text-orange-500" size={24} /> },
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Offers */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Recent Offers</h2>
                      <button onClick={() => setActiveTab('offers')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    {offersLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : offers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No offers yet. <button onClick={() => setActiveTab('browse')} className="text-blue-600 hover:underline font-semibold">Browse listings to submit an offer</button></p>
                    ) : (
                      <div className="space-y-4">
                        {offers.slice(0, 3).map((offer) => {
                          const sc = getOfferStatusConfig(offer.status);
                          const Icon = sc.icon;
                          return (
                            <div key={offer.id} onClick={() => { setSelectedOffer(offer); setActiveTab('offers'); }}
                              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                              <div className="flex gap-4">
                                {offer.propertyImage && (
                                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                    <img src={offer.propertyImage} alt={offer.propertyTitle} className="w-full h-full object-cover"
                                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                                  </div>
                                )}
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
                    )}
                  </div>

                  {/* Saved Properties */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Saved Properties</h2>
                      <button onClick={() => setActiveTab('favorites')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    {favoritesLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : favorites.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No saved properties yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.slice(0, 4).map((listing) => (
                          <div key={listing.listingId} className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="relative h-32 overflow-hidden">
                              {listing.photos[0] ? (
                                <img src={listing.photos[0].photoUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Home className="text-gray-400" size={32} />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-lg font-bold text-blue-600 mb-1">{formatPrice(listing.askingPrice)}</p>
                              <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={12} />
                                <span className="line-clamp-1">{listing.city}, {listing.country}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.notificationId} onClick={() => handleMarkAsRead(notification.notificationId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationBg(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notification.body}</p>
                            <p className="text-xs text-gray-500">{formatNotificationDate(notification.createdAt)}</p>
                          </div>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No notifications</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Saved Favorites Tab ── */}
          {activeTab === 'favorites' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {favoritesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No saved properties yet.</p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Browse Properties <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 font-semibold mb-6">You have {favorites.length} saved properties</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((listing) => (
                      <div key={listing.listingId} className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="relative h-56 overflow-hidden">
                          {listing.photos[0] ? (
                            <img src={listing.photos[0].photoUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Home className="text-gray-400" size={48} />
                            </div>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await listingService.removeFavorite(listing.listingId);
                                await loadFavorites();
                              } catch { /* ignore */ }
                            }}
                            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                          >
                            <Heart size={20} className="fill-red-500 text-red-500" />
                          </button>
                        </div>
                        <div className="p-5">
                          <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.askingPrice)}</p>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{listing.title}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-4">
                            <MapPin size={16} />
                            <span className="text-sm">{listing.city}, {listing.country}</span>
                          </div>
                          <Link
                            href={`/properties/${listing.listingId}`}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            View &amp; Submit Offer <ArrowRight size={18} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}


          {/* ── Offers List Tab ── */}
          {activeTab === 'offers' && !selectedOffer && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {offersLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : offersError ? (
                <div className="text-center py-16">
                  <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                  <p className="text-red-600 font-semibold">{offersError}</p>
                  <button onClick={loadOffers} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Retry
                  </button>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No offers yet.</p>
                  <button onClick={() => setActiveTab('browse')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    <Search size={18} /> Browse Listings to Submit an Offer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-700 font-semibold">You have submitted {offers.length} offer{offers.length !== 1 ? 's' : ''}</p>
                    <button onClick={() => setActiveTab('browse')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
                      <Search size={16} /> Browse Listings
                    </button>
                  </div>
                  <div className="space-y-4">
                    {offers.map((offer) => {
                      const sc = getOfferStatusConfig(offer.status);
                      const Icon = sc.icon;
                      return (
                        <div key={offer.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                          <div className="flex gap-4 mb-4">
                            {offer.propertyImage && (
                              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={offer.propertyImage} alt={offer.propertyTitle} className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.propertyTitle}</h3>
                                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                                    <Calendar size={16} />
                                    <span>Submitted {offer.submittedDate}</span>
                                    <span className="text-gray-400">· Round {offer.negotiationRound}</span>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border ${sc.color}`}>
                                  <Icon size={16} />{sc.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">Offer:</span>
                                <span className="text-2xl font-bold text-blue-600">{formatPrice(offer.offerAmount)}</span>
                              </div>
                              {offer.responseDeadline && offer.status === 'countered' && (
                                <p className="text-sm text-orange-600 font-semibold mt-1">
                                  Response deadline: {new Date(offer.responseDeadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button onClick={() => setSelectedOffer(offer)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                              <Eye size={16} /> View Details
                            </button>
                            {offer.canWithdraw && (
                              <button onClick={() => handleWithdrawOffer(offer)} disabled={actionLoading}
                                className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                                Withdraw
                              </button>
                            )}
                            {offer.canAcceptCounter && (
                              <button onClick={() => handleAcceptCounter(offer)} disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                                <CheckCircle size={16} /> Accept Counter
                              </button>
                            )}
                            {offer.canDeclineCounter && (
                              <button onClick={() => handleDeclineCounter(offer)} disabled={actionLoading}
                                className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                                Decline Counter
                              </button>
                            )}
                            {offer.canRevise && (
                              <button onClick={() => setSelectedOffer(offer)} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                                <Edit3 size={16} /> Revise Offer
                              </button>
                            )}
                          </div>

                          {offer.status === 'countered' && (
                            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                              <p className="text-sm font-bold text-purple-900 mb-1">Counter Offer Received</p>
                              <p className="text-sm text-purple-800">Review the agent's counter offer: you can accept, submit a revised offer, or decline.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Offer Detail View ── */}
          {activeTab === 'offers' && selectedOffer && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedOffer(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Offers
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex gap-6 mb-4">
                    {selectedOffer.propertyImage && (
                      <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                        <img src={selectedOffer.propertyImage} alt={selectedOffer.propertyTitle} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedOffer.propertyTitle}</h2>
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
                      <p className="text-sm text-gray-500 mt-2">Negotiation round {selectedOffer.negotiationRound}</p>
                      {selectedOffer.responseDeadline && selectedOffer.status === 'countered' && (
                        <p className="text-sm text-orange-600 font-semibold mt-1">
                          Response deadline: {new Date(selectedOffer.responseDeadline).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Negotiation History */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Negotiation History</h3>
                  {/* Initial offer row */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                      <Users size={20} />
                    </div>
                    <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900">You submitted offer</p>
                        <p className="text-lg font-bold text-blue-600">{formatPrice(selectedOffer.offerAmount)}</p>
                      </div>
                      {selectedOffer.message && <p className="text-sm text-gray-600 mb-2">"{selectedOffer.message}"</p>}
                      <p className="text-xs text-gray-500">{selectedOffer.submittedDate}</p>
                    </div>
                  </div>
                  {selectedOffer.rounds.map((round) => (
                    <div key={round.id} className="flex gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${round.actor === 'buyer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {round.actor === 'buyer' ? <Users size={20} /> : <CheckCircle size={20} />}
                      </div>
                      <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-900">
                            {round.actor === 'buyer' ? 'You' : 'Agent'}{' '}
                            {round.action === 'counter' ? 'sent counter offer' : round.action}
                          </p>
                          <p className="text-lg font-bold text-blue-600">{formatPrice(round.amount)}</p>
                        </div>
                        {round.message && <p className="text-sm text-gray-600 mb-2">"{round.message}"</p>}
                        <p className="text-xs text-gray-500">{new Date(round.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Counter offer actions */}
                {selectedOffer.status === 'countered' && (
                  <div className="mb-6 space-y-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleAcceptCounter(selectedOffer)} disabled={actionLoading}
                        className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        Accept Counter Offer
                      </button>
                      <button onClick={() => handleDeclineCounter(selectedOffer)} disabled={actionLoading}
                        className="flex-1 py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                        Decline Counter
                      </button>
                    </div>
                  </div>
                )}

                {/* Revise Offer Form — hidden when post-inspection window supersedes it */}
                {selectedOffer.canRevise && !selectedOffer.postInspectionOptions?.windowOpen && (
                  <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Submit Revised Offer</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Revised Amount (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input type="text" placeholder="500,000" value={reviseAmount} onChange={(e) => setReviseAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Message to Agent</label>
                        <textarea rows={3} placeholder="Explain your revised offer..." value={reviseMessage} onChange={(e) => setReviseMessage(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                      </div>
                      <button onClick={() => handleReviseOffer(selectedOffer)} disabled={actionLoading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                        Submit Revised Offer
                      </button>
                    </div>
                  </div>
                )}

                {/* Withdraw */}
                {selectedOffer.canWithdraw && (
                  <div className="mb-6">
                    <button onClick={() => handleWithdrawOffer(selectedOffer)} disabled={actionLoading}
                      className="w-full py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                      Withdraw This Offer
                    </button>
                  </div>
                )}

                {/* Post-inspection panel — only shown when window is open */}
                {selectedOffer.postInspectionOptions?.windowOpen && (
                  <div className="mb-6">
                    <PostInspectionPanel
                      offerId={selectedOffer.id}
                      propertyTitle={selectedOffer.propertyTitle}
                      currentOfferAmount={selectedOffer.offerAmount}
                      options={selectedOffer.postInspectionOptions}
                      actionLoading={postInspectionLoading}
                      onWithdraw={handlePostInspectionWithdraw}
                      onRevise={handlePostInspectionRevise}
                    />
                  </div>
                )}

                {selectedOffer.agentId && (
                  <div className="mb-6">
                    <button
                      onClick={() => handleMessageAgent(selectedOffer)}
                      className="w-full py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={18} />
                      Message Your Agent
                    </button>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>Note:</strong> You can only have one active offer per listing. Negotiation is limited to 3 rounds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="flex gap-6 h-[calc(100vh-180px)]">

              {/* Thread list */}
              <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" /> Conversations
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {threadsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="animate-spin text-blue-600" size={28} />
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center py-10">
                      <MessageSquare className="text-gray-300 mb-3" size={40} />
                      <p className="text-sm text-gray-500 font-medium">No conversations yet.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Contact an agent from a property page to start one.
                      </p>
                    </div>
                  ) : (
                    threads.map((thread) => {
                      const otherName =
                        currentUser?.userId === thread.participantOneId
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

              {/* Message pane */}
              <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
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
                    {/* Thread header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                      <p className="font-bold text-gray-900">
                        {currentUser?.userId === activeThread.participantOneId
                          ? activeThread.participantTwoFullName
                          : activeThread.participantOneFullName}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">
                        Re: {activeThread.listingTitle}
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
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
                          const isMine = msg.senderId === currentUser?.userId;
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
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Type a message…"
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          type="submit"
                          disabled={messageSendLoading || !newMessageText.trim()}
                          className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {messageSendLoading
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

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  You have {notifications.filter((n) => !n.isRead).length} unread notifications
                </p>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.notificationId} onClick={() => handleMarkAsRead(notification.notificationId)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${getNotificationBg(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 mb-2">{notification.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                          <p className="text-xs text-gray-500">{formatNotificationDate(notification.createdAt)}</p>
                        </div>
                        {!notification.isRead && <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No notifications yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
