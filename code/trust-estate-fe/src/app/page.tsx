import { Building2, UserRound } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/shared/Hero';
import { FeaturedProperties } from '@/components/shared/FeaturedProperties';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function RootPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 text-gray-900 flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedProperties />

        {/* What Would You Like To Do Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">
                Get Started Today
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
                What Would You Like to Do?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Whether you&apos;re searching for your next home or need expert guidance, we have everything you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Browse Properties Card */}
              <div className="bg-white rounded-3xl p-8 text-center shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center">
                <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <Building2 size={48} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Properties</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Explore thousands of premium listings across the country and find the perfect
                  property tailored to your lifestyle and budget.
                </p>
                <Button variant="ghost" size="sm" className="border border-blue-500 px-6 font-bold mt-auto">
                  Browse Now
                </Button>
              </div>

              {/* Contact an Agent Card */}
              <div className="bg-white rounded-3xl p-8 text-center shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center">
                <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <UserRound size={48} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Contact an Agent</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Connect with our expert local agents who will personally guide you through every
                  step of your real estate journey.
                </p>
                <Button variant="ghost" size="sm" className="border border-blue-500 px-6 font-bold mt-auto">
                  Find an Agent
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}