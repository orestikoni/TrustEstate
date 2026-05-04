import { Search, MapPin, Home, DollarSign } from 'lucide-react';

export const SearchBar = () => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-full shadow-xl shadow-black/10 p-2 md:p-3 relative z-10 flex flex-col md:flex-row gap-2 md:gap-0 items-center divide-y md:divide-y-0 md:divide-x divide-gray-100 border border-gray-100">
      {/* Location */}
      <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 md:py-2 group">
        <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
          <MapPin size={20} />
        </div>
        <div className="flex flex-col w-full">
          <label className="text-xs font-semibold text-gray-900 tracking-wide uppercase">
            Location
          </label>
          <input
            type="text"
            placeholder="Where do you want to live?"
            className="w-full bg-transparent border-none outline-none text-sm text-gray-600 placeholder:text-gray-400 focus:ring-0 p-0"
          />
        </div>
      </div>

      {/* Property Type */}
      <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 md:py-2 group">
        <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
          <Home size={20} />
        </div>
        <div className="flex flex-col w-full">
          <label className="text-xs font-semibold text-gray-900 tracking-wide uppercase">
            Property Type
          </label>
          <select className="w-full bg-transparent border-none outline-none text-sm text-gray-600 cursor-pointer focus:ring-0 p-0 appearance-none">
            <option value="">Any Type</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="townhouse">Townhouse</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 md:py-2 group">
        <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
          <DollarSign size={20} />
        </div>
        <div className="flex flex-col w-full">
          <label className="text-xs font-semibold text-gray-900 tracking-wide uppercase">
            Price Range
          </label>
          <select className="w-full bg-transparent border-none outline-none text-sm text-gray-600 cursor-pointer focus:ring-0 p-0 appearance-none">
            <option value="">Any Price</option>
            <option value="0-500k">Under $500,000</option>
            <option value="500k-1m">$500,000 - $1,000,000</option>
            <option value="1m-2m">$1,000,000 - $2,000,000</option>
            <option value="2m+">Over $2,000,000</option>
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="w-full md:w-auto px-2 md:pl-4 py-2 md:py-0">
        <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 md:px-8 md:py-4 flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 font-medium">
          <Search size={20} />
          <span className="md:hidden">Search Properties</span>
        </button>
      </div>
    </div>
  );
};