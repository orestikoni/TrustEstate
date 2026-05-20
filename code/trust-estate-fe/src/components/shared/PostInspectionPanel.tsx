'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Send,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { PostInspectionOptionsDto } from '@/types';

interface PostInspectionPanelProps {
  offerId: number;
  propertyTitle: string;
  currentOfferAmount: number;
  options: PostInspectionOptionsDto;
  actionLoading: boolean;
  onWithdraw: () => void;
  onRevise: (newAmount: number) => void;
}

export function PostInspectionPanel({
  propertyTitle,
  currentOfferAmount,
  options,
  actionLoading,
  onWithdraw,
  onRevise,
}: PostInspectionPanelProps) {
  const [showReviseForm, setShowReviseForm] = useState(false);
  const [revisedAmount, setRevisedAmount] = useState('');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

  const parseAmount = (value: string): number =>
    parseInt(value.replace(/[^0-9]/g, ''), 10);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseAmount(e.target.value);
    setRevisedAmount(isNaN(numeric) || numeric === 0 ? '' : numeric.toLocaleString('en-US'));
  };

  const handleReviseSubmit = () => {
    const amount = parseAmount(revisedAmount);
    if (!revisedAmount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid offer amount.');
      return;
    }
    onRevise(amount);
    setShowReviseForm(false);
    setRevisedAmount('');
  };

  const handleWithdrawClick = () => {
    if (
      window.confirm(
        'Are you sure you want to withdraw your offer? This action cannot be undone.',
      )
    ) {
      onWithdraw();
    }
  };

  const getVerdictConfig = () => {
    switch (options.verdictStatus) {
      case 'Passed':
        return {
          icon: CheckCircle,
          label: 'Inspection Passed',
          color: 'bg-green-50 border-green-200 text-green-900',
          iconColor: 'text-green-600',
        };
      case 'PassedWithConditions':
        return {
          icon: AlertTriangle,
          label: 'Passed with Conditions',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
          iconColor: 'text-yellow-600',
        };
      case 'Failed':
        return {
          icon: XCircle,
          label: 'Inspection Failed',
          color: 'bg-red-50 border-red-200 text-red-900',
          iconColor: 'text-red-600',
        };
      default:
        return {
          icon: Clock,
          label: 'Inspection Pending',
          color: 'bg-blue-50 border-blue-200 text-blue-900',
          iconColor: 'text-blue-600',
        };
    }
  };

  if (!options.windowOpen) return null;

  const verdictConfig = getVerdictConfig();
  const VerdictIcon = verdictConfig.icon;
  const parsedRevised = parseAmount(revisedAmount);
  const diff =
    !isNaN(parsedRevised) && parsedRevised > 0
      ? parsedRevised - currentOfferAmount
      : null;

  return (
    <div className="space-y-4">

      {/* Verdict badge */}
      <div className={`p-5 border-2 rounded-xl ${verdictConfig.color}`}>
        <div className="flex items-center gap-3">
          <VerdictIcon className={verdictConfig.iconColor} size={28} />
          <div>
            <p className="font-bold text-lg">{verdictConfig.label}</p>
            <p className="text-sm opacity-90">
              The property inspection has been completed for{' '}
              <span className="font-semibold">{propertyTitle}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Decision window */}
      <div className="p-5 bg-purple-50 border-2 border-purple-200 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <Clock className="text-purple-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="font-bold text-purple-900 mb-2">
              Post-Inspection Decision Window
            </p>
            <p className="text-sm text-purple-800 mb-3">
              Based on the inspection results, you can proceed with your offer,
              revise it, or withdraw.
            </p>
            {options.windowExpiresAt && (
              <p className="text-sm text-purple-900 font-semibold">
                Window closes:{' '}
                {new Date(options.windowExpiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {options.canRevise && (
            <button
              onClick={() => setShowReviseForm(!showReviseForm)}
              disabled={actionLoading}
              className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <DollarSign size={20} />
              {showReviseForm ? 'Cancel Revision' : 'Revise Offer'}
            </button>
          )}
          {options.canWithdraw && (
            <button
              onClick={handleWithdrawClick}
              disabled={actionLoading}
              className="py-3 px-4 bg-white text-red-600 font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <XCircle size={20} />
              )}
              Withdraw Offer
            </button>
          )}
        </div>
      </div>

      {/* Revise form */}
      {showReviseForm && options.canRevise && (
        <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <h4 className="text-lg font-bold text-blue-900 mb-4">
            Revise Your Offer Based on Inspection
          </h4>
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-900">
              Current Offer:{' '}
              <span className="text-blue-600">
                {formatPrice(currentOfferAmount)}
              </span>
            </p>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Revised Amount <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="1,200,000"
                  value={revisedAmount}
                  onChange={handleAmountChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                />
              </div>
              {diff !== null && (
                <p className="text-sm mt-2">
                  {diff < 0 ? (
                    <span className="text-red-600 font-semibold">
                      Reducing offer by {formatPrice(Math.abs(diff))}
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      Increasing offer by {formatPrice(diff)}
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={handleReviseSubmit}
              disabled={actionLoading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              Submit Revised Offer
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> After the post-inspection window closes, your
          current offer will proceed as-is. If you need more time to decide,
          contact the agent.
        </p>
      </div>
    </div>
  );
}
