'use client';

import React from 'react';
import { MapPin, Users, Ban, Trash2, Edit, Building, Tag } from 'lucide-react';

export type AdminListingStatus =
  | 'PendingAgentReview'
  | 'CorrectionsRequested'
  | 'Active'
  | 'UnderOffer'
  | 'Suspended'
  | 'Archived'
  | 'Removed';

interface ListingCardProps {
  listingId: number;
  title: string;
  askingPrice: number;
  city: string;
  country: string;
  listingType: string;
  propertyType: string;
  status: AdminListingStatus;
  ownerName: string | null;
  agentName: string | null;
  photoUrl: string | null;
  moderationNotes: string | null;
  isSelected: boolean;
  actionReason: string;
  onSelect: () => void;
  onCancel: () => void;
  onActionReasonChange: (value: string) => void;
  onSuspend: () => void;
  onRemove: () => void;
  actionLoading?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  title,
  askingPrice,
  city,
  country,
  listingType,
  propertyType,
  status,
  ownerName,
  agentName,
  photoUrl,
  moderationNotes,
  isSelected,
  actionReason,
  onSelect,
  onCancel,
  onActionReasonChange,
  onSuspend,
  onRemove,
  actionLoading,
}) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const statusBadge = () => {
    switch (status) {
      case 'Active':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white">Active</span>;
      case 'Suspended':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 text-white">Suspended</span>;
      case 'PendingAgentReview':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-500 text-white">Pending Review</span>;
      case 'CorrectionsRequested':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-600 text-white">Corrections Requested</span>;
      case 'UnderOffer':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white">Under Offer</span>;
      case 'Archived':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-500 text-white">Archived</span>;
      case 'Removed':
        return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-700 text-white">Removed</span>;
    }
  };

  const canSuspend = status === 'Active' || status === 'UnderOffer';
  const canRemove = status !== 'Removed';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
      {/* Photo */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Building size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">{statusBadge()}</div>
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white">
            For {listingType}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <p className="text-2xl font-bold text-blue-600 mb-1">{formatPrice(askingPrice)}</p>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{title}</h3>

        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <MapPin size={15} />
          <span className="text-sm truncate">{city}, {country}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <Tag size={15} />
          <span className="text-sm">{propertyType}</span>
        </div>

        <div className="py-3 border-t border-b border-gray-200 mb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users size={15} className="text-gray-500 flex-shrink-0" />
            <span>Owner: <span className="font-semibold text-gray-900">{ownerName ?? 'Unknown'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users size={15} className="text-gray-500 flex-shrink-0" />
            <span>Agent: <span className="font-semibold text-gray-900">{agentName ?? 'Unassigned'}</span></span>
          </div>
        </div>

        {moderationNotes && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs font-semibold text-orange-700 mb-1">Moderation Notes</p>
            <p className="text-xs text-orange-600">{moderationNotes}</p>
          </div>
        )}

        {isSelected ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason (Required)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => onActionReasonChange(e.target.value)}
                placeholder="Explain why this action is being taken..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              {canSuspend && (
                <button
                  onClick={onSuspend}
                  disabled={!actionReason.trim() || actionLoading}
                  className="flex-1 py-2.5 bg-orange-600 text-white font-semibold text-sm rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Ban size={16} /> Suspend
                </button>
              )}
              {canRemove && (
                <button
                  onClick={onRemove}
                  disabled={!actionReason.trim() || actionLoading}
                  className="flex-1 py-2.5 bg-gray-800 text-white font-semibold text-sm rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Remove
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onSelect}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Edit size={18} /> Manage Listing
          </button>
        )}
      </div>
    </div>
  );
};
