'use client';

import React from 'react';
import { MapPin, Bed, Bath, Square, Users, Eye, Flag, Edit, Ban, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ListingCardProps {
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
  isSelected: boolean;
  actionReason: string;
  onSelect: () => void;
  onCancel: () => void;
  onActionReasonChange: (value: string) => void;
  onFlag: () => void;
  onSuspend: () => void;
  onRemove: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  location,
  bedrooms,
  bathrooms,
  area,
  image,
  owner,
  status,
  views,
  flagCount,
  isSelected,
  actionReason,
  onSelect,
  onCancel,
  onActionReasonChange,
  onFlag,
  onSuspend,
  onRemove,
}) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white shadow-sm">
            Active
          </span>
        );
      case 'flagged':
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white shadow-sm">
            Flagged
          </span>
        );
      case 'suspended':
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 text-white shadow-sm">
            Suspended
          </span>
        );
      case 'removed':
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-600 text-white shadow-sm">
            Removed
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        {flagCount > 0 && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white shadow-sm flex items-center gap-1.5">
              <Flag size={14} />
              {flagCount}
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(price)}</p>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{title}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin size={16} />
          <span className="text-sm">{location}</span>
        </div>

        {/* Property Stats */}
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Bed size={18} className="text-blue-600" />
            <span className="text-sm font-semibold">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <Bath size={18} className="text-blue-600" />
            <span className="text-sm font-semibold">{bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <Square size={18} className="text-blue-600" />
            <span className="text-sm font-semibold">{area.toLocaleString()} sqft</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <Eye size={18} className="text-blue-600" />
            <span className="text-sm font-semibold">{views.toLocaleString()}</span>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Users size={16} />
          <span>Owner: <span className="font-semibold text-gray-900">{owner}</span></span>
        </div>

        {/* Action Section */}
        {isSelected ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Action Reason (Required)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => onActionReasonChange(e.target.value)}
                placeholder="Explain why this action is being taken..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onFlag}
                disabled={!actionReason.trim()}
                className="py-2.5 bg-orange-600 text-white font-semibold text-sm rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Flag size={16} />
                Flag
              </button>
              <button
                onClick={onSuspend}
                disabled={!actionReason.trim()}
                className="py-2.5 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Ban size={16} />
                Suspend
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onRemove}
                disabled={!actionReason.trim()}
                className="py-2.5 bg-gray-800 text-white font-semibold text-sm rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Remove
              </button>
              <button
                onClick={onCancel}
                className="py-2.5 bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-300 transition-colors"
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
            <Edit size={18} />
            Manage Listing
          </button>
        )}
      </div>
    </div>
  );
};