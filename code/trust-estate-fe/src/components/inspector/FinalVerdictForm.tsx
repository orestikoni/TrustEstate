'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type FinalVerdict = 'passed' | 'passed_with_conditions' | 'failed';

interface FinalVerdictFormProps {
  propertyTitle: string;
  onSubmit: (verdict: FinalVerdict) => void;
}

export const FinalVerdictForm: React.FC<FinalVerdictFormProps> = ({
  propertyTitle,
  onSubmit,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Final Verdict</h2>
        <p className="text-gray-600 mb-6">{propertyTitle}</p>

        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-bold text-blue-900 mb-2">Report Submitted Successfully</p>
          <p className="text-sm text-blue-800">
            Your inspection report has been locked and saved. Now please select the final verdict for this property.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Passed */}
          <button
            onClick={() => onSubmit('passed')}
            className="w-full p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
              <div>
                <p className="text-lg font-bold text-green-900">PASSED</p>
                <p className="text-sm text-green-700">Property meets all inspection standards</p>
              </div>
            </div>
          </button>

          {/* Passed with Conditions */}
          <button
            onClick={() => onSubmit('passed_with_conditions')}
            className="w-full p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <AlertTriangle className="text-yellow-600 flex-shrink-0" size={32} />
              <div>
                <p className="text-lg font-bold text-yellow-900">PASSED WITH CONDITIONS</p>
                <p className="text-sm text-yellow-700">Property has minor issues that should be addressed</p>
              </div>
            </div>
          </button>

          {/* Failed */}
          <button
            onClick={() => onSubmit('failed')}
            className="w-full p-6 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <XCircle className="text-red-600 flex-shrink-0" size={32} />
              <div>
                <p className="text-lg font-bold text-red-900">FAILED</p>
                <p className="text-sm text-red-700">Property has critical issues requiring attention</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-900 mb-1">Warning:</p>
          <p className="text-sm text-red-800">
            Once you submit the final verdict, it cannot be changed. The verdict will be sent to the Buyer, Agent,
            and Property Owner.
          </p>
        </div>
      </div>
    </div>
  );
};