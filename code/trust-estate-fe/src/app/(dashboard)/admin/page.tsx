'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService, type PendingVerification, type AdminListing, type AdminUser, type AdminInspection, type AdminDispute } from '@/services/admin.service';
import { notificationService, type ApiNotification, formatNotificationDate } from '@/services/notification.service';
import { ApiRequestError } from '@/lib/api-client';
import { useAuth } from '@/store/auth.context';
import Link from 'next/link';
import {
  Home,
  Users,
  Building,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Square,
  Shield,
  TrendingUp,
  Menu,
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  UserCheck,
  Edit,
  AlertCircle,
  Activity,
  Calendar,
  Mail,
  Flag,
  Ban,
  FileText,
  MessageSquare,
  Bell,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ListingCard } from '@/components/admin/ListingCard';
import styles from './admin.module.css';






export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const adminInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'AD';
  const adminName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'verifications' | 'listings' | 'users' | 'reports' | 'disputes' | 'notifications'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminInspection | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [listingFilter, setListingFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'buyer' | 'owner' | 'agent' | 'inspector'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'ongoing' | 'submitted'>('all');
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'Open' | 'UnderReview' | 'Resolved'>('all');

  // ── Verifications API state
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationsError, setVerificationsError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    setVerificationsError(null);
    try {
      const data = await adminService.getPendingVerifications();
      setPendingVerifications(data);
    } catch (err) {
      setVerificationsError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load verifications.',
      );
    } finally {
      setVerificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const handleApprove = async (userId: number) => {
    setActioningId(userId);
    try {
      await adminService.approveVerification(userId);
      setPendingVerifications((prev) => prev.filter((v) => v.userId !== userId));
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to approve user.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId: number) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    setActioningId(userId);
    try {
      await adminService.rejectVerification(userId);
      setPendingVerifications((prev) => prev.filter((v) => v.userId !== userId));
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to reject user.');
    } finally {
      setActioningId(null);
    }
  };

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

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
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
    } catch { /* silently ignore */ }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silently ignore */ }
  }, []);

  // ── Listings API state ────────────────────────────────────────────────────
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [listingActionLoading, setListingActionLoading] = useState(false);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError(null);
    try {
      const data = await adminService.getAllListings();
      setListings(data);
    } catch (err) {
      setListingsError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load listings.',
      );
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'listings' || activeTab === 'dashboard') loadListings();
  }, [activeTab, loadListings]);

  // ── Users API state ───────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setUsersError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load users.',
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Inspections API state ─────────────────────────────────────────────────
  const [inspections, setInspections] = useState<AdminInspection[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState<string | null>(null);

  const loadInspections = useCallback(async () => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    try {
      const data = await adminService.getInspections();
      setInspections(data);
    } catch (err) {
      setInspectionsError(err instanceof ApiRequestError ? err.apiError.message : 'Failed to load inspections.');
    } finally {
      setInspectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') loadInspections();
  }, [activeTab, loadInspections]);

  // ── Disputes API state ────────────────────────────────────────────────────
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);
  const [disputeResolving, setDisputeResolving] = useState(false);

  const loadDisputes = useCallback(async () => {
    setDisputesLoading(true);
    setDisputesError(null);
    try {
      const data = await adminService.getDisputes();
      setDisputes(data);
    } catch (err) {
      setDisputesError(err instanceof ApiRequestError ? err.apiError.message : 'Failed to load disputes.');
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'disputes') loadDisputes();
  }, [activeTab, loadDisputes]);

  const handleResolveDispute = async (dispute: AdminDispute) => {
    if (!actionReason.trim()) return;
    setDisputeResolving(true);
    try {
      await adminService.resolveDispute(dispute.disputeId, actionReason);
      setDisputes((prev) =>
        prev.map((d) => d.disputeId === dispute.disputeId
          ? { ...d, status: 'Resolved', resolutionOutcome: actionReason, resolvedAt: new Date().toISOString() }
          : d),
      );
      setSelectedDispute(null);
      setActionReason('');
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to resolve dispute.');
    } finally {
      setDisputeResolving(false);
    }
  };

  // ── User verify ───────────────────────────────────────────────────────────
  const [userVerifying, setUserVerifying] = useState<number | null>(null);

  const handleVerifyUser = async (targetUser: AdminUser) => {
    setUserVerifying(targetUser.userId);
    try {
      await adminService.verifyUser(targetUser.userId);
      setUsers((prev) =>
        prev.map((u) => u.userId === targetUser.userId ? { ...u, isVerified: true } : u),
      );
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to verify user.');
    } finally {
      setUserVerifying(null);
    }
  };

  // ── User suspend ──────────────────────────────────────────────────────────
  const [userSuspending, setUserSuspending] = useState(false);

  const handleSuspendUser = async (targetUser: AdminUser) => {
    if (!actionReason.trim()) return;
    setUserSuspending(true);
    try {
      await adminService.suspendUser(targetUser.userId, actionReason);
      setUsers((prev) =>
        prev.map((u) => u.userId === targetUser.userId ? { ...u, accountStatus: 'Suspended' } : u),
      );
      setSelectedUser(null);
      setActionReason('');
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to suspend user.');
    } finally {
      setUserSuspending(false);
    }
  };

  const handleSuspendListing = useCallback(async (listing: AdminListing) => {
    if (!actionReason.trim()) return;
    setListingActionLoading(true);
    try {
      await adminService.suspendListing(listing.listingId, actionReason);
      setListings((prev) =>
        prev.map((l) => l.listingId === listing.listingId ? { ...l, status: 'Suspended' as const, moderationNotes: actionReason } : l),
      );
      setSelectedListing(null);
      setActionReason('');
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to suspend listing.');
    } finally {
      setListingActionLoading(false);
    }
  }, [actionReason]);

  const handleRemoveListing = useCallback(async (listing: AdminListing) => {
    if (!actionReason.trim()) return;
    setListingActionLoading(true);
    try {
      await adminService.removeListing(listing.listingId, actionReason);
      setListings((prev) => prev.filter((l) => l.listingId !== listing.listingId));
      setSelectedListing(null);
      setActionReason('');
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError.message : 'Failed to remove listing.');
    } finally {
      setListingActionLoading(false);
    }
  }, [actionReason]);

  const getFilteredListings = () => {
    if (listingFilter === 'all') return listings;
    if (listingFilter === 'active') return listings.filter((l) => l.status === 'Active');
    if (listingFilter === 'suspended') return listings.filter((l) => l.status === 'Suspended');
    if (listingFilter === 'pending') return listings.filter((l) => l.status === 'PendingAgentReview' || l.status === 'CorrectionsRequested');
    return listings;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':                       return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':                      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'suspended': case 'rejected':   return 'bg-red-100 text-red-700 border-red-200';
      default:                             return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'buyer':              return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'owner':              return 'bg-green-100 text-green-700 border-green-200';
      case 'agent':              return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'propertyinspector':  return 'bg-amber-100 text-amber-700 border-amber-200';
      default:                   return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const clearAction = () => {
    setSelectedListing(null);
    setSelectedUser(null);
    setSelectedReport(null);
    setSelectedDispute(null);
    setActionReason('');
  };

  const getFilteredUsers = () => {
    if (userRoleFilter === 'all') return users;
    const target = userRoleFilter === 'inspector' ? 'PropertyInspector'
      : userRoleFilter.charAt(0).toUpperCase() + userRoleFilter.slice(1);
    return users.filter(u => u.role === target);
  };

  const userDistributionData = [
    { name: 'Buyers',     value: users.filter(u => u.role === 'Buyer').length,              color: '#3b82f6' },
    { name: 'Owners',     value: users.filter(u => u.role === 'Owner').length,              color: '#10b981' },
    { name: 'Agents',     value: users.filter(u => u.role === 'Agent').length,              color: '#8b5cf6' },
    { name: 'Inspectors', value: users.filter(u => u.role === 'PropertyInspector').length,  color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Derived chart data from real backend state
  const last6MonthKeys = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
      };
    });
  }, []);

  // Cumulative user count per role up to each month
  const userGrowthData = useMemo(() =>
    last6MonthKeys.map(({ key, label }) => ({
      month: label,
      buyers: users.filter(u => u.role === 'Buyer' && u.createdAt.slice(0, 7) <= key).length,
      owners: users.filter(u => u.role === 'Owner' && u.createdAt.slice(0, 7) <= key).length,
      agents: users.filter(u => u.role === 'Agent' && u.createdAt.slice(0, 7) <= key).length,
    })),
  [last6MonthKeys, users]);

  // Listings created in each of the last 4 calendar weeks, broken down by outcome
  const listingActivityData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - (3 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const week = listings.filter(l => {
        const d = new Date(l.createdAt);
        return d >= weekStart && d < weekEnd;
      });
      return {
        week: `Week ${i + 1}`,
        submitted: week.length,
        approved: week.filter(l => ['Active', 'UnderOffer', 'Archived'].includes(l.status)).length,
        rejected: week.filter(l => ['CorrectionsRequested', 'Suspended', 'Removed'].includes(l.status)).length,
      };
    });
  }, [listings]);

  // Sum of asking prices for non-draft listings created in each of the last 6 months
  const revenueData = useMemo(() => {
    const eligible = listings.filter(l => !['PendingAgentReview', 'CorrectionsRequested'].includes(l.status));
    return last6MonthKeys.map(({ key, label }) => ({
      month: label,
      revenue: eligible
        .filter(l => l.createdAt.slice(0, 7) === key)
        .reduce((sum, l) => sum + l.askingPrice, 0),
    }));
  }, [last6MonthKeys, listings]);

  const currentMonthRevenue = useMemo(() => {
    const key = last6MonthKeys[last6MonthKeys.length - 1]?.key ?? '';
    return listings
      .filter(l => l.createdAt.slice(0, 7) === key && !['PendingAgentReview', 'CorrectionsRequested'].includes(l.status))
      .reduce((sum, l) => sum + l.askingPrice, 0);
  }, [last6MonthKeys, listings]);

  const getFilteredReports = () => {
    if (reportFilter === 'all') return inspections;
    if (reportFilter === 'ongoing') return inspections.filter(i => !i.reportLocked);
    if (reportFilter === 'submitted') return inspections.filter(i => i.reportLocked);
    return inspections;
  };

  const getFilteredDisputes = () => {
    if (disputeFilter === 'all') return disputes;
    return disputes.filter(d => d.status === disputeFilter);
  };

  const sidebarContent = (
    <div className="h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-500/30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
            <img src="/images/logo.svg" alt="TrustEstate" className="w-10 h-10 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          </div>
        </Link>
      </div>

      {/* Admin Profile */}
      <div className="p-6 border-b border-gray-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">{adminInitials}</div>
          <div>
            <p className="font-bold text-white">{adminName}</p>
            <p className="text-sm text-gray-300">Platform Administrator</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="text-red-400" size={16} />
          <span className="text-gray-300 font-medium">Full Access</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',     icon: <BarChart3      size={20} />, label: 'Analytics' },
          { tab: 'verifications', icon: <UserCheck      size={20} />, label: 'Verifications',
            count: pendingVerifications.length, countColor: 'bg-orange-600' },
          { tab: 'listings',      icon: <Building       size={20} />, label: 'Listings',
            count: listings.filter(l => l.status === 'Suspended').length || undefined, countColor: 'bg-red-600' },
          { tab: 'users',         icon: <Users          size={20} />, label: 'Users',
            count: users.length },
          { tab: 'reports',       icon: <ClipboardCheck size={20} />, label: 'Reports',
            count: inspections.filter(i => !i.reportLocked).length || undefined, countColor: 'bg-orange-600' },
          { tab: 'disputes',      icon: <MessageSquare  size={20} />, label: 'Disputes',
            count: disputes.filter(d => d.status === 'Open' || d.status === 'UnderReview').length || undefined, countColor: 'bg-red-600' },
          { tab: 'notifications', icon: <Bell           size={20} />, label: 'Notifications',
            count: notifications.filter(n => !n.isRead).length, countColor: 'bg-red-600' },
        ].map(({ tab, icon, label, count, countColor }) => (
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
            {count !== undefined && count > 0 && (
              <span className={`ml-auto ${countColor ?? 'bg-blue-600'} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-500/30 space-y-2">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/20 transition-all">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="fixed w-80 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 border-b border-gray-500/30 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-500/30 rounded-lg transition-colors text-white flex-shrink-0">
                  <Menu size={24} />
                </button>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {activeTab === 'dashboard'     && 'Platform Analytics'}
                  {activeTab === 'verifications' && 'Pending Verifications'}
                  {activeTab === 'listings'      && 'Listings Management'}
                  {activeTab === 'users'         && 'User Management'}
                  {activeTab === 'reports'       && 'Inspection Reports'}
                  {activeTab === 'disputes'      && 'Dispute Resolution'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* ── Analytics Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active Listings',      value: listings.filter(l => l.status === 'Active').length,     sub: 'Currently live',          subColor: 'text-green-600',  icon: <Building      className="text-blue-500"    size={24} /> },
                  { label: 'Suspended Listings',   value: listings.filter(l => l.status === 'Suspended').length, sub: 'Requires attention',      subColor: 'text-orange-600', icon: <Flag          className="text-orange-500"  size={24} /> },
                  { label: 'Pending Verifications',  value: pendingVerifications.length,                                                            sub: '72h review window',       subColor: 'text-purple-600', icon: <Clock         className="text-purple-500"  size={24} /> },
                  { label: 'Open Disputes',          value: disputes.filter(d => d.status === 'Open' || d.status === 'UnderReview').length,         sub: 'Immediate action needed', subColor: 'text-red-600',    icon: <MessageSquare className="text-red-500"     size={24} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.subColor}`}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth Trend</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="buyers" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="owners" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="agents" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">User Distribution</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={userDistributionData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={90} fill="#8884d8" dataKey="value">
                        {userDistributionData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Listing Activity</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={listingActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="submitted" fill="#3b82f6" radius={[8,8,0,0]} />
                      <Bar dataKey="approved"  fill="#10b981" radius={[8,8,0,0]} />
                      <Bar dataKey="rejected"  fill="#ef4444" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => typeof value === 'number' ? formatPrice(value) : ''} />
                      <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { gradient: 'from-blue-500 to-blue-600',     icon: <Activity      className="text-white/80 mb-4" size={32} />, label: 'Total Listings',      value: listings.length,                                                         sub: `${listings.filter(l => l.status === 'Active').length} active` },
                  { gradient: 'from-green-500 to-green-600',   icon: <UserCheck     className="text-white/80 mb-4" size={32} />, label: 'Verified Users',      value: users.filter(u => u.accountStatus === 'Active').length,                 sub: `Out of ${users.length} total` },
                  { gradient: 'from-orange-500 to-orange-600', icon: <ClipboardCheck className="text-white/80 mb-4" size={32} />, label: 'Inspection Reports', value: inspections.filter(i => i.hasReport).length,                             sub: `${inspections.filter(i => i.reportLocked).length} submitted` },
                  { gradient: 'from-purple-500 to-purple-600', icon: <DollarSign    className="text-white/80 mb-4" size={32} />, label: 'Platform Revenue',    value: formatPrice(currentMonthRevenue),                                        sub: 'This month' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white`}>
                    {stat.icon}
                    <p className="text-sm font-semibold text-white/90 mb-2">{stat.label}</p>
                    <p className="text-2xl sm:text-4xl font-bold mb-1 truncate">{stat.value}</p>
                    <p className="text-sm text-white/80">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Verifications Tab ── */}
          {activeTab === 'verifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              {verificationsLoading && (
                <p className="text-gray-500 text-sm mb-4">Loading pending verifications…</p>
              )}
              {verificationsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {verificationsError}
                  <button onClick={loadVerifications} className="ml-3 underline font-semibold">Retry</button>
                </div>
              )}
              {!verificationsLoading && !verificationsError && (
                <p className="text-gray-600 mb-6">
                  {pendingVerifications.length} verification{pendingVerifications.length !== 1 ? 's' : ''} pending approval (72-hour review window)
                </p>
              )}
              <div className="space-y-4">
                {pendingVerifications.map((v) => {
                  const isActioning = actioningId === v.userId;
                  const roleLabel = v.role === 'PropertyInspector' ? 'INSPECTOR' : v.role.toUpperCase();
                  const roleColorClass = v.role === 'Agent'
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200';
                  return (
                    <div key={v.userId} className="p-4 sm:p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:shadow-md transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <UserCheck className="text-blue-600" size={24} />
                            <h3 className="text-xl font-bold text-gray-900">{v.firstName} {v.lastName}</h3>
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${roleColorClass}`}>
                              {roleLabel}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={16} className="text-gray-500" /><span>{v.email}</span></div>
                            <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={16} className="text-gray-500" /><span>Registered: <span className="font-semibold">{new Date(v.registeredAt).toLocaleDateString()}</span></span></div>
                            {v.role === 'Agent' && v.agencyType && (
                              <div className="flex items-center gap-2 text-sm text-gray-700"><FileText size={16} className="text-gray-500" /><span>Agency: <span className="font-semibold">{v.agencyType}{v.agencyName ? ` — ${v.agencyName}` : ''}</span></span></div>
                            )}
                            {v.role === 'PropertyInspector' && v.professionalQualifications && (
                              <div className="flex items-start gap-2 text-sm text-gray-700"><FileText size={16} className="text-gray-500 mt-0.5 flex-shrink-0" /><span>Qualifications: <span className="font-semibold">{v.professionalQualifications}</span></span></div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleApprove(v.userId)}
                            disabled={isActioning}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={18} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(v.userId)}
                            disabled={isActioning}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!verificationsLoading && pendingVerifications.length === 0 && !verificationsError && (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-400 mb-3" size={48} />
                    <p className="text-gray-600 font-semibold">No pending verifications</p>
                    <p className="text-sm text-gray-500">All applications have been reviewed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Listings Tab ── */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2 flex-wrap">
                  {(['all', 'active', 'pending', 'suspended'] as const).map((f) => (
                    <button key={f} onClick={() => setListingFilter(f)}
                      className={`px-4 py-2 font-semibold rounded-lg transition-colors ${listingFilter === f ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {f === 'all' ? 'All' : f === 'pending' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {getFilteredListings().length} listing{getFilteredListings().length !== 1 ? 's' : ''}
                </p>
              </div>

              {listingsLoading ? (
                <div className="flex justify-center py-16">
                  <Clock className="animate-spin text-blue-600" size={36} />
                </div>
              ) : listingsError ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                  <p className="text-red-600 font-semibold mb-4">{listingsError}</p>
                  <button onClick={loadListings} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Retry</button>
                </div>
              ) : getFilteredListings().length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <Building className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No listings found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getFilteredListings().map((listing) => (
                    <ListingCard
                      key={listing.listingId}
                      listingId={listing.listingId}
                      title={listing.title}
                      askingPrice={listing.askingPrice}
                      city={listing.city}
                      country={listing.country}
                      listingType={listing.listingType}
                      propertyType={listing.propertyType}
                      status={listing.status}
                      ownerName={listing.ownerName}
                      agentName={listing.agentName}
                      photoUrl={listing.photoUrl}
                      moderationNotes={listing.moderationNotes}
                      isSelected={selectedListing?.listingId === listing.listingId}
                      actionReason={actionReason}
                      onSelect={() => setSelectedListing(listing)}
                      onCancel={clearAction}
                      onActionReasonChange={setActionReason}
                      onSuspend={() => handleSuspendListing(listing)}
                      onRemove={() => handleRemoveListing(listing)}
                      actionLoading={listingActionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2 flex-wrap">
                {(['all', 'buyer', 'owner', 'agent', 'inspector'] as const).map((f) => (
                  <button key={f} onClick={() => setUserRoleFilter(f)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${userRoleFilter === f ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {f === 'all' ? 'All Users' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                  </button>
                ))}
              </div>

              {usersLoading && (
                <div className="flex justify-center py-8">
                  <Clock className="animate-spin text-blue-600" size={32} />
                </div>
              )}
              {usersError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
                  <span>{usersError}</span>
                  <button onClick={loadUsers} className="ml-3 underline font-semibold">Retry</button>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                          <th key={h} className="px-6 py-4 text-left text-sm font-bold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredUsers().map((user) => {
                        const fullName = `${user.firstName} ${user.lastName}`.trim();
                        const initials = [user.firstName[0], user.lastName[0]].filter(Boolean).join('');
                        const roleLabel = user.role === 'PropertyInspector' ? 'INSPECTOR' : user.role.toUpperCase();
                        return (
                        <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{fullName}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5"><Mail size={14} /><span>{user.email}</span></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getRoleColor(user.role)}`}>{roleLabel}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(user.accountStatus)}`}>{user.accountStatus.toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={16} /><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
                          </td>
                          <td className="px-6 py-4">
                            {selectedUser?.userId === user.userId ? (
                              <div className="space-y-2">
                                <input type="text" value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                                  placeholder="Reason for action..."
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                <div className="flex gap-2">
                                  <button onClick={() => handleSuspendUser(user)} disabled={!actionReason.trim() || userSuspending}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                                    {userSuspending ? 'Suspending…' : 'Suspend'}
                                  </button>
                                  <button onClick={clearAction} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                {(user.role === 'Agent' || user.role === 'PropertyInspector') && user.isVerified === false && (
                                  <button
                                    onClick={() => handleVerifyUser(user)}
                                    disabled={userVerifying === user.userId}
                                    title="Verify this user"
                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    {userVerifying === user.userId
                                      ? <Loader2 size={18} className="animate-spin" />
                                      : <UserCheck size={18} />}
                                  </button>
                                )}
                                <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Eye size={18} /></button>
                                <button onClick={() => setSelectedUser(user)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><Edit size={18} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { role: 'Buyer',             label: 'Buyers',     icon: <Users          className="text-blue-600"   size={32} /> },
                  { role: 'Owner',             label: 'Owners',     icon: <Home           className="text-green-600"  size={32} /> },
                  { role: 'Agent',             label: 'Agents',     icon: <Shield         className="text-purple-600" size={32} /> },
                  { role: 'PropertyInspector', label: 'Inspectors', icon: <ClipboardCheck className="text-orange-600" size={32} /> },
                ].map(({ role, label, icon }) => (
                  <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      {icon}
                      <span className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === role).length}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reports Tab ── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2">
                {([
                  { value: 'all',       label: 'All' },
                  { value: 'ongoing',   label: 'Ongoing' },
                  { value: 'submitted', label: 'Submitted' },
                ] as const).map((f) => (
                  <button key={f.value} onClick={() => setReportFilter(f.value)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${reportFilter === f.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {inspectionsLoading ? (
                <div className="flex justify-center py-16"><Clock className="animate-spin text-blue-600" size={36} /></div>
              ) : inspectionsError ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                  <p className="text-red-600 font-semibold mb-3">{inspectionsError}</p>
                  <button onClick={loadInspections} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Retry</button>
                </div>
              ) : getFilteredReports().length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <ClipboardCheck className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No inspections found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredReports().map((insp) => {
                    const verdictColor = insp.finalVerdict === 'Passed'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : insp.finalVerdict === 'PassedWithConditions'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : insp.finalVerdict === 'Failed'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';
                    return (
                      <div key={insp.inspectionId} className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <ClipboardCheck className="text-blue-600 flex-shrink-0" size={24} />
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{insp.propertyTitle}</h3>
                              {insp.finalVerdict && (
                                <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${verdictColor}`}>
                                  {insp.finalVerdict.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                </span>
                              )}
                              {insp.reportLocked && !insp.finalVerdict && (
                                <span className="px-3 py-1.5 text-xs font-bold rounded-full border bg-blue-100 text-blue-700 border-blue-200">REPORT LOCKED</span>
                              )}
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-700"><Users    size={16} className="text-gray-500" /><span>Inspector: <span className="font-semibold">{insp.inspectorName}</span></span></div>
                              <div className="flex items-center gap-2 text-sm text-gray-700"><Shield   size={16} className="text-gray-500" /><span>Agent: <span className="font-semibold">{insp.agentName}</span></span></div>
                              <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={16} className="text-gray-500" /><span>Scheduled: <span className="font-semibold">{new Date(insp.scheduledDate).toLocaleDateString()}</span></span></div>
                              {insp.completedAt && (
                                <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle size={16} className="text-gray-500" /><span>Completed: <span className="font-semibold">{new Date(insp.completedAt).toLocaleDateString()}</span></span></div>
                              )}
                              <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(insp.status)}`}>
                                {insp.status.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setSelectedReport(selectedReport?.inspectionId === insp.inspectionId ? null : insp)}
                              className="px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                              <Eye size={18} /> Details
                            </button>
                          </div>
                        </div>
                        {selectedReport?.inspectionId === insp.inspectionId && (
                          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                            <p><span className="font-semibold">Has Report:</span> {insp.hasReport ? 'Yes' : 'No'}</p>
                            <p><span className="font-semibold">Report Locked:</span> {insp.reportLocked ? 'Yes' : 'No'}</p>
                            {insp.finalVerdict && <p><span className="font-semibold">Final Verdict:</span> {insp.finalVerdict.replace(/([A-Z])/g, ' $1').trim()}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { key: 'Passed',               label: 'Passed',                 bg: 'bg-green-50',  border: 'border-green-200',  tc: 'text-green-600',  icon: <CheckCircle className="text-green-600"  size={32} /> },
                  { key: 'PassedWithConditions',  label: 'Passed with Conditions', bg: 'bg-yellow-50', border: 'border-yellow-200', tc: 'text-yellow-600', icon: <AlertCircle className="text-yellow-600" size={32} /> },
                  { key: 'Failed',                label: 'Failed',                 bg: 'bg-red-50',    border: 'border-red-200',    tc: 'text-red-600',    icon: <XCircle     className="text-red-600"    size={32} /> },
                ].map(({ key, label, bg, border, tc, icon }) => (
                  <div key={key} className={`${bg} rounded-xl p-6 border-2 ${border}`}>
                    <div className="flex items-center justify-between mb-4">
                      {icon}
                      <span className={`text-3xl font-bold ${tc}`}>{inspections.filter(i => i.finalVerdict === key).length}</span>
                    </div>
                    <p className={`text-sm font-semibold ${tc.replace('600', '900')}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Disputes Tab ── */}
          {activeTab === 'disputes' && (
            <div className="space-y-6">
              {!selectedDispute ? (
                <>
                  {/* Filter bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2 flex-wrap">
                    {([
                      { value: 'all',         label: 'All Disputes' },
                      { value: 'Open',        label: 'Open' },
                      { value: 'UnderReview', label: 'Under Review' },
                      { value: 'Resolved',    label: 'Resolved' },
                    ] as const).map((f) => (
                      <button key={f.value} onClick={() => setDisputeFilter(f.value)}
                        className={`px-4 py-2 font-semibold rounded-lg transition-colors ${disputeFilter === f.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {disputesLoading ? (
                    <div className="flex justify-center py-16"><Clock className="animate-spin text-blue-600" size={36} /></div>
                  ) : disputesError ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                      <p className="text-red-600 font-semibold mb-3">{disputesError}</p>
                      <button onClick={loadDisputes} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Retry</button>
                    </div>
                  ) : getFilteredDisputes().length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                      <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-600 font-semibold">No disputes found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFilteredDisputes().map((dispute) => {
                        const statusColor =
                          dispute.status === 'Open'        ? 'bg-red-100 text-red-700 border-red-200' :
                          dispute.status === 'UnderReview' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          dispute.status === 'Resolved'    ? 'bg-green-100 text-green-700 border-green-200' :
                                                             'bg-blue-100 text-blue-700 border-blue-200';
                        return (
                          <div key={dispute.disputeId} className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <MessageSquare className="text-blue-600 flex-shrink-0" size={22} />
                                  <h3 className="text-lg font-bold text-gray-900">{dispute.propertyTitle}</h3>
                                  <span className="text-xs text-gray-500 font-medium">#{dispute.disputeId}</span>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor}`}>
                                    {dispute.status.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                                  <span>By <strong>{dispute.submittedByFullName}</strong></span>
                                  <span className="text-gray-400">·</span>
                                  <span>{new Date(dispute.submittedAt).toLocaleDateString()}</span>
                                  {dispute.resolvedAt && (
                                    <>
                                      <span className="text-gray-400">·</span>
                                      <span className="text-green-700">Resolved {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
                              </div>
                              <button
                                onClick={() => { setSelectedDispute(dispute); setActionReason(''); }}
                                className="flex-shrink-0 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                              >
                                <Eye size={16} /> Review
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {[
                      { status: 'Open',        label: 'Open',         bg: 'bg-red-50',    border: 'border-red-200',    tc: 'text-red-600',    icon: <AlertCircle className="text-red-600"    size={32} /> },
                      { status: 'UnderReview', label: 'Under Review', bg: 'bg-yellow-50', border: 'border-yellow-200', tc: 'text-yellow-600', icon: <Search      className="text-yellow-600" size={32} /> },
                      { status: 'Resolved',    label: 'Resolved',     bg: 'bg-green-50',  border: 'border-green-200',  tc: 'text-green-600',  icon: <CheckCircle className="text-green-600"  size={32} /> },
                      { status: 'Escalated',   label: 'Escalated',    bg: 'bg-blue-50',   border: 'border-blue-200',   tc: 'text-blue-600',   icon: <XCircle     className="text-blue-600"   size={32} /> },
                    ].map(({ status, label, bg, border, tc, icon }) => (
                      <div key={status} className={`${bg} rounded-xl p-6 border-2 ${border}`}>
                        <div className="flex items-center justify-between mb-4">
                          {icon}
                          <span className={`text-3xl font-bold ${tc}`}>{disputes.filter(d => d.status === status).length}</span>
                        </div>
                        <p className={`text-sm font-semibold ${tc.replace('600', '900')}`}>{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* ── Dispute Detail / Context View ── */
                <div className="max-w-4xl mx-auto space-y-6">
                  <button
                    onClick={() => { setSelectedDispute(null); setActionReason(''); }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <ChevronRight size={20} className="rotate-180" /> Back to Disputes
                  </button>

                  {/* Header */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1">DISPUTE #{selectedDispute.disputeId} · TRANSACTION #{selectedDispute.transactionId}</p>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedDispute.propertyTitle}</h2>
                        <p className="text-sm text-gray-500 mt-1">{selectedDispute.listingAddress}</p>
                      </div>
                      <span className={`px-4 py-2 text-sm font-bold rounded-full border ${
                        selectedDispute.status === 'Open'        ? 'bg-red-100 text-red-700 border-red-200' :
                        selectedDispute.status === 'UnderReview' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        selectedDispute.status === 'Resolved'    ? 'bg-green-100 text-green-700 border-green-200' :
                                                                   'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {selectedDispute.status.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Context */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Parties */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" /> Transaction Parties
                      </h3>
                      <div className="space-y-3">
                        {[
                          { role: 'Buyer',   name: selectedDispute.buyerName },
                          { role: 'Owner',   name: selectedDispute.ownerName },
                          { role: 'Agent',   name: selectedDispute.agentName },
                          { role: 'Submitted by', name: selectedDispute.submittedByFullName },
                        ].map(({ role, name }) => (
                          <div key={role} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-500 font-medium">{role}</span>
                            <span className="text-sm font-bold text-gray-900">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Offer & Listing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-blue-600" /> Offer Summary
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Asking Price',      value: formatPrice(selectedDispute.askingPrice) },
                          { label: 'Accepted Offer',    value: formatPrice(selectedDispute.acceptedOfferPrice) },
                          { label: 'Negotiation Rounds', value: `${selectedDispute.negotiationRounds} round${selectedDispute.negotiationRounds !== 1 ? 's' : ''}` },
                          { label: 'Inspection Verdict', value: selectedDispute.inspectionVerdict
                              ? selectedDispute.inspectionVerdict.replace(/([A-Z])/g, ' $1').trim()
                              : 'No inspection' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-500 font-medium">{label}</span>
                            <span className={`text-sm font-bold ${
                              label === 'Inspection Verdict' && selectedDispute.inspectionVerdict === 'Failed'    ? 'text-red-600' :
                              label === 'Inspection Verdict' && selectedDispute.inspectionVerdict === 'Passed'    ? 'text-green-600' :
                              label === 'Inspection Verdict' && selectedDispute.inspectionVerdict?.includes('Conditions') ? 'text-yellow-600' :
                              'text-gray-900'
                            }`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dispute Description */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare size={18} className="text-blue-600" /> Dispute Description
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">{selectedDispute.description}</p>
                    <p className="text-xs text-gray-500">
                      Submitted by <strong>{selectedDispute.submittedByFullName}</strong> on {new Date(selectedDispute.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Resolution */}
                  {selectedDispute.status === 'Resolved' ? (
                    <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle size={18} /> Resolution Outcome
                      </h3>
                      <p className="text-sm text-green-800">{selectedDispute.resolutionOutcome}</p>
                      {selectedDispute.resolvedAt && (
                        <p className="text-xs text-green-700 mt-3">Resolved on {new Date(selectedDispute.resolvedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" /> Resolve Dispute
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Notes <span className="text-red-500">*</span></label>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Describe the resolution outcome and any actions taken…"
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          />
                        </div>
                        <button
                          onClick={() => handleResolveDispute(selectedDispute)}
                          disabled={!actionReason.trim() || disputeResolving}
                          className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          {disputeResolving ? 'Resolving…' : 'Resolve Dispute'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">{notifications.filter(n => !n.isRead).length} unread notification{notifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}</p>
                <button onClick={handleMarkAllAsRead} className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">Mark all as read</button>
              </div>
              <div className={`space-y-3 max-h-[70vh] overflow-y-auto ${styles.scrollableArea}`}>
                {notifications.map((n) => (
                  <div key={n.notificationId} onClick={() => handleMarkAsRead(n.notificationId)} className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer ${!n.isRead ? 'bg-blue-50 border-blue-200 hover:shadow-md' : 'bg-gray-50 border-gray-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${n.type === 'AccountDecision' ? 'bg-blue-100' : n.type === 'DisputeUpdate' ? 'bg-red-100' : n.type === 'ListingStatus' ? 'bg-orange-100' : n.type === 'InspectionUpdate' ? 'bg-purple-100' : n.type === 'MessageReceived' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                        {n.type === 'AccountDecision'   && <UserCheck      className="text-blue-600"   size={20} />}
                        {n.type === 'DisputeUpdate'     && <MessageSquare  className="text-red-600"    size={20} />}
                        {n.type === 'ListingStatus'     && <Flag           className="text-orange-600" size={20} />}
                        {n.type === 'InspectionUpdate'  && <ClipboardCheck className="text-purple-600" size={20} />}
                        {n.type === 'MessageReceived'   && <Bell           className="text-gray-600"   size={20} />}
                        {n.type === 'OfferResponse'     && <FileText       className="text-blue-600"   size={20} />}
                        {n.type === 'TransactionClosed' && <CheckCircle    className="text-green-600"  size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500"><Clock size={14} /><span>{formatNotificationDate(n.createdAt)}</span></div>
                      </div>
                      {!n.isRead && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}