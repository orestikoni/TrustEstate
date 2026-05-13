'use client';

import React from 'react';
import { ChevronRight, Camera, Upload, Send } from 'lucide-react';

type Severity = 'minor' | 'moderate' | 'critical';
type Rating = 'pass' | 'fail';

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
  finalVerdict?: 'passed' | 'passed_with_conditions' | 'failed';
  submittedDate?: string;
  locked: boolean;
}

type ReportCategory = keyof Omit<InspectionReport, 'inspectionId' | 'finalVerdict' | 'submittedDate' | 'locked'>;

interface InspectionReportFormProps {
  propertyTitle: string;
  report: InspectionReport;
  onBack: () => void;
  onCategoryChange: (
    category: ReportCategory,
    field: keyof CategoryFindings,
    value: unknown
  ) => void;
  onPhotoUpload: (
    category: ReportCategory,
    files: FileList | null
  ) => void;
  onSubmit: () => void;
}

const CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'structuralIntegrity', label: 'Structural Integrity' },
  { key: 'plumbing', label: 'Plumbing' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'safety', label: 'Safety' },
];

export const InspectionReportForm: React.FC<InspectionReportFormProps> = ({
  propertyTitle,
  report,
  onBack,
  onCategoryChange,
  onPhotoUpload,
  onSubmit,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors"
      >
        <ChevronRight size={20} className="rotate-180" />
        Back to Inspection Details
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspection Report Submission</h2>
        <p className="text-gray-600 mb-6">{propertyTitle}</p>

        <div className="space-y-8">
          {CATEGORIES.map(({ key, label }) => (
            <div key={key} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{label}</h3>

              <div className="space-y-4">
                {/* Findings */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Findings <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your findings in detail..."
                    value={report[key].findings}
                    onChange={(e) => onCategoryChange(key, 'findings', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Rating and Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Rating <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={report[key].rating}
                      onChange={(e) => onCategoryChange(key, 'rating', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select rating</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Severity <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={report[key].severity}
                      onChange={(e) => onCategoryChange(key, 'severity', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select severity</option>
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Supporting Photos (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-white">
                    <Camera className="mx-auto text-gray-400 mb-3" size={36} />
                    <p className="text-gray-700 font-medium mb-2">Click to upload photos</p>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 10MB each</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onPhotoUpload(key, e.target.files)}
                      className="hidden"
                      id={`photo-${key}`}
                    />
                    <label
                      htmlFor={`photo-${key}`}
                      className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Upload size={20} />
                      Choose Files
                    </label>
                  </div>
                  {report[key].photos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {report[key].photos.length} photo(s) uploaded
                    </p>
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
              <li>• All fields marked with <span className="text-red-600">*</span> are required</li>
              <li>• Once submitted, the report cannot be modified</li>
              <li>• You will be prompted to submit a final verdict after report submission</li>
            </ul>
          </div>

          <button
            onClick={onSubmit}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Submit Inspection Report
          </button>
        </div>
      </div>
    </div>
  );
};