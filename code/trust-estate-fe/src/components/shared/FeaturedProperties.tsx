'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PropertyCard, Property } from '@/components/shared/PropertyCard';
import { Button } from '@/components/ui/Button';

const featuredProperties: Property[] = [
  {
    id: 1,
    title: 'Modern Architecture Home',
    price: 1450000,
    location: 'San Diego, CA',
    bedrooms: 4,
    bathrooms: 3,
    area: 3800,
    image: 'https://images.unsplash.com/photo-1627141234469-24711efb373c?w=600&auto=format&fit=crop',
    tag: 'Featured',
  },
  {
    id: 2,
    title: 'Luxury Condo Building',
    price: 890000,
    location: 'Seattle, WA',
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    image: 'https://images.unsplash.com/photo-1766270596305-d0cfb9efaa52?w=600&auto=format&fit=crop',
    tag: 'New',
  },
  {
    id: 3,
    title: 'Contemporary Townhouse',
    price: 675000,
    location: 'Portland, OR',
    bedrooms: 3,
    bathrooms: 2,
    area: 2000,
    image: 'https://images.unsplash.com/photo-1630404515111-2fc17457daa6?w=600&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Beachfront Paradise',
    price: 2100000,
    location: 'Miami, FL',
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    image: 'https://images.unsplash.com/photo-1771190252113-aa988822596f?w=600&auto=format&fit=crop',
    tag: 'Price Drop',
  },
  {
    id: 5,
    title: 'Downtown Penthouse',
    price: 3200000,
    location: 'New York, NY',
    bedrooms: 4,
    bathrooms: 3,
    area: 3100,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop',
    tag: 'Featured',
  },
  {
    id: 6,
    title: 'Suburban Family Estate',
    price: 820000,
    location: 'Austin, TX',
    bedrooms: 5,
    bathrooms: 3,
    area: 3600,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop',
  },
];

export const FeaturedProperties = () => {
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const handleSave = (id: number) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">
            Handpicked for You
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Featured Properties
          </h2>
          <p className="text-gray-500 mt-3 max-w-lg">
            Explore our curated selection of premium properties across the country — from city penthouses to beachfront retreats.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ArrowRight size={18} />}
          className="shrink-0"
        >
          View All
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSave={handleSave}
            isSaved={savedIds.includes(property.id)}
          />
        ))}
      </div>
    </section>
  );
};