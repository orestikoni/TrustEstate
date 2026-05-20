'use client';

import React from 'react';
import { MapPin, Bed, Bath, Square, Calendar, Clock, ChevronRight } from 'lucide-react';

type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'report_submitted';

interface InspectionCardProps {
  id: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string | null;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  scheduledDate: string;
  scheduledTime: string;
  status: InspectionStatus;
  agentName: string;
  onClick: () => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({
  propertyTitle,
  propertyAddress,
  propertyImage,
  bedrooms,
  bathrooms,
  area,
  scheduledDate,
  scheduledTime,
  status,
  agentName,
  onClick,
}) => {
  const getStatusConfig = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-300' };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-300' };
      case 'completed':
        return { label: 'Awaiting Report', color: 'bg-orange-100 text-orange-700 border-orange-300' };
      case 'report_submitted':
        return { label: 'Report Submitted', color: 'bg-green-100 text-green-700 border-green-300' };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {propertyImage ? (
          <img
            src={propertyImage}
            alt={propertyTitle}
            className="w-full h-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        {status === 'completed' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600 to-transparent p-4">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              <Clock size={16} />
              Ready for Report Submission
            </p>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{propertyTitle}</h3>

        <div className="flex items-start gap-2 text-gray-600 mb-4">
          <MapPin size={16} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm line-clamp-1">{propertyAddress}</span>
        </div>

        {/* Property Stats */}
        {(bedrooms || bathrooms || area) ? (
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
            {bedrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Bed size={18} className="text-blue-600" />
                <span className="text-sm font-semibold">{bedrooms}</span>
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Bath size={18} className="text-blue-600" />
                <span className="text-sm font-semibold">{bathrooms}</span>
              </div>
            )}
            {area !== undefined && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Square size={18} className="text-blue-600" />
                <span className="text-sm font-semibold">{area.toLocaleString()} sqft</span>
              </div>
            )}
          </div>
        ) : <div className="py-3 border-t border-b border-gray-200 mb-4" />}

        {/* Inspection Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-blue-600" />
            <span>
              <span className="font-semibold">{scheduledDate}</span> at {scheduledTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Agent:</span>
            <span className="font-semibold text-gray-900">{agentName}</span>
          </div>
        </div>

        {/* View Details Button */}
        <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          View Details
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};