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

        {/* Call to Action Section */}
        <section className="bg-blue-600 text-white py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 font-light max-w-2xl mx-auto">
              Join thousands of satisfied homeowners who found their dream property with TrustEstate today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full text-blue-600 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-1"
              >
                Browse Properties
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="rounded-full shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-1"
              >
                Contact an Agent
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}