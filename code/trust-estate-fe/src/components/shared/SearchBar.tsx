'use client';

import { Search, MapPin, Home, DollarSign } from 'lucide-react';
import { useState } from 'react';

export const SearchBar = () => {
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* No overflow-hidden — prevents rounded-full from clipping the button */}
      <div className="bg-white rounded-full border border-white/20 shadow-2xl shadow-black/30 flex items-center">

        {/* Location */}
        <div className="flex flex-1 items-center gap-3 px-5 py-3 border-r border-gray-200 hover:bg-gray-50/60 transition-colors group rounded-l-full">
          <div className="bg-blue-50 p-1.5 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
            <MapPin size={16} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">
              Location
            </span>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City, neighbourhood..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 p-0 w-full"
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="flex flex-1 items-center gap-3 px-5 py-3 border-r border-gray-200 hover:bg-gray-50/60 transition-colors group">
          <div className="bg-blue-50 p-1.5 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
            <Home size={16} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">
              Property Type
            </span>
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer p-0 appearance-none w-full focus:ring-0"
            >
              <option value="">Any Type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-1 items-center gap-3 px-5 py-3 border-r border-gray-200 hover:bg-gray-50/60 transition-colors group">
          <div className="bg-blue-50 p-1.5 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
            <DollarSign size={16} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">
              Price Range
            </span>
            <select
              value={priceRange}
              onChange={e => setPriceRange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer p-0 appearance-none w-full focus:ring-0"
            >
              <option value="">Any Price</option>
              <option value="0-500k">Under $500K</option>
              <option value="500k-1m">$500K – $1M</option>
              <option value="1m-2m">$1M – $2M</option>
              <option value="2m+">Over $2M</option>
            </select>
          </div>
        </div>

        {/* Search Button — outside overflow-hidden so it's never clipped */}
        <div className="px-3 py-2 shrink-0">
          <button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full py-2.5 px-6 flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 font-semibold text-sm whitespace-nowrap">
            <Search size={16} />
            Search
          </button>
        </div>

      </div>
    </div>
  );
};
