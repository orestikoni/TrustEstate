import { SearchBar } from '@/components/shared/SearchBar';

export const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      {/* 
        TODO:
        Place a high-resolution hero background image at:
          public/images/hero-bg.jpg
      */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center gap-8">
        <div className="space-y-4">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest">
            Where Prestige Finds Its Address
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            Find Your{' '}
            <span className="text-blue-400">Perfect</span>
            <br />
            Place to Call Home
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light">
            Explore thousands of premium properties curated for discerning buyers and renters across the country.
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-white mt-2">
          {[
            { value: '12,000+', label: 'Properties Listed' },
            { value: '8,500+', label: 'Happy Clients' },
            { value: '150+', label: 'Expert Agents' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full mt-4">
          <SearchBar />
        </div>
      </div>
    </section>
  );
};