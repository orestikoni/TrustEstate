'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  ClipboardCheck,
  Settings,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Square,
  Menu,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  Calendar,
  Clock,
  ChevronRight,
  Award,
  Upload,
  Send,
  Eye,
  FileText,
  User,
  Phone,
  Mail,
  Camera,
  AlertTriangle,
} from 'lucide-react';

type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'report_submitted';
type Severity = 'minor' | 'moderate' | 'critical';
type Rating = 'pass' | 'fail';
type FinalVerdict = 'passed' | 'passed_with_conditions' | 'failed';

interface AssignedInspection {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  scheduledDate: string;
  scheduledTime: string;
  status: InspectionStatus;
  agentName: string;
  agentId: number;
  agentPhone: string;
  agentEmail: string;
  ownerName: string;
  assignedDate: string;
  hasReport: boolean;
  finalVerdict?: FinalVerdict;
}

interface CategoryFindings {
  findings: string;
  rating: Rating | '';
  severity: Severity | '';
  photos: File[];
}

interface InspectionReport {
  inspectionId: number;
  structuralIntegrity: CategoryFindings;
  plumbing: CategoryFindings;
  electrical: CategoryFindings;
  safety: CategoryFindings;
  finalVerdict?: FinalVerdict;
  submittedDate?: string;
  locked: boolean;
}

interface Notification {
  id: number;
  type: 'assignment' | 'status_update' | 'report_due';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  inspectionId?: number;
}

const mockInspections: AssignedInspection[] = [
  {
    id: 1, propertyId: 101,
    propertyTitle: 'Modern Luxury Villa',
    propertyAddress: '123 Ocean Drive, Beverly Hills, CA 90210',
    propertyImage: 'https://images.unsplash.com/photo-1759355787092-87e4eee09600?w=600&auto=format&fit=crop',
    bedrooms: 5, bathrooms: 4, area: 4500,
    scheduledDate: '2024-03-18', scheduledTime: '10:00 AM',
    status: 'scheduled',
    agentName: 'Sarah Anderson', agentId: 1,
    agentPhone: '(555) 123-4567', agentEmail: 'sarah.a@trustestate.com',
    ownerName: 'Robert Chen', assignedDate: '2024-03-14', hasReport: false,
  },
  {
    id: 2, propertyId: 102,
    propertyTitle: 'Downtown Penthouse',
    propertyAddress: '456 Park Avenue, New York, NY 10022',
    propertyImage: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&auto=format&fit=crop',
    bedrooms: 3, bathrooms: 2, area: 2200,
    scheduledDate: '2024-03-16', scheduledTime: '2:00 PM',
    status: 'in_progress',
    agentName: 'Michael Chen', agentId: 2,
    agentPhone: '(555) 234-5678', agentEmail: 'michael.c@trustestate.com',
    ownerName: 'Jennifer Martinez', assignedDate: '2024-03-12', hasReport: false,
  },
  {
    id: 3, propertyId: 103,
    propertyTitle: 'Beachfront Paradise',
    propertyAddress: '789 Beach Road, San Diego, CA 92101',
    propertyImage: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    bedrooms: 5, bathrooms: 4, area: 4500,
    scheduledDate: '2024-03-14', scheduledTime: '9:00 AM',
    status: 'completed',
    agentName: 'Sarah Anderson', agentId: 1,
    agentPhone: '(555) 123-4567', agentEmail: 'sarah.a@trustestate.com',
    ownerName: 'Lisa Anderson', assignedDate: '2024-03-10', hasReport: false,
  },
  {
    id: 4, propertyId: 104,
    propertyTitle: 'Suburban Family Home',
    propertyAddress: '321 Maple Street, Portland, OR 97201',
    propertyImage: 'https://images.unsplash.com/photo-1765765234094-bc009a3bba62?w=600&auto=format&fit=crop',
    bedrooms: 4, bathrooms: 3, area: 3200,
    scheduledDate: '2024-03-12', scheduledTime: '11:00 AM',
    status: 'report_submitted',
    agentName: 'Emily Rodriguez', agentId: 3,
    agentPhone: '(555) 345-6789', agentEmail: 'emily.r@trustestate.com',
    ownerName: 'David Thompson', assignedDate: '2024-03-08', hasReport: true,
    finalVerdict: 'passed',
  },
];

const mockNotifications: Notification[] = [
  { id: 1, type: 'assignment',    title: 'New Inspection Assigned',     message: 'You have been assigned to inspect Modern Luxury Villa on March 18, 2024', timestamp: '2 hours ago', read: false, inspectionId: 1 },
  { id: 2, type: 'status_update', title: 'Inspection Completed',        message: 'Beachfront Paradise inspection marked as completed. Please submit report.', timestamp: '1 day ago',   read: false, inspectionId: 3 },
  { id: 3, type: 'report_due',    title: 'Report Submission Reminder',  message: 'Report for Downtown Penthouse is due in 2 days',                           timestamp: '2 days ago',  read: true,  inspectionId: 2 },
];

const emptyCategory: CategoryFindings = { findings: '', rating: '', severity: '', photos: [] };

export default function InspectorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'history' | 'notifications'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<AssignedInspection | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showVerdictForm, setShowVerdictForm] = useState(false);

  const [report, setReport] = useState<InspectionReport>({
    inspectionId: 0,
    structuralIntegrity: { ...emptyCategory },
    plumbing:            { ...emptyCategory },
    electrical:          { ...emptyCategory },
    safety:              { ...emptyCategory },
    locked: false,
  });

  const getStatusConfig = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled':        return { label: 'Scheduled',         color: 'bg-blue-100 text-blue-700 border-blue-300',     icon: Calendar };
      case 'in_progress':      return { label: 'In Progress',       color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Clock };
      case 'completed':        return { label: 'Completed',         color: 'bg-orange-100 text-orange-700 border-orange-300', icon: CheckCircle };
      case 'report_submitted': return { label: 'Report Submitted',  color: 'bg-green-100 text-green-700 border-green-300',   icon: FileText };
    }
  };

  const getVerdictConfig = (verdict: FinalVerdict) => {
    switch (verdict) {
      case 'passed':                  return { label: 'PASSED',                  color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'passed_with_conditions':  return { label: 'PASSED WITH CONDITIONS',  color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle };
      case 'failed':                  return { label: 'FAILED',                  color: 'bg-red-100 text-red-700 border-red-300',          icon: XCircle };
    }
  };

  type ReportCategory = keyof Omit<InspectionReport, 'inspectionId' | 'finalVerdict' | 'submittedDate' | 'locked'>;

  const handleUpdateStatus = (inspection: AssignedInspection, newStatus: InspectionStatus) =>
    console.log('Updating status:', { inspectionId: inspection.id, newStatus });

  const handleCategoryChange = (category: ReportCategory, field: keyof CategoryFindings, value: unknown) =>
    setReport((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));

  const handlePhotoUpload = (category: ReportCategory, files: FileList | null) => {
    if (!files) return;
    setReport((prev) => ({
      ...prev,
      [category]: { ...prev[category], photos: [...prev[category].photos, ...Array.from(files)] },
    }));
  };

  const handleSubmitReport = () => {
    const categories: ReportCategory[] = ['structuralIntegrity', 'plumbing', 'electrical', 'safety'];
    for (const cat of categories) {
      const d = report[cat];
      if (!d.findings || !d.rating || !d.severity) {
        alert(`Please complete all fields for ${cat.replace(/([A-Z])/g, ' $1').trim()}`);
        return;
      }
    }
    console.log('Submitting report:', report);
    setReport((prev) => ({ ...prev, locked: true, submittedDate: new Date().toISOString() }));
    setShowReportForm(false);
    setShowVerdictForm(true);
  };

  const handleSubmitVerdict = (verdict: FinalVerdict) => {
    if (window.confirm(`Are you sure you want to submit the final verdict as "${verdict.toUpperCase().replace('_', ' ')}"? This action cannot be undone.`)) {
      console.log('Submitting verdict:', { inspectionId: selectedInspection?.id, verdict });
      setReport((prev) => ({ ...prev, finalVerdict: verdict }));
      setShowVerdictForm(false);
      setSelectedInspection(null);
    }
  };

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
            <p className="text-xs text-blue-200">Inspector Portal</p>
          </div>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">JS</div>
          <div>
            <p className="font-bold text-white">John Smith</p>
            <p className="text-sm text-blue-200">john.s@email.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 rounded-lg">
          <Award className="text-yellow-400" size={16} />
          <span className="text-sm text-white font-medium">Verified Inspector</span>
        </div>
        <p className="text-xs text-blue-200 mt-2">License: INS-12345-CA</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',    icon: <Home size={20} />,          label: 'Dashboard' },
          { tab: 'inspections',  icon: <ClipboardCheck size={20} />,label: 'Assigned Inspections',
            count: mockInspections.filter(i => i.status !== 'report_submitted').length },
          { tab: 'history',      icon: <FileText size={20} />,      label: 'Inspection History' },
          { tab: 'notifications',icon: <Bell size={20} />,          label: 'Notifications',
            count: mockNotifications.filter(n => !n.read).length, countColor: 'bg-red-500' },
        ].map(({ tab, icon, label, count, countColor }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as typeof activeTab); setSelectedInspection(null); }}
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
                  {activeTab === 'dashboard'     && 'Inspector Dashboard'}
                  {activeTab === 'inspections'   && (selectedInspection ? `Inspection — ${selectedInspection.propertyTitle}` : 'Assigned Inspections')}
                  {activeTab === 'history'       && 'Inspection History'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {activeTab === 'dashboard'   && 'Overview of your inspection assignments'}
                  {activeTab === 'inspections' && !selectedInspection && 'View and manage your assigned inspections'}
                  {activeTab === 'history'     && 'View all completed inspection reports'}
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
                  { label: 'Scheduled',      value: mockInspections.filter(i => i.status === 'scheduled').length,        sub: 'Upcoming inspections', icon: <Calendar      className="text-blue-500"   size={24} /> },
                  { label: 'In Progress',    value: mockInspections.filter(i => i.status === 'in_progress').length,      sub: 'Currently ongoing',    icon: <Clock         className="text-purple-500" size={24} /> },
                  { label: 'Pending Reports',value: mockInspections.filter(i => i.status === 'completed').length,        sub: 'Need submission',      icon: <AlertCircle   className="text-orange-500" size={24} /> },
                  { label: 'Completed',      value: mockInspections.filter(i => i.status === 'report_submitted').length, sub: 'This month',           icon: <CheckCircle   className="text-green-500"  size={24} /> },
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
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Upcoming Inspections</h2>
                      <button onClick={() => setActiveTab('inspections')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
                    </div>
                    <div className="space-y-4">
                      {mockInspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').slice(0, 3).map((inspection) => {
                        const sc = getStatusConfig(inspection.status);
                        const Icon = sc.icon;
                        return (
                          <div key={inspection.id}
                            onClick={() => { setSelectedInspection(inspection); setActiveTab('inspections'); }}
                            className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex gap-4">
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={inspection.propertyImage} alt={inspection.propertyTitle} className="w-full h-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-gray-900">{inspection.propertyTitle}</h3>
                                  <span className={`ml-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${sc.color}`}>
                                    <Icon size={14} />{sc.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar size={14} />
                                  <span>{inspection.scheduledDate} at {inspection.scheduledTime}</span>
                                </div>
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
                          <div className={`p-2 rounded-lg ${n.type === 'assignment' ? 'bg-blue-100' : n.type === 'status_update' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {n.type === 'assignment'    && <ClipboardCheck size={16} className="text-blue-600" />}
                            {n.type === 'status_update' && <CheckCircle    size={16} className="text-green-600" />}
                            {n.type === 'report_due'    && <AlertCircle    size={16} className="text-orange-600" />}
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

          {/* ── Assigned Inspections List ── */}
          {activeTab === 'inspections' && !selectedInspection && !showReportForm && !showVerdictForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">
                You have {mockInspections.filter(i => i.status !== 'report_submitted').length} active inspections
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockInspections.filter(i => i.status !== 'report_submitted').map((inspection) => {
                  const sc = getStatusConfig(inspection.status);
                  const Icon = sc.icon;
                  return (
                    <div key={inspection.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                      <div className="relative h-48 overflow-hidden">
                        <img src={inspection.propertyImage} alt={inspection.propertyTitle} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border backdrop-blur-sm ${sc.color}`}>
                            <Icon size={14} />{sc.label}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{inspection.propertyTitle}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-4"><MapPin size={16} /><span className="text-sm line-clamp-1">{inspection.propertyAddress}</span></div>
                        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
                          <div className="flex items-center gap-1.5 text-gray-700"><Bed    size={18} className="text-blue-600" /><span className="text-sm font-semibold">{inspection.bedrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Bath   size={18} className="text-blue-600" /><span className="text-sm font-semibold">{inspection.bathrooms}</span></div>
                          <div className="flex items-center gap-1.5 text-gray-700"><Square size={18} className="text-blue-600" /><span className="text-sm font-semibold">{inspection.area}</span></div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={14} /><span>{inspection.scheduledDate} at {inspection.scheduledTime}</span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-600"><User size={14} /><span>Agent: {inspection.agentName}</span></div>
                        </div>
                        <button onClick={() => setSelectedInspection(inspection)} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <Eye size={18} /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Inspection Detail View ── */}
          {activeTab === 'inspections' && selectedInspection && !showReportForm && !showVerdictForm && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setSelectedInspection(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to All Inspections
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedInspection.propertyTitle}</h2>
                      <p className="text-gray-600 mb-3">{selectedInspection.propertyAddress}</p>
                    </div>
                    {(() => {
                      const sc = getStatusConfig(selectedInspection.status);
                      const Icon = sc.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${sc.color}`}>
                          <Icon size={14} />{sc.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-gray-700"><Bed      size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedInspection.bedrooms} Bedrooms</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Bath     size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedInspection.bathrooms} Bathrooms</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Square   size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedInspection.area} sq ft</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><Calendar size={18} className="text-blue-600" /><span className="text-sm font-semibold">{selectedInspection.scheduledDate}</span></div>
                  </div>
                </div>

                {/* Agent Contact */}
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Agent Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3"><User  className="text-blue-600" size={18} /><span className="text-sm font-semibold text-gray-900">{selectedInspection.agentName}</span></div>
                    <div className="flex items-center gap-3"><Phone className="text-blue-600" size={18} /><span className="text-sm text-gray-700">{selectedInspection.agentPhone}</span></div>
                    <div className="flex items-center gap-3"><Mail  className="text-blue-600" size={18} /><span className="text-sm text-gray-700">{selectedInspection.agentEmail}</span></div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Update Inspection Status</h3>
                  {selectedInspection.status === 'scheduled' && (
                    <button onClick={() => handleUpdateStatus(selectedInspection, 'in_progress')} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                      <Clock size={20} /> Mark as In Progress
                    </button>
                  )}
                  {selectedInspection.status === 'in_progress' && (
                    <button onClick={() => handleUpdateStatus(selectedInspection, 'completed')} className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={20} /> Mark as Completed
                    </button>
                  )}
                  {selectedInspection.status === 'completed' && (
                    <button onClick={() => { setReport((prev) => ({ ...prev, inspectionId: selectedInspection.id })); setShowReportForm(true); }} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <FileText size={20} /> Submit Inspection Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Report Submission Form ── */}
          {showReportForm && selectedInspection && (
            <div className="max-w-5xl mx-auto space-y-6">
              <button onClick={() => setShowReportForm(false)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
                <ChevronRight size={20} className="rotate-180" /> Back to Inspection Details
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspection Report Submission</h2>
                <p className="text-gray-600 mb-6">{selectedInspection.propertyTitle}</p>

                <div className="space-y-8">
                  {(['structuralIntegrity', 'plumbing', 'electrical', 'safety'] as const).map((category) => (
                    <div key={category} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        {category === 'structuralIntegrity' ? 'Structural Integrity' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Findings *</label>
                          <textarea rows={4} placeholder="Describe your findings in detail..."
                            value={report[category].findings}
                            onChange={(e) => handleCategoryChange(category, 'findings', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Rating *</label>
                            <select value={report[category].rating} onChange={(e) => handleCategoryChange(category, 'rating', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option value="">Select rating</option>
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Severity *</label>
                            <select value={report[category].severity} onChange={(e) => handleCategoryChange(category, 'severity', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option value="">Select severity</option>
                              <option value="minor">Minor</option>
                              <option value="moderate">Moderate</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Supporting Photos (Optional)</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-white">
                            <Camera className="mx-auto text-gray-400 mb-3" size={36} />
                            <p className="text-gray-700 font-medium mb-2">Click to upload photos</p>
                            <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 10MB each</p>
                            <input type="file" accept="image/*" multiple id={`photo-${category}`} className="hidden"
                              onChange={(e) => handlePhotoUpload(category, e.target.files)} />
                            <label htmlFor={`photo-${category}`} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer">
                              <Upload size={20} /> Choose Files
                            </label>
                          </div>
                          {report[category].photos.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">{report[category].photos.length} photo(s) uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-yellow-900 mb-2">Important:</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• All fields marked with * are required</li>
                      <li>• Once submitted, the report cannot be modified</li>
                      <li>• You will be prompted to submit a final verdict after report submission</li>
                    </ul>
                  </div>
                  <button onClick={handleSubmitReport} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Send size={20} /> Submit Inspection Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Final Verdict Form ── */}
          {showVerdictForm && selectedInspection && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Final Verdict</h2>
                <p className="text-gray-600 mb-6">{selectedInspection.propertyTitle}</p>

                <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-bold text-blue-900 mb-2">Report Submitted Successfully</p>
                  <p className="text-sm text-blue-800">Your inspection report has been locked and saved. Now please select the final verdict for this property.</p>
                </div>

                <div className="space-y-4 mb-8">
                  <button onClick={() => handleSubmitVerdict('passed')} className="w-full p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="text-green-600" size={32} />
                      <div>
                        <p className="text-lg font-bold text-green-900">PASSED</p>
                        <p className="text-sm text-green-700">Property meets all inspection standards</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleSubmitVerdict('passed_with_conditions')} className="w-full p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:bg-yellow-100 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="text-yellow-600" size={32} />
                      <div>
                        <p className="text-lg font-bold text-yellow-900">PASSED WITH CONDITIONS</p>
                        <p className="text-sm text-yellow-700">Property has minor issues that should be addressed</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleSubmitVerdict('failed')} className="w-full p-6 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <XCircle className="text-red-600" size={32} />
                      <div>
                        <p className="text-lg font-bold text-red-900">FAILED</p>
                        <p className="text-sm text-red-700">Property has critical issues requiring attention</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-red-900 mb-1">Warning:</p>
                  <p className="text-sm text-red-800">Once you submit the final verdict, it cannot be changed. The verdict will be sent to the Buyer, Agent, and Property Owner.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-700 font-semibold mb-6">
                You have completed {mockInspections.filter(i => i.status === 'report_submitted').length} inspection(s)
              </p>
              <div className="space-y-4">
                {mockInspections.filter(i => i.status === 'report_submitted').map((inspection) => (
                  <div key={inspection.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex gap-6 mb-4">
                      <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                        <img src={inspection.propertyImage} alt={inspection.propertyTitle} className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{inspection.propertyTitle}</h3>
                            <p className="text-sm text-gray-600 mb-2">{inspection.propertyAddress}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1"><Calendar size={14} /><span>Inspected: {inspection.scheduledDate}</span></div>
                              <div className="flex items-center gap-1"><User size={14} /><span>Agent: {inspection.agentName}</span></div>
                            </div>
                          </div>
                          {inspection.finalVerdict && (() => {
                            const vc = getVerdictConfig(inspection.finalVerdict);
                            const Icon = vc.icon;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border ${vc.color}`}>
                                <Icon size={16} />{vc.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Eye size={18} /> View Full Report
                      </button>
                    </div>
                  </div>
                ))}
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
                        <div className={`p-3 rounded-lg ${n.type === 'assignment' ? 'bg-blue-100' : n.type === 'status_update' ? 'bg-green-100' : 'bg-orange-100'}`}>
                          {n.type === 'assignment'    && <ClipboardCheck size={16} className="text-blue-600" />}
                          {n.type === 'status_update' && <CheckCircle    size={16} className="text-green-600" />}
                          {n.type === 'report_due'    && <AlertCircle    size={16} className="text-orange-600" />}
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