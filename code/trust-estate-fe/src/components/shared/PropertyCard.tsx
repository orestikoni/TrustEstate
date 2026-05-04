import React from 'react';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';

export interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  tag?: string; // e.g. "Featured", "New", "Price Drop"
  forRent?: boolean;
}

interface PropertyCardProps {
  property: Property;
  onSave?: (id: number) => void;
  isSaved?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSave,
  isSaved = false,
}) => {
  const formatPrice = (price: number, forRent?: boolean) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price) + (forRent ? '/mo' : '');

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg';
          }}
        />

        {/* Tag */}
        {property.tag && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow">
            {property.tag}
          </span>
        )}

        {/* Save / Heart Button */}
        <button
          onClick={() => onSave?.(property.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-white transition-all"
          aria-label={isSaved ? 'Unsave property' : 'Save property'}
        >
          <Heart
            size={18}
            className={isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* Details */}
      <div className="p-5">
        <p className="text-xl font-bold text-blue-600 mb-1">
          {formatPrice(property.price, property.forRent)}
        </p>
        <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
          <MapPin size={14} />
          <span className="truncate">{property.location}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-700">
          <div className="flex items-center gap-1.5">
            <Bed size={16} className="text-blue-500" />
            <span className="font-semibold">{property.bedrooms}</span>
            <span className="text-gray-400">Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={16} className="text-blue-500" />
            <span className="font-semibold">{property.bathrooms}</span>
            <span className="text-gray-400">Baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square size={16} className="text-blue-500" />
            <span className="font-semibold">{property.area.toLocaleString()}</span>
            <span className="text-gray-400">sqft</span>
          </div>
        </div>
      </div>
    </div>
  );
};