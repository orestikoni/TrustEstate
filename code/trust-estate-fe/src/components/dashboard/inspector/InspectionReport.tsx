'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Download, Save, Send, Camera, X,
  CheckCircle, AlertTriangle, XCircle, MapPin, Calendar,
  User, Building, Zap, Droplet, Shield, Eye, Wind,
  Phone, Mail, ClipboardCheck,
} from 'lucide-react';
import {
  InspectionCategory,
  InspectionItem,
  InspectionItemStatus,
  InspectionSeverity,
} from '@/types';
import { propertyInfo, initialCategories } from './inspectionMockData';

// ─── helpers

const categoryIcon: Record<string, React.ReactNode> = {
  structural: <Building size={24} />,
  plumbing:   <Droplet  size={24} />,
  electrical: <Zap      size={24} />,
  hvac:       <Wind     size={24} />,
  safety:     <Shield   size={24} />,
  interior:   <Building size={24} />,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pass':          return 'bg-green-100 text-green-700 border-green-200';
    case 'fail':          return 'bg-red-100 text-red-700 border-red-200';
    case 'attention':     return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:              return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    case 'moderate': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'minor':    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    default:         return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pass':      return <CheckCircle    className="text-green-600"  size={20} />;
    case 'fail':      return <XCircle        className="text-red-600"    size={20} />;
    case 'attention': return <AlertTriangle  className="text-yellow-600" size={20} />;
    default:          return <Eye            className="text-gray-600"   size={20} />;
  }
};

// ─── component

export const InspectionReport = () => {
  const [activeCategory, setActiveCategory] = useState('structural');
  const [showSaveMessage, setShowSaveMessage]   = useState(false);
  const [categories, setCategories] = useState<InspectionCategory[]>(
    initialCategories.map((c) => ({ ...c, icon: categoryIcon[c.id] })) as InspectionCategory[]
  );

  // ── mutators
  const updateItem = (
    catId: string,
    itemId: string,
    patch: Partial<InspectionItem>
  ) =>
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== catId
          ? cat
          : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
      )
    );

  const handleSaveDraft = () => {
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const handleExportPDF = () =>
    alert('Exporting report to PDF…\nThis would generate a downloadable PDF file.');

  const handleSubmitReport = () => {
    if (window.confirm('Submit this inspection report? Once submitted it cannot be edited.')) {
      alert('Report submitted successfully!');
    }
  };

  // ── summary stats
  const allItems   = categories.flatMap((c) => c.items);
  const totalItems    = allItems.length;
  const passedItems   = allItems.filter((i) => i.status === 'pass').length;
  const failedItems   = allItems.filter((i) => i.status === 'fail').length;
  const attentionItems= allItems.filter((i) => i.status === 'attention').length;
  const criticalIssues= allItems.filter((i) => i.severity === 'critical').length;

  const activeTab = categories.find((c) => c.id === activeCategory);

  // ── render
  return (
    <div className="min-h-screen bg-gray-200">

      {/* ── Header ── */}
      <header className="bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 border-b border-gray-500/30 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-dashboard" className="p-2 hover:bg-gray-500/30 rounded-lg transition-colors text-white">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Property Inspection Report</h1>
                <p className="text-sm text-gray-300 mt-0.5">Comprehensive inspection documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {showSaveMessage && (
                <span className="text-green-300 text-sm font-semibold">Draft saved!</span>
              )}
              <button onClick={handleSaveDraft} className="px-4 py-2 bg-gray-600/50 text-white font-semibold rounded-xl hover:bg-gray-500/50 transition-colors flex items-center gap-2 border border-gray-500/30">
                <Save size={20} /><span className="hidden sm:inline">Save Draft</span>
              </button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center gap-2 shadow-lg">
                <Download size={20} /><span className="hidden sm:inline">Export PDF</span>
              </button>
              <button onClick={handleSubmitReport} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-colors flex items-center gap-2 shadow-lg">
                <Send size={20} /><span className="hidden sm:inline">Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Property Info ── */}
        <div className="bg-gray-100 rounded-2xl shadow-lg border border-gray-400 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-300 rounded-xl">
                <Building className="text-gray-700" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Property Information</h2>
                <p className="text-sm text-gray-600">Inspection details and property data</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">IN PROGRESS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2"><MapPin size={16} />Property Address</div>
                <p className="text-gray-900 font-medium">{propertyInfo.address}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Property Type</p>
                <p className="text-gray-900 font-medium">{propertyInfo.propertyType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Year Built</p>
                <p className="text-gray-900 font-medium">{propertyInfo.yearBuilt}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Square Footage</p>
                <p className="text-gray-900 font-medium">{propertyInfo.sqft} sqft</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2"><Calendar size={16} />Inspection Date</div>
                <p className="text-gray-900 font-medium">{propertyInfo.inspectionDate}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2"><User size={16} />Inspector</div>
                <p className="text-gray-900 font-medium">{propertyInfo.inspector}</p>
                <p className="text-sm text-gray-600">License: {propertyInfo.licenseNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: <ClipboardCheck size={24} />, value: totalItems,     label: 'Total Items' },
            { icon: <CheckCircle    size={24} />, value: passedItems,    label: 'Passed' },
            { icon: <AlertTriangle  size={24} />, value: attentionItems, label: 'Attention' },
            { icon: <XCircle        size={24} />, value: failedItems,    label: 'Failed' },
            { icon: <AlertTriangle  size={24} />, value: criticalIssues, label: 'Critical' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-gray-100 rounded-xl shadow-lg border border-gray-400 p-4">
              <div className="text-gray-700 mb-2">{icon}</div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Category Navigation ── */}
        <div className="bg-gray-100 rounded-2xl shadow-lg border border-gray-400 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const issues =
                category.items.filter((i) => i.status === 'fail' || i.status === 'attention').length;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {categoryIcon[category.id]}
                  <span>{category.name}</span>
                  {issues > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : category.items.some((i) => i.status === 'fail')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {issues}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Inspection Items ── */}
        {activeTab && (
          <div className="space-y-4">
            {activeTab.items.map((item) => (
              <div key={item.id} className="bg-gray-100 rounded-2xl shadow-lg border border-gray-400 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(item.status)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>

                      {/* Status buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(['pass', 'attention', 'fail'] as InspectionItemStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateItem(activeCategory, item.id, { status: s })}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all border-2 capitalize ${
                              item.status === s
                                ? s === 'pass'      ? 'bg-green-100  text-green-700  border-green-300'
                                : s === 'attention' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                :                    'bg-red-100    text-red-700    border-red-300'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {s === 'pass' && <CheckCircle   size={16} className="inline mr-1" />}
                            {s === 'attention' && <AlertTriangle size={16} className="inline mr-1" />}
                            {s === 'fail' && <XCircle       size={16} className="inline mr-1" />}
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Severity buttons */}
                      {(item.status === 'fail' || item.status === 'attention') && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Severity Level:</p>
                          <div className="flex flex-wrap gap-2">
                            {(['minor', 'moderate', 'critical'] as InspectionSeverity[]).map((sev) => (
                              <button
                                key={sev}
                                onClick={() => updateItem(activeCategory, item.id, { severity: sev })}
                                className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all border-2 capitalize ${
                                  item.severity === sev ? getSeverityColor(sev) : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {sev.charAt(0).toUpperCase() + sev.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Inspector Notes:</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateItem(activeCategory, item.id, { notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Add detailed notes about this inspection item…"
                        />
                      </div>

                      {/* Photos */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Inspection Photos:</p>
                        <div className="flex flex-wrap gap-3">
                          {item.photos.map((photo, idx) => (
                            <div key={idx} className="relative group w-32 h-32">
                              <Image
                                src={photo}
                                alt={`Inspection photo ${idx + 1}`}
                                fill
                                className="object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                onClick={() =>
                                  updateItem(activeCategory, item.id, {
                                    photos: item.photos.filter((_, i) => i !== idx),
                                  })
                                }
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          <button className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all">
                            <Camera size={32} className="mb-2" />
                            <span className="text-xs font-semibold">Add Photo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status / Severity badges */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-xl border-2 ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                    {item.severity && (
                      <span className={`px-4 py-2 text-sm font-bold rounded-xl border-2 ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Inspector Certification ── */}
        <div className="bg-gray-100 rounded-2xl shadow-lg border border-gray-400 p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inspector Certification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              { label: 'Inspector Name',  value: propertyInfo.inspector },
              { label: 'License Number',  value: propertyInfo.licenseNumber },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <input type="text" value={value} readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-gray-400" />
                <input type="text" value={propertyInfo.inspectorPhone} readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-gray-400" />
                <input type="text" value={propertyInfo.inspectorEmail} readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50" />
              </div>
            </div>
          </div>
          <div className="border-t-2 border-gray-200 pt-6">
            <p className="text-sm text-gray-600 italic">
              I certify that this inspection was conducted in accordance with industry standards and to the best of my professional ability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};