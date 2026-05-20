'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { inspectionService, type MyInspectionDto } from '@/services/inspection.service';
import { notificationService, type ApiNotification, formatNotificationDate } from '@/services/notification.service';
import { ApiRequestError } from '@/lib/api-client';
import { useAuth } from '@/store/auth.context';
import Link from 'next/link';
import {
  Home,
  ClipboardCheck,
  Settings,
  LogOut,
  MapPin,
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
  Send,
  Eye,
  FileText,
  User,
  Mail,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useRef } from 'react';
import { InspectionCard } from '@/components/inspector/InspectionCard';
import { InspectionReportForm } from '@/components/inspector/InspectionReportForm';
import { FinalVerdictForm } from '@/components/inspector/FinalVerdictForm';

type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'report_submitted';
type Severity = 'minor' | 'moderate' | 'critical';
type Rating = 'pass' | 'fail';
type FinalVerdict = 'passed' | 'passed_with_conditions' | 'failed';

interface AssignedInspection {
  id: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string | null;
  scheduledDate: string;
  scheduledTime: string;
  status: InspectionStatus;
  agentName: string;
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

const emptyCategory: CategoryFindings = { findings: '', rating: '', severity: '', photos: [] };

type ReportCategory = keyof Omit<InspectionReport, 'inspectionId' | 'finalVerdict' | 'submittedDate' | 'locked'>;

const CATEGORY_KEY_TO_NAME: Record<string, string> = {
  structuralIntegrity: 'StructuralIntegrity',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  safety: 'Safety',
};

const VERDICT_MAP: Record<FinalVerdict, string> = {
  passed: 'Passed',
  passed_with_conditions: 'PassedWithConditions',
  failed: 'Failed',
};

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const mapVerdictFromBackend = (v: string | null | undefined): FinalVerdict | undefined => {
  if (v === 'Passed') return 'passed';
  if (v === 'PassedWithConditions') return 'passed_with_conditions';
  if (v === 'Failed') return 'failed';
  return undefined;
};

const getDerivedStatus = (dto: MyInspectionDto): InspectionStatus => {
  if (dto.status === 'Scheduled') return 'scheduled';
  if (dto.status === 'InProgress') return 'in_progress';
  if (dto.report?.isLocked === true) return 'report_submitted';
  return 'completed';
};

const mapToAssigned = (dto: MyInspectionDto): AssignedInspection => {
  const d = new Date(dto.scheduledDate);
  return {
    id: dto.inspectionId,
    propertyTitle: dto.propertyTitle,
    propertyAddress: dto.propertyAddress,
    propertyImage: dto.photoUrl,
    scheduledDate: d.toLocaleDateString(),
    scheduledTime: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: getDerivedStatus(dto),
    agentName: dto.agentName,
    agentEmail: dto.agentEmail,
    ownerName: dto.ownerName,
    assignedDate: new Date(dto.assignedAt).toLocaleDateString(),
    hasReport: dto.report !== null,
    finalVerdict: mapVerdictFromBackend(dto.report?.finalVerdict),
  };
};

export default function InspectorDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'history' | 'notifications'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<AssignedInspection | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showVerdictForm, setShowVerdictForm] = useState(false);

  // ── Inspections API state ─────────────────────────────────────────────────
  const [inspections, setInspections] = useState<AssignedInspection[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState<string | null>(null);

  const loadInspections = useCallback(async () => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    try {
      const data = await inspectionService.getMyInspections();
      setInspections(data.map(mapToAssigned));
    } catch (err) {
      setInspectionsError(
        err instanceof ApiRequestError ? err.apiError.message : 'Failed to load inspections.',
      );
    } finally {
      setInspectionsLoading(false);
    }
  }, []);

  useEffect(() => { loadInspections(); }, [loadInspections]);

  // ── Action loading states ─────────────────────────────────────────────────
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [verdictSubmitting, setVerdictSubmitting] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  // ── Confirm dialog ────────────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string; confirmLabel: string; onConfirm: () => void;
  } | null>(null);

  // ── Notifications ─────────────────────────────────────────────────────────
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

  // ── Report form state ─────────────────────────────────────────────────────
  const [report, setReport] = useState<InspectionReport>({
    inspectionId: 0,
    structuralIntegrity: { ...emptyCategory },
    plumbing:            { ...emptyCategory },
    electrical:          { ...emptyCategory },
    safety:              { ...emptyCategory },
    locked: false,
  });

  // ── Status / verdict helpers ──────────────────────────────────────────────
  const getStatusConfig = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled':        return { label: 'Scheduled',        color: 'bg-blue-100 text-blue-700 border-blue-300',     icon: Calendar };
      case 'in_progress':      return { label: 'In Progress',      color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Clock };
      case 'completed':        return { label: 'Completed',        color: 'bg-orange-100 text-orange-700 border-orange-300', icon: CheckCircle };
      case 'report_submitted': return { label: 'Report Submitted', color: 'bg-green-100 text-green-700 border-green-300',   icon: FileText };
    }
  };

  const getVerdictConfig = (verdict: FinalVerdict) => {
    switch (verdict) {
      case 'passed':                 return { label: 'PASSED',                 color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle };
      case 'passed_with_conditions': return { label: 'PASSED WITH CONDITIONS', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle };
      case 'failed':                 return { label: 'FAILED',                 color: 'bg-red-100 text-red-700 border-red-300',          icon: XCircle };
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (inspection: AssignedInspection, newStatus: 'in_progress' | 'completed') => {
    setStatusUpdating(true);
    try {
      await inspectionService.updateStatus(inspection.id, newStatus === 'in_progress' ? 'InProgress' : 'Completed');
      setInspections(prev => prev.map(i => i.id === inspection.id ? { ...i, status: newStatus } : i));
      setSelectedInspection(prev => prev?.id === inspection.id ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.apiError.message : 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCategoryChange = (category: ReportCategory, field: keyof CategoryFindings, value: unknown) =>
    setReport(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }));

  const handlePhotoUpload = (category: ReportCategory, files: FileList | null) => {
    if (!files) return;
    setReport(prev => ({
      ...prev,
      [category]: { ...prev[category], photos: [...prev[category].photos, ...Array.from(files)] },
    }));
  };

  const handleSubmitReport = async () => {
    const categories: ReportCategory[] = ['structuralIntegrity', 'plumbing', 'electrical', 'safety'];
    for (const cat of categories) {
      const d = report[cat];
      if (!d.findings || !d.rating || !d.severity) {
        showToast(`Please complete all fields for ${cat.replace(/([A-Z])/g, ' $1').trim()}`, 'warning');
        return;
      }
    }
    setReportSubmitting(true);
    try {
      const categoryInputs = categories.map(cat => ({
        categoryName: CATEGORY_KEY_TO_NAME[cat],
        findings: report[cat].findings,
        passFail: capitalize(report[cat].rating),
        severity: capitalize(report[cat].severity),
        photoUrls: [] as string[],
      }));
      await inspectionService.submitReport(selectedInspection!.id, categoryInputs);
      setReport(prev => ({ ...prev, locked: true, submittedDate: new Date().toISOString() }));
      setSelectedInspection(prev => prev ? { ...prev, hasReport: true } : prev);
      setShowReportForm(false);
      setShowVerdictForm(true);
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.apiError.message : 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSubmitVerdict = (verdict: FinalVerdict) => {
    setConfirmDialog({
      message: `Submit final verdict as "${verdict.toUpperCase().replace(/_/g, ' ')}"? This cannot be undone.`,
      confirmLabel: 'Submit Verdict',
      onConfirm: async () => {
        setVerdictSubmitting(true);
        try {
          await inspectionService.submitVerdict(selectedInspection!.id, VERDICT_MAP[verdict]);
          await loadInspections();
          setReport({
            inspectionId: 0,
            structuralIntegrity: { ...emptyCategory },
            plumbing:            { ...emptyCategory },
            electrical:          { ...emptyCategory },
            safety:              { ...emptyCategory },
            locked: false,
          });
          setShowVerdictForm(false);
          setSelectedInspection(null);
          showToast('Final verdict submitted successfully.', 'success');
        } catch (err) {
          showToast(err instanceof ApiRequestError ? err.apiError.message : 'Failed to submit verdict.');
        } finally {
          setVerdictSubmitting(false);
        }
      },
    });
  };

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '??';
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const activeInspections = inspections.filter(i => i.status !== 'report_submitted');
  const completedInspections = inspections.filter(i => i.status === 'report_submitted');

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
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-lg font-bold shadow-lg">{initials}</div>
          <div>
            <p className="font-bold text-white">{fullName}</p>
            <p className="text-sm text-blue-200">{user?.emailAddress}</p>
          </div>
        </div>
        {user?.accountStatus === 'Active' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 rounded-lg">
            <Award className="text-yellow-400" size={16} />
            <span className="text-sm text-white font-medium">Verified Inspector</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { tab: 'dashboard',     icon: <Home           size={20} />, label: 'Dashboard' },
          { tab: 'inspections',   icon: <ClipboardCheck size={20} />, label: 'Assigned Inspections',
            count: activeInspections.length || undefined },
          { tab: 'history',       icon: <FileText       size={20} />, label: 'Inspection History' },
          { tab: 'notifications', icon: <Bell           size={20} />, label: 'Notifications',
            count: notifications.filter(n => !n.isRead).length || undefined, countColor: 'bg-red-500' },
        ].map(({ tab, icon, label, count, countColor }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as typeof activeTab); setSelectedInspection(null); setShowReportForm(false); setShowVerdictForm(false); }}
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

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm transition-all ${
          toast.type === 'error'   ? 'bg-red-50 border-red-200 text-red-900' :
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' :
                                     'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="mt-0.5 flex-shrink-0">
            {toast.type === 'error'   && <XCircle    size={20} className="text-red-500" />}
            {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
          </div>
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-auto -mt-0.5 -mr-1 p-1 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Confirm Dialog ────────────────────────────────────────────────────── */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <p className="text-gray-800 font-medium leading-snug mt-1">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); fn(); }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {confirmDialog.confirmLabel}
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
                  { label: 'Scheduled',       value: inspections.filter(i => i.status === 'scheduled').length,        sub: 'Upcoming inspections', icon: <Calendar    className="text-blue-500"   size={24} /> },
                  { label: 'In Progress',     value: inspections.filter(i => i.status === 'in_progress').length,      sub: 'Currently ongoing',    icon: <Clock       className="text-purple-500" size={24} /> },
                  { label: 'Pending Reports', value: inspections.filter(i => i.status === 'completed').length,        sub: 'Need submission',      icon: <AlertCircle className="text-orange-500" size={24} /> },
                  { label: 'Completed',       value: completedInspections.length,                                     sub: 'Reports submitted',    icon: <CheckCircle className="text-green-500"  size={24} /> },
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
                    {inspectionsLoading ? (
                      <div className="flex justify-center py-8"><Clock className="animate-spin text-blue-600" size={28} /></div>
                    ) : activeInspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No upcoming inspections.</p>
                    ) : (
                      <div className="space-y-4">
                        {activeInspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').slice(0, 3).map((inspection) => {
                          const sc = getStatusConfig(inspection.status);
                          const Icon = sc.icon;
                          return (
                            <div key={inspection.id}
                              onClick={() => { setSelectedInspection(inspection); setActiveTab('inspections'); }}
                              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex gap-4">
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                  {inspection.propertyImage ? (
                                    <img src={inspection.propertyImage} alt={inspection.propertyTitle} className="w-full h-full object-cover"
                                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><MapPin size={24} /></div>
                                  )}
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
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.notificationId} onClick={() => handleMarkAsRead(n.notificationId)} className={`p-3 rounded-xl border cursor-pointer ${n.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${n.type === 'InspectionUpdate' ? 'bg-blue-100' : n.type === 'AccountDecision' ? 'bg-green-100' : n.type === 'DisputeUpdate' ? 'bg-red-100' : 'bg-gray-100'}`}>
                            {n.type === 'InspectionUpdate' && <ClipboardCheck size={16} className="text-blue-600" />}
                            {n.type === 'AccountDecision'  && <CheckCircle    size={16} className="text-green-600" />}
                            {n.type === 'DisputeUpdate'    && <AlertCircle    size={16} className="text-red-600" />}
                            {(n.type !== 'InspectionUpdate' && n.type !== 'AccountDecision' && n.type !== 'DisputeUpdate') && <Bell size={16} className="text-gray-600" />}
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
                    {notifications.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">No notifications yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Assigned Inspections List ── */}
          {activeTab === 'inspections' && !selectedInspection && !showReportForm && !showVerdictForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {inspectionsLoading ? (
                <div className="flex justify-center py-16"><Clock className="animate-spin text-blue-600" size={36} /></div>
              ) : inspectionsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
                  <span>{inspectionsError}</span>
                  <button onClick={loadInspections} className="ml-3 underline font-semibold">Retry</button>
                </div>
              ) : activeInspections.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardCheck className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No active inspections</p>
                  <p className="text-sm text-gray-500">You have no inspections assigned at the moment.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 font-semibold mb-6">
                    You have {activeInspections.length} active inspection{activeInspections.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeInspections.map((inspection) => (
                      <InspectionCard
                        key={inspection.id}
                        id={inspection.id}
                        propertyTitle={inspection.propertyTitle}
                        propertyAddress={inspection.propertyAddress}
                        propertyImage={inspection.propertyImage}
                        scheduledDate={inspection.scheduledDate}
                        scheduledTime={inspection.scheduledTime}
                        status={inspection.status}
                        agentName={inspection.agentName}
                        onClick={() => setSelectedInspection(inspection)}
                      />
                    ))}
                  </div>
                </>
              )}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-700"><Calendar size={18} className="text-blue-600" /><span className="text-sm font-semibold">Scheduled: {selectedInspection.scheduledDate} at {selectedInspection.scheduledTime}</span></div>
                    <div className="flex items-center gap-2 text-gray-700"><User size={18} className="text-blue-600" /><span className="text-sm font-semibold">Owner: {selectedInspection.ownerName}</span></div>
                  </div>
                </div>

                {/* Agent Contact */}
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Agent Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3"><User className="text-blue-600" size={18} /><span className="text-sm font-semibold text-gray-900">{selectedInspection.agentName}</span></div>
                    <div className="flex items-center gap-3"><Mail className="text-blue-600" size={18} /><span className="text-sm text-gray-700">{selectedInspection.agentEmail}</span></div>
                  </div>
                </div>

                {/* Workflow Guide */}
                <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Inspection Workflow</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { s: 'scheduled',        label: 'Scheduled',        icon: Calendar,    active: 'bg-blue-600',   done: 'bg-blue-100 text-blue-700' },
                      { s: 'in_progress',      label: 'In Progress',      icon: Clock,       active: 'bg-purple-600', done: 'bg-purple-100 text-purple-700' },
                      { s: 'completed',        label: 'Completed',        icon: CheckCircle, active: 'bg-orange-600', done: 'bg-orange-100 text-orange-700' },
                      { s: 'report_submitted', label: 'Report Submitted', icon: FileText,    active: 'bg-green-600',  done: 'bg-green-100 text-green-700' },
                    ].map((step, idx, arr) => {
                      const statuses: InspectionStatus[] = ['scheduled', 'in_progress', 'completed', 'report_submitted'];
                      const currentIdx = statuses.indexOf(selectedInspection.status);
                      const stepIdx = statuses.indexOf(step.s as InspectionStatus);
                      const isCurrent = step.s === selectedInspection.status;
                      const isDone = stepIdx < currentIdx;
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.s}>
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                            isCurrent ? `${step.active} text-white` :
                            isDone ? step.done :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            <Icon size={16} />{step.label}
                          </div>
                          {idx < arr.length - 1 && <ChevronRight size={20} className="text-gray-400" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Report Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Inspection Report</h3>
                  {selectedInspection.status === 'report_submitted' ? (
                    <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="text-green-600" size={24} />
                        <p className="text-lg font-bold text-green-900">Report Submitted Successfully</p>
                      </div>
                      <p className="text-sm text-green-800 mb-3">Your inspection report and final verdict have been submitted and locked.</p>
                      {selectedInspection.finalVerdict && (() => {
                        const vc = getVerdictConfig(selectedInspection.finalVerdict!);
                        const Icon = vc.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border ${vc.color}`}>
                            <Icon size={16} />{vc.label}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (selectedInspection.hasReport || report.locked) ? (
                    <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="text-yellow-600" size={24} />
                        <p className="text-lg font-bold text-yellow-900">Report Pending Final Verdict</p>
                      </div>
                      <p className="text-sm text-yellow-800 mb-4">Your report has been submitted. Please submit the final verdict.</p>
                      <button onClick={() => setShowVerdictForm(true)} disabled={verdictSubmitting}
                        className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        <Send size={18} /> Submit Final Verdict
                      </button>
                    </div>
                  ) : selectedInspection.status !== 'completed' ? (
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-gray-400" size={24} />
                        <p className="text-lg font-bold text-gray-700">Report Not Yet Available</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        You must <strong>mark the inspection as Completed</strong> before you can submit a report.
                        Use the &quot;Update Inspection Status&quot; section below.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="text-blue-600" size={24} />
                        <p className="text-lg font-bold text-blue-900">Create Inspection Report</p>
                      </div>
                      <p className="text-sm text-blue-800 mb-4">
                        Complete findings for <strong>Structural Integrity</strong>, <strong>Plumbing</strong>, <strong>Electrical</strong>, and <strong>Safety</strong>.
                      </p>
                      <button
                        onClick={() => { setReport(prev => ({ ...prev, inspectionId: selectedInspection.id })); setShowReportForm(true); }}
                        className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FileText size={22} /> Create Inspection Report
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Update Inspection Status</h3>
                  {selectedInspection.status === 'scheduled' && (
                    <>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <p className="text-sm text-purple-800">Click below to mark as <strong>In Progress</strong> when you arrive at the property.</p>
                      </div>
                      <button onClick={() => handleUpdateStatus(selectedInspection, 'in_progress')} disabled={statusUpdating}
                        className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <Clock size={20} /> {statusUpdating ? 'Updating…' : 'Mark as In Progress'}
                      </button>
                    </>
                  )}
                  {selectedInspection.status === 'in_progress' && (
                    <>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-sm text-orange-800">Mark as <strong>Completed</strong> once you finish the on-site inspection.</p>
                      </div>
                      <button onClick={() => handleUpdateStatus(selectedInspection, 'completed')} disabled={statusUpdating}
                        className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <CheckCircle size={20} /> {statusUpdating ? 'Updating…' : 'Mark as Completed'}
                      </button>
                    </>
                  )}
                  {selectedInspection.status === 'completed' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800"><strong>Inspection completed!</strong> You can now submit the inspection report above.</p>
                    </div>
                  )}
                  {selectedInspection.status === 'report_submitted' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-700">This inspection is complete and the report has been submitted.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Report Form ── */}
          {showReportForm && selectedInspection && (
            <InspectionReportForm
              propertyTitle={selectedInspection.propertyTitle}
              report={report}
              submitting={reportSubmitting}
              onBack={() => setShowReportForm(false)}
              onCategoryChange={handleCategoryChange}
              onPhotoUpload={handlePhotoUpload}
              onSubmit={handleSubmitReport}
            />
          )}

          {/* ── Verdict Form ── */}
          {showVerdictForm && selectedInspection && (
            <FinalVerdictForm
              propertyTitle={selectedInspection.propertyTitle}
              submitting={verdictSubmitting}
              onSubmit={handleSubmitVerdict}
            />
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {inspectionsLoading ? (
                <div className="flex justify-center py-16"><Clock className="animate-spin text-blue-600" size={36} /></div>
              ) : completedInspections.length === 0 ? (
                <div className="text-center py-16">
                  <Eye className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600 font-semibold">No completed inspections yet</p>
                  <p className="text-sm text-gray-500">Submitted reports will appear here.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 font-semibold mb-6">
                    {completedInspections.length} completed inspection{completedInspections.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-4">
                    {completedInspections.map((inspection) => (
                      <div key={inspection.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex gap-6 mb-4">
                          <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                            {inspection.propertyImage ? (
                              <img src={inspection.propertyImage} alt={inspection.propertyTitle} className="w-full h-full object-cover"
                                onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><MapPin size={32} /></div>
                            )}
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
                                const vc = getVerdictConfig(inspection.finalVerdict!);
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
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-700 font-semibold mb-6">
                  {notifications.filter(n => !n.isRead).length} unread notification{notifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.notificationId} onClick={() => handleMarkAsRead(n.notificationId)} className={`p-5 rounded-xl border transition-all cursor-pointer ${n.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${n.type === 'InspectionUpdate' ? 'bg-blue-100' : n.type === 'AccountDecision' ? 'bg-green-100' : n.type === 'DisputeUpdate' ? 'bg-red-100' : 'bg-gray-100'}`}>
                          {n.type === 'InspectionUpdate' && <ClipboardCheck size={16} className="text-blue-600" />}
                          {n.type === 'AccountDecision'  && <CheckCircle    size={16} className="text-green-600" />}
                          {n.type === 'DisputeUpdate'    && <AlertCircle    size={16} className="text-red-600" />}
                          {(n.type !== 'InspectionUpdate' && n.type !== 'AccountDecision' && n.type !== 'DisputeUpdate') && <Bell size={16} className="text-gray-600" />}
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
                  {notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No notifications yet.</p>
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
