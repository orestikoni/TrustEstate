'use client';

import React, { useState } from 'react';
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
  Trash2,
  AlertCircle,
  Activity,
  Calendar,
  Mail,
  Flag,
  Ban,
  FileText,
  MessageSquare,
  Bell,
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

interface PendingVerification {
  id: number;
  userName: string;
  userEmail: string;
  role: 'buyer' | 'owner' | 'agent' | 'inspector';
  documentType: 'identity' | 'license' | 'certification';
  submittedDate: string;
  expiresIn: string;
  documentUrl: string;
}

interface ManagedListing {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  owner: string;
  status: 'active' | 'flagged' | 'suspended' | 'removed';
  views: number;
  flagCount: number;
}

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'owner' | 'agent' | 'inspector';
  status: 'active' | 'suspended' | 'deactivated' | 'pending_verification';
  joinedDate: string;
  lastActive: string;
  listings?: number;
  totalSpent?: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

interface InspectionReportReview {
  id: number;
  propertyTitle: string;
  inspectorName: string;
  submittedDate: string;
  verdict: 'passed' | 'passed_with_conditions' | 'failed';
  flaggedBy: string | null;
  status: 'active' | 'flagged' | 'removed';
}

interface Dispute {
  id: number;
  disputeType: 'transaction' | 'listing' | 'inspection' | 'user_conduct';
  initiatedBy: string;
  respondent: string;
  propertyTitle: string;
  submittedDate: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  description: string;
}

interface Notification {
  id: number;
  type: 'verification' | 'flag' | 'dispute' | 'report';
  message: string;
  timestamp: string;
  read: boolean;
}

const pendingVerifications: PendingVerification[] = [
  { id: 1, userName: 'Robert Chen',  userEmail: 'robert.c@email.com', role: 'agent',     documentType: 'license',       submittedDate: '2026-05-08', expiresIn: '48h', documentUrl: '#' },
  { id: 2, userName: 'Maria Garcia', userEmail: 'maria.g@email.com',  role: 'inspector', documentType: 'certification', submittedDate: '2026-05-09', expiresIn: '24h', documentUrl: '#' },
  { id: 3, userName: 'James Wilson', userEmail: 'james.w@email.com',  role: 'owner',     documentType: 'identity',      submittedDate: '2026-05-07', expiresIn: '72h', documentUrl: '#' },
];

const managedListings: ManagedListing[] = [
  { id: 1, title: 'Luxury Estate Mansion',       price: 4500000, location: 'Beverly Hills, CA', bedrooms: 7, bathrooms: 6, area: 8500, image: 'https://images.unsplash.com/photo-1505843795480-5cfb3c03f6ff?w=600&auto=format&fit=crop',  owner: 'Robert Chen',       status: 'active',    views: 1247, flagCount: 0 },
  { id: 2, title: 'Modern City Apartment',       price: 875000,  location: 'New York, NY',       bedrooms: 3, bathrooms: 2, area: 2100, image: 'https://images.unsplash.com/photo-1635933036183-d1f250072745?w=600&auto=format&fit=crop',  owner: 'Jennifer Martinez', status: 'flagged',   views: 892,  flagCount: 3 },
  { id: 3, title: 'Coastal Beach House',         price: 2300000, location: 'Malibu, CA',         bedrooms: 5, bathrooms: 4, area: 4200, image: 'https://images.unsplash.com/photo-1631607608345-598c70e0410b?w=600&auto=format&fit=crop',  owner: 'David Thompson',    status: 'active',    views: 2103, flagCount: 0 },
  { id: 4, title: 'Suspicious Property Listing', price: 450000,  location: 'Unknown, CA',        bedrooms: 2, bathrooms: 1, area: 1200, image: 'https://images.unsplash.com/photo-1762575537664-0f2c7e0c7f48?w=600&auto=format&fit=crop',  owner: 'Unknown User',      status: 'suspended', views: 45,   flagCount: 12 },
];

const platformUsers: PlatformUser[] = [
  { id: 1, name: 'John Doe',       email: 'john.doe@email.com',  phone: '+1 (555) 123-4567', role: 'buyer',     status: 'active',               joinedDate: '2024-01-15', lastActive: '2026-05-10', totalSpent: 1250000, verificationStatus: 'verified' },
  { id: 2, name: 'Michael Wilson', email: 'michael.w@email.com', phone: '+1 (555) 234-5678', role: 'owner',     status: 'active',               joinedDate: '2024-02-01', lastActive: '2026-05-09', listings: 4,         verificationStatus: 'verified' },
  { id: 3, name: 'Sarah Anderson', email: 'sarah.a@email.com',   phone: '+1 (555) 345-6789', role: 'agent',     status: 'active',               joinedDate: '2024-01-20', lastActive: '2026-05-10', listings: 8,         verificationStatus: 'verified' },
  { id: 4, name: 'Emily Chen',     email: 'emily.c@email.com',   phone: '+1 (555) 456-7890', role: 'buyer',     status: 'active',               joinedDate: '2024-03-05', lastActive: '2026-05-08',                      verificationStatus: 'verified' },
  { id: 5, name: 'David Miller',   email: 'david.m@email.com',   phone: '+1 (555) 567-8901', role: 'owner',     status: 'pending_verification', joinedDate: '2024-03-12', lastActive: '2026-05-07',                      verificationStatus: 'pending' },
  { id: 6, name: 'Lisa Thompson',  email: 'lisa.t@email.com',    phone: '+1 (555) 678-9012', role: 'agent',     status: 'suspended',            joinedDate: '2024-02-15', lastActive: '2026-04-28', listings: 3,         verificationStatus: 'verified' },
];

const inspectionReports: InspectionReportReview[] = [
  { id: 1, propertyTitle: 'Luxury Estate Mansion', inspectorName: 'Mark Johnson', submittedDate: '2026-05-08', verdict: 'passed',                 flaggedBy: null,                       status: 'active' },
  { id: 2, propertyTitle: 'Modern City Apartment', inspectorName: 'Lisa Parker',  submittedDate: '2026-05-09', verdict: 'passed_with_conditions', flaggedBy: 'Owner: Jennifer Martinez', status: 'flagged' },
  { id: 3, propertyTitle: 'Coastal Beach House',   inspectorName: 'Tom Richards', submittedDate: '2026-05-07', verdict: 'failed',                 flaggedBy: null,                       status: 'active' },
];

const disputes: Dispute[] = [
  { id: 1, disputeType: 'transaction', initiatedBy: 'John Doe (Buyer)',       respondent: 'Sarah Anderson (Agent)',    propertyTitle: 'Luxury Estate Mansion', submittedDate: '2026-05-09', status: 'open',          priority: 'high',   description: 'Buyer claims agent misrepresented property condition during showing.' },
  { id: 2, disputeType: 'inspection',  initiatedBy: 'Michael Wilson (Owner)', respondent: 'Mark Johnson (Inspector)', propertyTitle: 'Modern City Apartment', submittedDate: '2026-05-08', status: 'investigating', priority: 'medium', description: 'Owner disputes inspection report findings on electrical system.' },
  { id: 3, disputeType: 'listing',     initiatedBy: 'Emily Chen (Buyer)',     respondent: 'David Thompson (Owner)',   propertyTitle: 'Coastal Beach House',   submittedDate: '2026-05-07', status: 'resolved',      priority: 'low',    description: 'Buyer reported inaccurate square footage in listing. Resolved: listing updated.' },
];

const notifications: Notification[] = [
  { id: 1, type: 'verification', message: 'New verification request from Maria Garcia (Inspector)',             timestamp: '2026-05-10 08:30 AM', read: false },
  { id: 2, type: 'dispute',      message: 'New dispute opened: Transaction dispute for Luxury Estate Mansion', timestamp: '2026-05-09 03:45 PM', read: false },
  { id: 3, type: 'flag',         message: 'Listing flagged 3 times: Modern City Apartment',                    timestamp: '2026-05-09 11:20 AM', read: true },
  { id: 4, type: 'report',       message: 'Inspection report flagged by owner: Modern City Apartment',         timestamp: '2026-05-08 02:15 PM', read: true },
];

const userGrowthData = [
  { month: 'Jan', buyers: 145, owners: 78,  agents: 23 },
  { month: 'Feb', buyers: 189, owners: 92,  agents: 28 },
  { month: 'Mar', buyers: 234, owners: 108, agents: 34 },
  { month: 'Apr', buyers: 267, owners: 125, agents: 41 },
  { month: 'May', buyers: 312, owners: 143, agents: 48 },
  { month: 'Jun', buyers: 356, owners: 167, agents: 55 },
];

const listingActivityData = [
  { week: 'Week 1', submitted: 12, approved: 10, rejected: 2 },
  { week: 'Week 2', submitted: 15, approved: 13, rejected: 2 },
  { week: 'Week 3', submitted: 18, approved: 15, rejected: 3 },
  { week: 'Week 4', submitted: 14, approved: 12, rejected: 2 },
];

const revenueData = [
  { month: 'Jan', revenue: 450000  },
  { month: 'Feb', revenue: 580000  },
  { month: 'Mar', revenue: 720000  },
  { month: 'Apr', revenue: 650000  },
  { month: 'May', revenue: 890000  },
  { month: 'Jun', revenue: 1020000 },
];

const userDistributionData = [
  { name: 'Buyers',     value: platformUsers.filter(u => u.role === 'buyer').length,     color: '#3b82f6' },
  { name: 'Owners',     value: platformUsers.filter(u => u.role === 'owner').length,     color: '#10b981' },
  { name: 'Agents',     value: platformUsers.filter(u => u.role === 'agent').length,     color: '#8b5cf6' },
  { name: 'Inspectors', value: platformUsers.filter(u => u.role === 'inspector').length, color: '#f59e0b' },
].filter(item => item.value > 0);

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'verifications' | 'listings' | 'users' | 'reports' | 'disputes' | 'notifications'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [selectedListing, setSelectedListing] = useState<ManagedListing | null>(null);
  const [selectedReport, setSelectedReport] = useState<InspectionReportReview | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [listingFilter, setListingFilter] = useState<'all' | 'active' | 'flagged' | 'suspended'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'buyer' | 'owner' | 'agent' | 'inspector'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'active' | 'flagged'>('all');
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved':   return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': case 'reviewing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'suspended': case 'rejected':return 'bg-red-100 text-red-700 border-red-200';
      default:                          return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':     return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'owner':     return 'bg-green-100 text-green-700 border-green-200';
      case 'agent':     return 'bg-purple-100 text-purple-700 border-purple-200';
      default:          return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':   return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':    return 'bg-blue-100 text-blue-700 border-blue-200';
      default:       return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const clearAction = () => {
    setSelectedListing(null);
    setSelectedUser(null);
    setSelectedReport(null);
    setSelectedDispute(null);
    setActionReason('');
  };

  const getFilteredListings = () =>
    listingFilter === 'all' ? managedListings : managedListings.filter(l => l.status === listingFilter);

  const getFilteredUsers = () =>
    userRoleFilter === 'all' ? platformUsers : platformUsers.filter(u => u.role === userRoleFilter);

  const getFilteredReports = () =>
    reportFilter === 'all' ? inspectionReports : inspectionReports.filter(r => r.status === reportFilter);

  const getFilteredDisputes = () =>
    disputeFilter === 'all' ? disputes : disputes.filter(d => d.status === disputeFilter);

  const Sidebar = () => (
    <div className="h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-500/30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
            <img src="/images/logo.png" alt="TrustEstate" className="w-10 h-10 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          </div>
        </Link>
      </div>

      {/* Admin Profile */}
      <div className="p-6 border-b border-gray-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">AD</div>
          <div>
            <p className="font-bold text-white">Admin User</p>
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
            count: managedListings.filter(l => l.status === 'flagged').length, countColor: 'bg-red-600' },
          { tab: 'users',         icon: <Users          size={20} />, label: 'Users',
            count: platformUsers.length },
          { tab: 'reports',       icon: <ClipboardCheck size={20} />, label: 'Reports',
            count: inspectionReports.filter(r => r.status === 'flagged').length, countColor: 'bg-orange-600' },
          { tab: 'disputes',      icon: <MessageSquare  size={20} />, label: 'Disputes',
            count: disputes.filter(d => d.status === 'open').length, countColor: 'bg-red-600' },
          { tab: 'notifications', icon: <Bell           size={20} />, label: 'Notifications',
            count: notifications.filter(n => !n.read).length, countColor: 'bg-red-600' },
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
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-200 hover:bg-gray-500/30 transition-all">
          <Settings size={20} /> Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/20 transition-all">
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
        <header className="bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 border-b border-gray-500/30 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-500/30 rounded-lg transition-colors text-white">
                  <Menu size={24} />
                </button>
                <h1 className="text-2xl font-bold text-white">
                  {activeTab === 'dashboard'     && 'Platform Analytics'}
                  {activeTab === 'verifications' && 'Pending Verifications'}
                  {activeTab === 'listings'      && 'Listings Management'}
                  {activeTab === 'users'         && 'User Management'}
                  {activeTab === 'reports'       && 'Inspection Reports'}
                  {activeTab === 'disputes'      && 'Dispute Resolution'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
              </div>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input type="text" placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-600/50 border-2 border-gray-500/30 text-white placeholder-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Analytics Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active Listings',       value: managedListings.filter(l => l.status === 'active').length,                              sub: '+8% this week',           subColor: 'text-green-600',  icon: <Building      className="text-blue-500"    size={24} /> },
                  { label: 'Flagged Listings',       value: managedListings.filter(l => l.status === 'flagged' || l.status === 'suspended').length, sub: 'Requires attention',      subColor: 'text-orange-600', icon: <Flag          className="text-orange-500"  size={24} /> },
                  { label: 'Pending Verifications',  value: pendingVerifications.length,                                                            sub: '72h review window',       subColor: 'text-purple-600', icon: <Clock         className="text-purple-500"  size={24} /> },
                  { label: 'Open Disputes',          value: disputes.filter(d => d.status === 'open' || d.status === 'investigating').length,       sub: 'Immediate action needed', subColor: 'text-red-600',    icon: <MessageSquare className="text-red-500"     size={24} /> },
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
                  { gradient: 'from-blue-500 to-blue-600',     icon: <Activity      className="text-white/80 mb-4" size={32} />, label: 'Total Listings',      value: managedListings.length,                                                  sub: `${managedListings.filter(l => l.status === 'active').length} active` },
                  { gradient: 'from-green-500 to-green-600',   icon: <UserCheck     className="text-white/80 mb-4" size={32} />, label: 'Verified Users',      value: platformUsers.filter(u => u.verificationStatus === 'verified').length,   sub: `Out of ${platformUsers.length} total` },
                  { gradient: 'from-orange-500 to-orange-600', icon: <ClipboardCheck className="text-white/80 mb-4" size={32} />, label: 'Inspection Reports', value: inspectionReports.length,                                                sub: `${inspectionReports.filter(r => r.status === 'flagged').length} flagged` },
                  { gradient: 'from-purple-500 to-purple-600', icon: <DollarSign    className="text-white/80 mb-4" size={32} />, label: 'Platform Revenue',    value: '$1.02M',                                                                sub: 'This month' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white`}>
                    {stat.icon}
                    <p className="text-sm font-semibold text-white/90 mb-2">{stat.label}</p>
                    <p className="text-4xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm text-white/80">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Verifications Tab ── */}
          {activeTab === 'verifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 mb-6">
                {pendingVerifications.length} verification{pendingVerifications.length !== 1 ? 's' : ''} pending approval (72-hour review window)
              </p>
              <div className="space-y-4">
                {pendingVerifications.map((v) => (
                  <div key={v.id} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <UserCheck className="text-blue-600" size={24} />
                          <h3 className="text-xl font-bold text-gray-900">{v.userName}</h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getRoleColor(v.role)}`}>
                            {v.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Mail     size={16} className="text-gray-500" /><span>{v.userEmail}</span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-700"><FileText size={16} className="text-gray-500" /><span>Document type: <span className="font-semibold capitalize">{v.documentType.replace('_', ' ')}</span></span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={16} className="text-gray-500" /><span>Submitted: <span className="font-semibold">{v.submittedDate}</span></span></div>
                          <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-orange-500" /><span className="text-orange-600 font-semibold">Expires in: {v.expiresIn}</span></div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-2 transition-colors">
                          <Eye size={16} /> View Document
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                          <CheckCircle size={18} /> Approve
                        </button>
                        <button className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Listings Tab ── */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2">
                {(['all', 'active', 'flagged', 'suspended'] as const).map((f) => (
                  <button key={f} onClick={() => setListingFilter(f)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors capitalize ${listingFilter === f ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {f === 'all' ? 'All Listings' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {getFilteredListings().length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getFilteredListings().map((listing) => (
                    <ListingCard
                      key={listing.id}
                      {...listing}
                      isSelected={selectedListing?.id === listing.id}
                      actionReason={actionReason}
                      onSelect={() => setSelectedListing(listing)}
                      onCancel={clearAction}
                      onActionReasonChange={setActionReason}
                      onFlag={() => { console.log('Flag:', listing.id, actionReason); clearAction(); }}
                      onSuspend={() => { console.log('Suspend:', listing.id, actionReason); clearAction(); }}
                      onRemove={() => { console.log('Remove:', listing.id, actionReason); clearAction(); }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <Building className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No listings found</p>
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

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['User', 'Role', 'Status', 'Verification', 'Last Active', 'Actions'].map((h) => (
                          <th key={h} className="px-6 py-4 text-left text-sm font-bold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredUsers().map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5"><Mail size={14} /><span>{user.email}</span></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getRoleColor(user.role)}`}>{user.role.toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(user.status)}`}>{user.status.replace(/_/g, ' ').toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                              user.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border-green-200' :
                              user.verificationStatus === 'pending'  ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                       'bg-red-100 text-red-700 border-red-200'
                            }`}>{user.verificationStatus.toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={16} /><span>{user.lastActive}</span></div>
                          </td>
                          <td className="px-6 py-4">
                            {selectedUser?.id === user.id ? (
                              <div className="space-y-2">
                                <input type="text" value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                                  placeholder="Reason for action..."
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                <div className="flex gap-2">
                                  <button onClick={() => { console.log('Suspend user:', user.id, actionReason); clearAction(); }} disabled={!actionReason.trim()}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                                    Suspend
                                  </button>
                                  <button onClick={clearAction} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Eye size={18} /></button>
                                <button onClick={() => setSelectedUser(user)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><Edit size={18} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { role: 'buyer',     label: 'Buyers',     icon: <Users          className="text-blue-600"   size={32} /> },
                  { role: 'owner',     label: 'Owners',     icon: <Home           className="text-green-600"  size={32} /> },
                  { role: 'agent',     label: 'Agents',     icon: <Shield         className="text-purple-600" size={32} /> },
                  { role: 'inspector', label: 'Inspectors', icon: <ClipboardCheck className="text-orange-600" size={32} /> },
                ].map(({ role, label, icon }) => (
                  <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      {icon}
                      <span className="text-3xl font-bold text-gray-900">{platformUsers.filter(u => u.role === role).length}</span>
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
                {(['all', 'active', 'flagged'] as const).map((f) => (
                  <button key={f} onClick={() => setReportFilter(f)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${reportFilter === f ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {f === 'all' ? 'All Reports' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {getFilteredReports().map((report) => (
                  <div key={report.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <ClipboardCheck className="text-blue-600" size={24} />
                          <h3 className="text-xl font-bold text-gray-900">{report.propertyTitle}</h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                            report.verdict === 'passed'                 ? 'bg-green-100 text-green-700 border-green-200' :
                            report.verdict === 'passed_with_conditions' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                          'bg-red-100 text-red-700 border-red-200'
                          }`}>{report.verdict.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Users    size={16} className="text-gray-500" /><span>Inspector: <span className="font-semibold">{report.inspectorName}</span></span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={16} className="text-gray-500" /><span>Submitted: <span className="font-semibold">{report.submittedDate}</span></span></div>
                          {report.flaggedBy && (
                            <div className="flex items-center gap-2 text-sm text-orange-700"><Flag size={16} className="text-orange-500" /><span>Flagged by: <span className="font-semibold">{report.flaggedBy}</span></span></div>
                          )}
                          <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(report.status)}`}>{report.status.toUpperCase()}</span>
                        </div>
                      </div>

                      {selectedReport?.id === report.id ? (
                        <div className="space-y-3 lg:w-80">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Action Reason (Required)</label>
                            <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Explain why this action is being taken..."
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { console.log('Flag report:', report.id, actionReason); clearAction(); }} disabled={!actionReason.trim()}
                              className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                              <Flag size={16} /> Flag
                            </button>
                            <button onClick={() => { console.log('Remove report:', report.id, actionReason); clearAction(); }} disabled={!actionReason.trim()}
                              className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                              <Trash2 size={16} /> Remove
                            </button>
                            <button onClick={clearAction} className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Eye size={18} /> View Report</button>
                          <button onClick={() => setSelectedReport(report)} className="px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"><Edit size={18} /> Manage</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { verdict: 'passed',                 label: 'Passed',                 bg: 'bg-green-50',  border: 'border-green-200',  tc: 'text-green-600',  icon: <CheckCircle className="text-green-600"  size={32} /> },
                  { verdict: 'passed_with_conditions', label: 'Passed with Conditions', bg: 'bg-yellow-50', border: 'border-yellow-200', tc: 'text-yellow-600', icon: <AlertCircle className="text-yellow-600" size={32} /> },
                  { verdict: 'failed',                 label: 'Failed',                 bg: 'bg-red-50',    border: 'border-red-200',    tc: 'text-red-600',    icon: <XCircle     className="text-red-600"    size={32} /> },
                ].map(({ verdict, label, bg, border, tc, icon }) => (
                  <div key={verdict} className={`${bg} rounded-xl p-6 border-2 ${border}`}>
                    <div className="flex items-center justify-between mb-4">
                      {icon}
                      <span className={`text-3xl font-bold ${tc}`}>{inspectionReports.filter(r => r.verdict === verdict).length}</span>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2">
                {(['all', 'open', 'investigating', 'resolved'] as const).map((f) => (
                  <button key={f} onClick={() => setDisputeFilter(f)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${disputeFilter === f ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {f === 'all' ? 'All Disputes' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {getFilteredDisputes().map((dispute) => (
                  <div key={dispute.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <MessageSquare className="text-blue-600" size={24} />
                          <h3 className="text-xl font-bold text-gray-900">{dispute.propertyTitle}</h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                            dispute.disputeType === 'transaction'  ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            dispute.disputeType === 'listing'      ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            dispute.disputeType === 'inspection'   ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                     'bg-red-100 text-red-700 border-red-200'
                          }`}>{dispute.disputeType.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Users    size={16} className="text-gray-500" /><span>Initiated by: <span className="font-semibold">{dispute.initiatedBy}</span></span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Users    size={16} className="text-gray-500" /><span>Respondent: <span className="font-semibold">{dispute.respondent}</span></span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={16} className="text-gray-500" /><span>Submitted: <span className="font-semibold">{dispute.submittedDate}</span></span></div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(dispute.status)}`}>{dispute.status.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getPriorityColor(dispute.priority)}`}>{dispute.priority.toUpperCase()} PRIORITY</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-700 font-semibold mb-1">Description:</p>
                          <p className="text-sm text-gray-600">{dispute.description}</p>
                        </div>
                      </div>

                      {selectedDispute?.id === dispute.id ? (
                        <div className="space-y-3 lg:w-80">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Notes (Required)</label>
                            <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Enter resolution details..."
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { console.log('Resolve dispute:', dispute.id, actionReason); clearAction(); }} disabled={!actionReason.trim()}
                              className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                              <CheckCircle size={16} /> Resolve
                            </button>
                            <button onClick={clearAction} className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Eye size={18} /> View Details</button>
                          <button onClick={() => setSelectedDispute(dispute)} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"><CheckCircle size={18} /> Resolve</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { status: 'open',          label: 'Open',         bg: 'bg-red-50',    border: 'border-red-200',    tc: 'text-red-600',    icon: <AlertCircle  className="text-red-600"    size={32} /> },
                  { status: 'investigating', label: 'Investigating', bg: 'bg-yellow-50', border: 'border-yellow-200', tc: 'text-yellow-600', icon: <Search       className="text-yellow-600" size={32} /> },
                  { status: 'resolved',      label: 'Resolved',     bg: 'bg-green-50',  border: 'border-green-200',  tc: 'text-green-600',  icon: <CheckCircle  className="text-green-600"  size={32} /> },
                  { status: 'closed',        label: 'Closed',       bg: 'bg-blue-50',   border: 'border-blue-200',   tc: 'text-blue-600',   icon: <XCircle      className="text-blue-600"   size={32} /> },
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
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">{notifications.filter(n => !n.read).length} unread notification{notifications.filter(n => !n.read).length !== 1 ? 's' : ''}</p>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">Mark all as read</button>
              </div>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-5 rounded-xl border-2 transition-all ${!n.read ? 'bg-blue-50 border-blue-200 hover:shadow-md' : 'bg-gray-50 border-gray-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${n.type === 'verification' ? 'bg-blue-100' : n.type === 'dispute' ? 'bg-red-100' : n.type === 'flag' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                        {n.type === 'verification' && <UserCheck      className="text-blue-600"   size={20} />}
                        {n.type === 'dispute'      && <MessageSquare  className="text-red-600"    size={20} />}
                        {n.type === 'flag'         && <Flag           className="text-orange-600" size={20} />}
                        {n.type === 'report'       && <ClipboardCheck className="text-purple-600" size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500"><Clock size={14} /><span>{n.timestamp}</span></div>
                      </div>
                      {!n.read && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
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