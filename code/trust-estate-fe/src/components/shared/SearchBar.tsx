import { Search, MapPin, Home, DollarSign } from 'lucide-react';

export const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl md:rounded-full shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center">

          {/* Location */}
          <div className="flex flex-1 items-center gap-3 px-6 py-4 md:py-3.5 border-b md:border-b-0 border-gray-100 hover:bg-gray-50/60 transition-colors group">
            <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">
                Location
              </span>
              <input
                type="text"
                placeholder="City, neighbourhood..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 p-0 w-full"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-gray-200 shrink-0" />

          {/* Property Type */}
          <div className="flex flex-1 items-center gap-3 px-6 py-4 md:py-3.5 border-b md:border-b-0 border-gray-100 hover:bg-gray-50/60 transition-colors group">
            <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
              <Home size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">
                Property Type
              </span>
              <select className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer p-0 appearance-none w-full focus:ring-0">
                <option value="">Any Type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-gray-200 shrink-0" />

          {/* Price Range */}
          <div className="flex flex-1 items-center gap-3 px-6 py-4 md:py-3.5 border-b md:border-b-0 border-gray-100 hover:bg-gray-50/60 transition-colors group">
            <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
              <DollarSign size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">
                Price Range
              </span>
              <select className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer p-0 appearance-none w-full focus:ring-0">
                <option value="">Any Price</option>
                <option value="0-500k">Under $500K</option>
                <option value="500k-1m">$500K – $1M</option>
                <option value="1m-2m">$1M – $2M</option>
                <option value="2m+">Over $2M</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="p-3">
            <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full py-3.5 px-7 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 font-semibold text-sm whitespace-nowrap">
              <Search size={18} />
              <span className="md:hidden">Search Properties</span>
              <span className="hidden md:inline">Search</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
