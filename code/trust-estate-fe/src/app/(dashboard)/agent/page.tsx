'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, type ApiNotification, formatNotificationDate } from '@/services/notification.service';
import Link from 'next/link';
import {
  Home,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  MapPin,
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
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/store/auth.context';
import { offerService } from '@/services/offer.service';
import { listingService, type ApiListing, type ListingPhoto } from '@/services/listing.service';
import { messageService, type MessageThreadDto, type MessageDto } from '@/services/message.service';
import { inspectionService, type InspectorDto, type InspectionDto } from '@/services/inspection.service';
import { transactionService, type TransactionStatusDto } from '@/services/transaction.service';
import { ApiRequestError } from '@/lib/api-client';
import type { OfferDto } from '@/types';

type ListingStatus = 'pending_review' | 'corrections_requested' | 'active' | 'under_offer' | 'closed';
type OfferStatus = 'pending' | 'countered' | 'accepted' | 'declined';

interface ListingAssignment {
  id: number;
  listingId: number;
  title: string;
  description: string;
  price: number;
  location: string;
  listingType: string;
  propertyType: string;
  photos: ListingPhoto[];
  ownerId: number;
  ownerName: string;
  assignmentStatus: 'pending' | 'accepted';
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



function mapApiListingToAssignment(l: ApiListing): ListingAssignment {
  // agentId is null until the agent accepts — use it as the authoritative accepted signal
  const assignmentStatus: 'pending' | 'accepted' = l.agentId !== null ? 'accepted' : 'pending';
  const listingStatus: ListingStatus =
    l.status === 'PendingAgentReview' ? 'pending_review' :
    l.status === 'CorrectionsRequested' ? 'corrections_requested' :
    l.status === 'Active' ? 'active' :
    l.status === 'UnderOffer' ? 'under_offer' :
    'closed';
  return {
    id: l.listingId,
    listingId: l.listingId,
    title: l.title,
    description: l.description,
    price: l.askingPrice,
    location: `${l.city}, ${l.country}`,
    listingType: l.listingType,
    propertyType: l.propertyType,
    photos: l.photos,
    ownerId: l.ownerId,
    ownerName: l.ownerName ?? `Owner #${l.ownerId}`,
    assignmentStatus,
    listingStatus,
    assignedDate: l.createdAt.split('T')[0],
    correctionNote: l.correctionNotes ?? undefined,
  };
}




export default function AgentDashboardPage() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'assignments' | 'listings' | 'offers' | 'transactions' | 'messages' | 'notifications'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingAssignment | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [messageText, setMessageText] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [counterDeadline, setCounterDeadline] = useState('');
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ListingAssignment | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [inspectorsList, setInspectorsList] = useState<InspectorDto[]>([]);
  const [inspectorsLoading, setInspectorsLoading] = useState(false);
  const [listingInspections, setListingInspections] = useState<Record<number, InspectionDto>>({});
  const [listingTxStatus, setListingTxStatus] = useState<Record<number, TransactionStatusDto>>({});
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [assignDate, setAssignDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignments, setAssignments] = useState<ListingAssignment[]>([]);

  // ── Messaging state ──────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activeThread, setActiveThread] = useState<MessageThreadDto | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageDto[]>([]);
  const [threadMessagesLoading, setThreadMessagesLoading] = useState(false);
  const [msgSendLoading, setMsgSendLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string; confirmLabel: string; variant: 'danger' | 'primary'; onConfirm: () => void;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const mapApiOfferStatus = (s: string): OfferStatus => {
    const map: Record<string, OfferStatus> = {
      Pending: 'pending', Countered: 'countered', Accepted: 'accepted',
      Declined: 'declined', Withdrawn: 'declined', Expired: 'declined', Closed: 'declined',
    };
    return map[s] ?? 'pending';
  };

  const mapDtoToOffer = useCallback((dto: OfferDto, listing: ApiListing): Offer => ({
    id: dto.offerId,
    listingId: dto.listingId,
    listingTitle: listing.title,
    listingImage: listing.photos[0]?.photoUrl ?? '',
    buyerName: dto.buyerFullName,
    buyerId: dto.buyerId,
    proposedPrice: dto.proposedPrice,
    status: mapApiOfferStatus(dto.status),
    message: dto.message ?? '',
    submittedDate: dto.submittedAt.split('T')[0],
    maxRounds: 3,
    currentRound: dto.negotiationRound,
    rounds: dto.negotiations.map((n) => ({
      id: n.negotiationId,
      actor: n.actorRole.toLowerCase() as 'buyer' | 'agent',
      action: n.action.toLowerCase() as NegotiationRound['action'],
      amount: n.proposedPrice,
      message: n.message ?? '',
      date: n.createdAt,
    })),
  }), []);

  const loadData = useCallback(async () => {
    setOffersLoading(true);
    try {
      const listings = await listingService.getAssignedListings();
      setAssignments(listings.map(mapApiListingToAssignment));
      const activeListings = listings.filter((l) => l.status === 'Active' || l.status === 'UnderOffer');
      const results = await Promise.allSettled(
        activeListings.map((l) => offerService.getOffersByListing(l.listingId)),
      );
      const allOffers: Offer[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          r.value.forEach((dto) => allOffers.push(mapDtoToOffer(dto, activeListings[i])));
        }
      });
      setOffers(allOffers);
    } catch { /* silently ignore */ }
    finally { setOffersLoading(false); }
  }, [mapDtoToOffer]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Messaging handlers ────────────────────────────────────────────────────────

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
      setThreads((prev) =>
        prev.map((t) => t.threadId === thread.threadId ? { ...t, unreadCount: 0 } : t),
      );
    } catch { /* silently ignore */ }
    finally { setThreadMessagesLoading(false); }
  }, []);

  const handleSendAgentMessage = useCallback(async () => {
    if (!activeThread || !messageText.trim()) return;
    const content = messageText.trim();
    const recipientId =
      user?.userId === activeThread.participantOneId
        ? activeThread.participantTwoId
        : activeThread.participantOneId;
    setMsgSendLoading(true);
    try {
      const msg = await messageService.sendMessage({ recipientId, listingId: activeThread.listingId, content });
      setThreadMessages((prev) => [...prev, msg]);
      setMessageText('');
    } catch { /* silently ignore */ }
    finally { setMsgSendLoading(false); }
  }, [activeThread, messageText, user]);

  const loadTransactionData = useCallback(async () => {
    const underOffer = assignments.filter(a => a.listingStatus === 'under_offer');
    if (underOffer.length === 0) return;
    setTransactionsLoading(true);
    try {
      const [inspResults, txResults] = await Promise.all([
        Promise.allSettled(underOffer.map(l => inspectionService.getInspectionByListing(l.listingId))),
        Promise.allSettled(underOffer.map(l => transactionService.getTransactionStatus(l.listingId))),
      ]);
      const newInspections: Record<number, InspectionDto> = {};
      const newStatuses: Record<number, TransactionStatusDto> = {};
      inspResults.forEach((r, i) => { if (r.status === 'fulfilled') newInspections[underOffer[i].listingId] = r.value; });
      txResults.forEach((r, i) => { if (r.status === 'fulfilled') newStatuses[underOffer[i].listingId] = r.value; });
      setListingInspections(newInspections);
      setListingTxStatus(newStatuses);
    } catch { /* silently ignore */ }
    finally { setTransactionsLoading(false); }
  }, [assignments]);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactionData();
  }, [activeTab, loadTransactionData]);

  const loadInspectors = useCallback(async () => {
    setInspectorsLoading(true);
    try {
      const data = await inspectionService.getAvailableInspectors();
      setInspectorsList(data);
    } catch { /* silently ignore */ }
    finally { setInspectorsLoading(false); }
  }, []);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const showConfirm = useCallback((
    message: string,
    confirmLabel: string,
    variant: 'danger' | 'primary',
    onConfirm: () => void,
  ) => setConfirmDialog({ message, confirmLabel, variant, onConfirm }), []);

  const toUserMessage = useCallback((err: unknown, fallback: string): string => {
    if (err instanceof ApiRequestError && (err.statusCode === 400 || err.statusCode === 422))
      return err.apiError.message;
    return fallback;
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
    } catch { /* silently ignore */ }
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getListingStatusConfig = (status: ListingStatus) => {
    switch (status) {
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


  const resetTabs = () => { setSelectedListing(null); setSelectedOffer(null); };

  const handleAcceptAssignment = async (a: ListingAssignment) => {
    setActionLoading(true);
    try {
      await listingService.respondToAssignment(a.listingId, true);
      showToast('Assignment accepted successfully.', 'success');
      await loadData();
    } catch (err) {
      showToast(toUserMessage(err, 'Failed to accept the assignment. Please try again.'));
    } finally { setActionLoading(false); }
  };

  const handleDeclineAssignment = (a: ListingAssignment) => {
    showConfirm(`Decline the assignment for "${a.title}"?`, 'Decline', 'danger', async () => {
      setActionLoading(true);
      try {
        await listingService.respondToAssignment(a.listingId, false);
        await loadData();
      } catch (err) {
        showToast(toUserMessage(err, 'Failed to decline the assignment. Please try again.'));
      } finally { setActionLoading(false); }
    });
  };

  const handleApproveListing = (l: ListingAssignment) => {
    showConfirm(`Approve "${l.title}" and publish it as Active?`, 'Approve', 'primary', async () => {
      setActionLoading(true);
      try {
        await listingService.approveListing(l.listingId);
        showToast('Listing approved and published successfully.', 'success');
        await loadData();
        setSelectedListing(null);
      } catch (err) {
        showToast(toUserMessage(err, 'Failed to approve the listing. Please try again.'));
      } finally { setActionLoading(false); }
    });
  };

  const handleRequestCorrections = async (l: ListingAssignment) => {
    if (!correctionNote.trim()) {
      showToast('Please describe what corrections are needed before submitting.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await listingService.requestCorrections(l.listingId, correctionNote);
      showToast('Correction request sent to the property owner.', 'success');
      await loadData();
      setCorrectionNote('');
      setSelectedListing(null);
    } catch (err) {
      showToast(toUserMessage(err, 'Failed to send correction request. Please try again.'));
    } finally { setActionLoading(false); }
  };

  const handleAcceptOffer = (o: Offer) => {
    showConfirm(`Accept the offer of ${formatPrice(o.proposedPrice)} from ${o.buyerName}?`, 'Accept Offer', 'primary', async () => {
      setActionLoading(true);
      try {
        await offerService.acceptOffer(o.id);
        showToast('Offer accepted successfully.', 'success');
        await loadData();
        setSelectedOffer(null);
      } catch (err) {
        showToast(toUserMessage(err, 'Failed to accept the offer. Please try again.'));
      } finally { setActionLoading(false); }
    });
  };

  const handleDeclineOffer = (o: Offer) => {
    showConfirm(`Decline the offer from ${o.buyerName}?`, 'Decline', 'danger', async () => {
      setActionLoading(true);
      try {
        await offerService.declineOffer(o.id);
        await loadData();
        setSelectedOffer(null);
      } catch (err) {
        showToast(toUserMessage(err, 'Failed to decline the offer. Please try again.'));
      } finally { setActionLoading(false); }
    });
  };

  const handleCounterOffer = async (o: Offer) => {
    const price = parseFloat(counterAmount.replace(/,/g, ''));
    if (isNaN(price) || price <= 0) { showToast('Please enter a valid counter amount.', 'warning'); return; }
    if (!counterMessage.trim()) { showToast('Please add a message for the buyer.', 'warning'); return; }
    if (!counterDeadline) { showToast('Please set a response deadline.', 'warning'); return; }
    if (o.currentRound >= o.maxRounds) { showToast('Maximum negotiation rounds reached. You must accept or decline.', 'warning'); return; }
    setActionLoading(true);
    try {
      await offerService.counterOffer(o.id, {
        revisedPrice: price,
        responseDeadline: new Date(counterDeadline).toISOString(),
        message: counterMessage,
      });
      showToast('Counter offer sent to the buyer.', 'success');
      await loadData();
      setCounterAmount('');
      setCounterMessage('');
      setCounterDeadline('');
      setSelectedOffer(null);
    } catch (err) {
      showToast(toUserMessage(err, 'Failed to send the counter offer. Please try again.'));
    } finally { setActionLoading(false); }
  };

  const handleAssignInspector = useCallback(async (inspector: InspectorDto) => {
    if (!selectedTransaction || !assignDate) return;
    const acceptedOffer = offers.find(o => o.listingId === selectedTransaction.listingId && o.status === 'accepted');
    if (!acceptedOffer) { showToast('Could not find the accepted offer for this listing.'); return; }
    setAssignLoading(true);
    try {
      const insp = await inspectionService.assignInspector({
        listingId: selectedTransaction.listingId,
        offerId: acceptedOffer.id,
        inspectorId: inspector.userId,
        scheduledDate: new Date(assignDate).toISOString(),
      });
      setListingInspections(prev => ({ ...prev, [selectedTransaction.listingId]: insp }));
      setShowInspectorModal(false);
      setAssignDate('');
      showToast('Inspector assigned and inspection scheduled.', 'success');
    } catch (err) {
      showToast(toUserMessage(err, 'Failed to assign inspector. Please try again.'));
    } finally { setAssignLoading(false); }
  }, [selectedTransaction, assignDate, offers, showToast, toUserMessage]);

  const handleCloseTransaction = (listing: ListingAssignment) => {
    const txStatus = listingTxStatus[listing.listingId];
    if (!txStatus?.canClose) { showToast('This transaction cannot be closed yet. All steps must be completed first.', 'warning'); return; }
    showConfirm(`Close the transaction for "${listing.title}"?`, 'Close Transaction', 'primary', async () => {
      try {
        await transactionService.closeTransaction(listing.listingId);
        showToast('Transaction closed successfully.', 'success');
        await loadData();
        setListingInspections({});
        setListingTxStatus({});
      } catch (err) {
        showToast(toUserMessage(err, 'Failed to close the transaction. Please try again.'));
      }
    });
  };

  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || 'AG';
  const userFullName = user ? `${user.firstName} ${user.lastName}` : 'Agent';
  const userEmail = user?.emailAddress ?? '';

  const pendingAssignments = assignments.filter(a => a.assignmentStatus === 'pending');
  const acceptedAssignments = assignments.filter(a => a.assignmentStatus === 'accepted');
  const reviewableListings = assignments.filter(
    a => a.listingStatus === 'pending_review' || a.listingStatus === 'corrections_requested',
  );

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
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">
            {userInitials}
          </div>
          <div>
            <p className="font-bold text-white">{userFullName}</p>
            <p className="text-sm text-blue-200">{userEmail}</p>
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
          { tab: 'dashboard',     icon: <Home size={20} />,           label: 'Dashboard' },
          { tab: 'assignments',   icon: <UserCheck size={20} />,      label: 'Assignments',
            count: pendingAssignments.length, countColor: 'bg-yellow-500' },
          { tab: 'listings',      icon: <Building size={20} />,       label: 'Listing Review',
            count: reviewableListings.length },
          { tab: 'offers',        icon: <FileText size={20} />,       label: 'Offer Management',
            count: offers.filter(o => o.status === 'pending' || o.status === 'countered').length },
          { tab: 'transactions',  icon: <ClipboardCheck size={20} />, label: 'Transactions' },
          { tab: 'messages',      icon: <MessageSquare size={20} />,  label: 'Messages',
            count: threads.reduce((s, t) => s + t.unreadCount, 0), countColor: 'bg-red-500' },
          { tab: 'notifications', icon: <Bell size={20} />,           label: 'Notifications',
            count: notifications.filter(n => !n.isRead).length, countColor: 'bg-red-500' },
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
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm transition-all ${
          toast.type === 'error'   ? 'bg-red-50 border-red-200 text-red-900' :
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' :
                                     'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {toast.type === 'error'   && <XCircle    size={20} className="text-red-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'success' && <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />}
          <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
          <button onClick={() => setToast(null)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity ml-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <p className="text-gray-900 font-semibold text-base mb-6 leading-snug">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
                  { label: 'Pending Assignments', value: pendingAssignments.length,
                    sub: 'Awaiting response', icon: <UserCheck className="text-yellow-500" size={24} /> },
                  { label: 'Active Listings', value: assignments.filter(a => a.listingStatus === 'active').length,
                    sub: `Total: ${acceptedAssignments.length}`, icon: <Building className="text-green-500" size={24} /> },
                  { label: 'Pending Offers', value: offers.filter(o => o.status === 'pending' || o.status === 'countered').length,
                    sub: 'Require action', icon: <FileText className="text-blue-500" size={24} /> },
                  { label: 'Active Transactions', value: assignments.filter(a => a.listingStatus === 'under_offer').length,
                    sub: 'In progress', icon: <ClipboardCheck className="text-purple-500" size={24} /> },
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
                      {offersLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
                      ) : offers.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-sm">No offers on your listings yet.</p>
                      ) : null}
                      {offers.slice(0, 3).map((offer) => (
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
                      {offersLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
                      ) : reviewableListings.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-sm">No listings pending review.</p>
                      ) : null}
                      {reviewableListings.slice(0, 2).map((listing) => {
                        const sc = getListingStatusConfig(listing.listingStatus);
                        const Icon = sc.icon;
                        return (
                          <div key={listing.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex gap-4">
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img
                                  src={listing.photos[0]?.photoUrl ?? '/images/property-placeholder.jpg'}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
                                />
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
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.notificationId} onClick={() => handleMarkAsRead(n.notificationId)}
                        className={`p-3 rounded-xl border cursor-pointer ${n.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${n.type === 'OfferResponse' ? 'bg-blue-100' : n.type === 'ListingStatus' ? 'bg-green-100' : n.type === 'InspectionUpdate' ? 'bg-purple-100' : n.type === 'DisputeUpdate' ? 'bg-red-100' : n.type === 'MessageReceived' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                            {n.type === 'OfferResponse'    && <FileText       size={16} className="text-blue-600" />}
                            {n.type === 'ListingStatus'    && <CheckCircle    size={16} className="text-green-600" />}
                            {n.type === 'InspectionUpdate' && <ClipboardCheck size={16} className="text-purple-600" />}
                            {n.type === 'DisputeUpdate'    && <AlertCircle    size={16} className="text-red-600" />}
                            {n.type === 'MessageReceived'  && <MessageSquare  size={16} className="text-gray-600" />}
                            {n.type === 'AccountDecision'  && <UserCheck      size={16} className="text-green-600" />}
                            {n.type === 'TransactionClosed'&& <CheckCircle    size={16} className="text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-1">{n.title}</p>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-gray-500">{formatNotificationDate(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
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
              {offersLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : (
                <>
                  <p className="text-gray-700 font-semibold mb-6">
                    You have {pendingAssignments.length} pending assignment request{pendingAssignments.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-6">
                    {pendingAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex gap-6 mb-4">
                          <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                            <img
                              src={assignment.photos[0]?.photoUrl ?? '/images/property-placeholder.jpg'}
                              alt={assignment.title}
                              className="w-full h-full object-cover"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={16} /><span className="text-sm">{assignment.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Owner:</span>
                                <span className="text-sm font-semibold text-gray-900">{assignment.ownerName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">{assignment.propertyType} — {assignment.listingType}</span>
                              <div className="ml-auto">
                                <p className="text-2xl font-bold text-blue-600">{formatPrice(assignment.price)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-4">Requested on: {assignment.assignedDate}</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAcceptAssignment(assignment)}
                              disabled={actionLoading}
                              className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                              Accept Assignment
                            </button>
                            <button
                              onClick={() => handleDeclineAssignment(assignment)}
                              disabled={actionLoading}
                              className="flex-1 py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <XIcon size={20} /> Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingAssignments.length === 0 && (
                      <div className="text-center py-12">
                        <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 font-semibold">No pending assignments</p>
                        <p className="text-sm text-gray-500">New assignment requests will appear here</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Listing Review List ── */}
          {activeTab === 'listings' && !selectedListing && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {offersLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : (
                <>
                  <p className="text-gray-700 font-semibold mb-6">
                    You have {acceptedAssignments.length} assigned listing{acceptedAssignments.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedAssignments.map((listing) => {
                      const sc = getListingStatusConfig(listing.listingStatus);
                      const Icon = sc.icon;
                      return (
                        <div key={listing.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={listing.photos[0]?.photoUrl ?? '/images/property-placeholder.jpg'}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
                            />
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border backdrop-blur-sm ${sc.color}`}>
                                <Icon size={14} />{sc.label}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <MapPin size={16} /><span className="text-sm line-clamp-1">{listing.location}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{listing.propertyType} — {listing.listingType}</p>
                            <p className="text-sm text-gray-600 mb-4">Owner: {listing.ownerName}</p>
                            <button
                              onClick={() => setSelectedListing(listing)}
                              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye size={18} /> Review Listing
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {acceptedAssignments.length === 0 && (
                      <div className="col-span-3 text-center py-12">
                        <Building className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 font-semibold">No assigned listings yet</p>
                        <p className="text-sm text-gray-500">Accept an assignment to see listings here</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Listing Detail Review ── */}
          {activeTab === 'listings' && selectedListing && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedListing(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Listings
              </button>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                {/* Photos */}
                {selectedListing.photos.length > 0 && (
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedListing.photos.slice(0, 6).map((photo) => (
                      <div key={photo.photoId} className="aspect-video rounded-xl overflow-hidden">
                        <img src={photo.photoUrl} alt={selectedListing.title} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      </div>
                    ))}
                  </div>
                )}

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
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-gray-600"><MapPin size={16} /><span className="text-sm">{selectedListing.location}</span></div>
                    <span className="text-sm text-gray-600">{selectedListing.propertyType}</span>
                    <span className="text-sm text-gray-600">{selectedListing.listingType}</span>
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
                      <textarea
                        rows={4}
                        placeholder="Describe what needs to be corrected or improved..."
                        value={correctionNote}
                        onChange={(e) => setCorrectionNote(e.target.value)}
                        maxLength={1000}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">{correctionNote.length}/1000</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApproveListing(selectedListing)}
                        disabled={actionLoading}
                        className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                        Approve & Make Active
                      </button>
                      <button
                        onClick={() => handleRequestCorrections(selectedListing)}
                        disabled={actionLoading || !correctionNote}
                        className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <AlertCircle size={20} />}
                        Request Corrections
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
              {offersLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : offers.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No offers on your active listings yet.</p>
                </div>
              ) : null}
              {offers.length > 0 && (
                <p className="text-gray-700 font-semibold mb-6">You have {offers.length} offer{offers.length !== 1 ? 's' : ''} to manage</p>
              )}
              <div className="space-y-4">
                {offers.map((offer) => (
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
                          {round.message && <p className="text-sm text-gray-600 mb-2">"{round.message}"</p>}
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
                      <h3 className="text-lg font-bold text-blue-900 mb-4">
                        Counter Offer <span className="text-sm font-normal text-blue-700">(Round {selectedOffer.currentRound} of {selectedOffer.maxRounds})</span>
                      </h3>
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
                          <label className="block text-sm font-bold text-gray-900 mb-2">Response Deadline</label>
                          <input type="datetime-local" value={counterDeadline} onChange={(e) => setCounterDeadline(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Message to Buyer</label>
                          <textarea rows={3} placeholder="Explain your counter offer..." value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => handleAcceptOffer(selectedOffer)} disabled={actionLoading}
                        className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Accept Offer
                      </button>
                      <button onClick={() => handleCounterOffer(selectedOffer)} disabled={actionLoading}
                        className="py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <TrendingUp size={20} />} Send Counter
                      </button>
                      <button onClick={() => handleDeclineOffer(selectedOffer)} disabled={actionLoading}
                        className="py-3 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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
          {activeTab === 'transactions' && (() => {
            const underOfferListings = assignments.filter(a => a.listingStatus === 'under_offer');
            return (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  {transactionsLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                  ) : underOfferListings.length === 0 ? (
                    <div className="text-center py-16">
                      <ClipboardCheck className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 font-semibold">No active transactions</p>
                      <p className="text-sm text-gray-500">Transactions appear here after you accept a buyer's offer</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 font-semibold mb-6">
                        You have {underOfferListings.length} active transaction{underOfferListings.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-6">
                        {underOfferListings.map((listing) => {
                          const acceptedOffer = offers.find(o => o.listingId === listing.listingId && o.status === 'accepted');
                          const inspection = listingInspections[listing.listingId];
                          const txStatus = listingTxStatus[listing.listingId];
                          const hasInspection = !!inspection;
                          const inspCompleted = inspection?.status === 'Completed';
                          const verdictDone = inspection?.report?.isLocked === true;
                          return (
                            <div key={listing.listingId} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">{listing.title}</h3>
                                  <p className="text-sm text-gray-600">Owner: {listing.ownerName}</p>
                                  {acceptedOffer && (
                                    <>
                                      <p className="text-sm text-gray-600">Buyer: {acceptedOffer.buyerName}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-600">Sale Amount:</span>
                                        <span className="text-xl font-bold text-blue-600">{formatPrice(acceptedOffer.proposedPrice)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border bg-purple-100 text-purple-700 border-purple-300">
                                  <FileText size={14} /> Under Offer
                                </span>
                              </div>

                              <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Transaction Progress</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={18} />
                                    <span className="text-sm text-gray-700">Offer Accepted</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {hasInspection ? <CheckCircle className="text-green-600" size={18} /> : <Clock className="text-gray-400" size={18} />}
                                    <span className="text-sm text-gray-700">
                                      {hasInspection
                                        ? `Inspection Scheduled — ${new Date(inspection.scheduledDate).toLocaleDateString()}`
                                        : 'Inspection Pending Assignment'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {inspCompleted ? <CheckCircle className="text-green-600" size={18} /> : <Clock className="text-gray-400" size={18} />}
                                    <span className="text-sm text-gray-700">
                                      {inspCompleted
                                        ? `Inspection Completed — ${inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : ''}`
                                        : `Inspection ${hasInspection ? `In Progress (${inspection.status})` : 'Not Started'}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {verdictDone ? <CheckCircle className="text-green-600" size={18} /> : <Clock className="text-gray-400" size={18} />}
                                    <span className="text-sm text-gray-700">
                                      {verdictDone ? 'Verdict Submitted — Report Locked' : 'Verdict Pending'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                {!hasInspection && (
                                  <button
                                    onClick={() => { setSelectedTransaction(listing); setShowInspectorModal(true); loadInspectors(); }}
                                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Calendar size={18} /> Assign Inspector
                                  </button>
                                )}
                                {txStatus?.canClose && (
                                  <button
                                    onClick={() => handleCloseTransaction(listing)}
                                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle size={18} /> Close Transaction
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Inspector Modal */}
                {showInspectorModal && selectedTransaction && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold text-gray-900">Assign Property Inspector</h2>
                          <button onClick={() => { setShowInspectorModal(false); setAssignDate(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={24} />
                          </button>
                        </div>
                        <p className="text-gray-600 mt-2">Select a verified inspector for: <strong>{selectedTransaction.title}</strong></p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Scheduled Inspection Date</label>
                          <input
                            type="date"
                            value={assignDate}
                            onChange={(e) => setAssignDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {inspectorsLoading ? (
                          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                        ) : inspectorsList.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="mx-auto text-gray-400 mb-3" size={40} />
                            <p className="text-gray-600 font-semibold">No verified inspectors available</p>
                            <p className="text-sm text-gray-500">Inspectors must be verified by an admin before assignment</p>
                          </div>
                        ) : (
                          inspectorsList.map((inspector) => (
                            <div key={inspector.userId} className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 bg-white transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{inspector.firstName} {inspector.lastName}</h3>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                      <CheckCircle size={14} /><span className="text-xs font-bold">Verified</span>
                                    </div>
                                  </div>
                                  {inspector.professionalQualifications && (
                                    <p className="text-sm text-gray-600">{inspector.professionalQualifications}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssignInspector(inspector)}
                                disabled={!assignDate || assignLoading}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {assignLoading ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
                                {assignDate ? 'Assign Inspector' : 'Select a date first'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thread List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Conversations</h2>
                  {threadsLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
                  ) : threads.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto text-gray-400 mb-2" size={36} />
                      <p className="text-sm text-gray-500">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {threads.map((thread) => {
                        const otherName =
                          user?.userId === thread.participantOneId
                            ? thread.participantTwoFullName
                            : thread.participantOneFullName;
                        const isActive = activeThread?.threadId === thread.threadId;
                        return (
                          <div key={thread.threadId} onClick={() => handleSelectThread(thread)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-bold text-gray-900 truncate flex-1">{otherName}</p>
                              {thread.unreadCount > 0 && (
                                <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                  {thread.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-blue-600 font-medium truncate mb-1">{thread.listingTitle}</p>
                            {thread.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">{thread.lastMessage.content}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    {activeThread ? (
                      <>
                        <div className="p-5 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {(user?.userId === activeThread.participantOneId
                                ? activeThread.participantTwoFullName
                                : activeThread.participantOneFullName).charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">
                                {user?.userId === activeThread.participantOneId
                                  ? activeThread.participantTwoFullName
                                  : activeThread.participantOneFullName}
                              </p>
                              <p className="text-sm text-gray-600">Re: {activeThread.listingTitle}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                          {threadMessagesLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
                          ) : threadMessages.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-8">No messages yet. Send the first one!</p>
                          ) : (
                            threadMessages.map((msg) => {
                              const isMine = msg.senderId === user?.userId;
                              return (
                                <div key={msg.messageId} className={`flex gap-3 ${isMine ? 'justify-end' : ''}`}>
                                  {!isMine && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                      {msg.senderFullName.charAt(0)}
                                    </div>
                                  )}
                                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`p-4 rounded-2xl shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                                      <p className="text-sm">{msg.content}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 px-1">
                                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {isMine && (
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                      {userInitials}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white">
                          <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); handleSendAgentMessage(); }}>
                            <input type="text" placeholder="Type your message…" value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <button type="submit" disabled={msgSendLoading || !messageText.trim()}
                              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                              {msgSendLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} Send
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-600 font-semibold">Select a conversation</p>
                          <p className="text-sm text-gray-500">Conversations with property owners and buyers appear here</p>
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
                  You have {notifications.filter(n => !n.isRead).length} unread notifications
                </p>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.notificationId} onClick={() => handleMarkAsRead(n.notificationId)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${n.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${n.type === 'OfferResponse' ? 'bg-blue-100' : n.type === 'ListingStatus' ? 'bg-green-100' : n.type === 'InspectionUpdate' ? 'bg-purple-100' : n.type === 'DisputeUpdate' ? 'bg-red-100' : n.type === 'MessageReceived' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                          {n.type === 'OfferResponse'    && <FileText       size={16} className="text-blue-600" />}
                          {n.type === 'ListingStatus'    && <CheckCircle    size={16} className="text-green-600" />}
                          {n.type === 'InspectionUpdate' && <ClipboardCheck size={16} className="text-purple-600" />}
                          {n.type === 'DisputeUpdate'    && <AlertCircle    size={16} className="text-red-600" />}
                          {n.type === 'MessageReceived'  && <MessageSquare  size={16} className="text-gray-600" />}
                          {n.type === 'AccountDecision'  && <UserCheck      size={16} className="text-green-600" />}
                          {n.type === 'TransactionClosed'&& <CheckCircle    size={16} className="text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 mb-2">{n.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{n.body}</p>
                          <p className="text-xs text-gray-500">{formatNotificationDate(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
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
