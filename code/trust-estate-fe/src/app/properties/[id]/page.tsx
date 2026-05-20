'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  MapPin,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  MessageSquare,
  CheckCircle2,
  Building2,
  Tag,
  Globe,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/store/auth.context';
import { listingService, type ApiListing } from '@/services/listing.service';
import { offerService } from '@/services/offer.service';
import { messageService } from '@/services/message.service';
import { ApiRequestError } from '@/lib/api-client';
import type { SubmitOfferRequest } from '@/types';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const listingId = parseInt(rawId ?? '', 10);

  // ── Listing state ─────────────────────────────────────────────────────────
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);

  // ── Gallery state ─────────────────────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ── Favorites state ───────────────────────────────────────────────────────
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // ── Contact form state ────────────────────────────────────────────────────
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactContent, setContactContent] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  // ── Offer modal state ─────────────────────────────────────────────────────
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState(false);

  // ── Role derivation ───────────────────────────────────────────────────────
  const isGuest = !isAuthenticated;
  const isBuyer = user?.role === 'Buyer';
  // Only buyers can send offers or save favorites; all others just contact agent
  const canSendOffer = isBuyer;
  const canSaveFavorite = isBuyer;

  // ── Fetch listing ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isNaN(listingId)) {
      setListingError('Invalid property ID.');
      setLoadingListing(false);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoadingListing(true);
        const data = await listingService.getListing(listingId);
        if (!cancelled) setListing(data);
      } catch (err) {
        if (!cancelled) {
          setListingError(
            err instanceof ApiRequestError ? err.message : 'Failed to load property details.',
          );
        }
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [listingId]);

  // ── Check if already favorited (buyers only) ──────────────────────────────
  useEffect(() => {
    if (!isBuyer || !listing) return;
    let cancelled = false;
    const check = async () => {
      try {
        const favorites = await listingService.getFavorites();
        if (!cancelled) setIsFavorite(favorites.some((f) => f.listingId === listingId));
      } catch {
        // silently fail — non-critical
      }
    };
    check();
    return () => { cancelled = true; };
  }, [isBuyer, listing, listingId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const photos = (listing?.photos ?? []).slice().sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const hasPhotos = photos.length > 0;

  const nextImage = () =>
    setCurrentImageIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  const prevImage = () =>
    setCurrentImageIndex((i) => (i === 0 ? photos.length - 1 : i - 1));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

  // ── Favorite toggle ───────────────────────────────────────────────────────
  const handleFavoriteToggle = async () => {
    if (isGuest) { router.push('/login'); return; }
    if (!canSaveFavorite) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await listingService.removeFavorite(listingId);
        setIsFavorite(false);
      } else {
        await listingService.saveFavorite(listingId);
        setIsFavorite(true);
      }
    } catch {
      // silently fail
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ── Send offer ────────────────────────────────────────────────────────────
  const handleSendOfferClick = () => {
    if (isGuest) { router.push('/login'); return; }
    if (!canSendOffer) return;
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      setOfferError('Please enter a valid offer price.');
      return;
    }
    setOfferLoading(true);
    setOfferError(null);
    try {
      const payload: SubmitOfferRequest = {
        listingId: listing.listingId,
        proposedPrice: price,
        ...(offerMessage.trim() ? { message: offerMessage.trim() } : {}),
      };
      await offerService.submitOffer(payload);
      setOfferSuccess(true);
      setOfferPrice('');
      setOfferMessage('');
    } catch (err) {
      setOfferError(
        err instanceof ApiRequestError ? err.message : 'Failed to submit offer. Please try again.',
      );
    } finally {
      setOfferLoading(false);
    }
  };

  const closeOfferModal = () => {
    setShowOfferModal(false);
    setOfferError(null);
    setOfferSuccess(false);
    setOfferPrice('');
    setOfferMessage('');
  };

  // ── Contact agent ─────────────────────────────────────────────────────────
  const handleContactAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !isAuthenticated) return;
    if (!listing.agentId) {
      setContactError('No agent is assigned to this listing yet.');
      return;
    }
    const trimmed = contactContent.trim();
    if (!trimmed) {
      setContactError('Please enter a message.');
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      await messageService.sendMessage({
        recipientId: listing.agentId,
        listingId: listing.listingId,
        content: trimmed,
      });
      setContactSuccess(true);
      setContactContent('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // 403 means buyer hasn't submitted an offer yet — backend restriction
        setContactError(
          err.statusCode === 403
            ? 'You must submit an offer on this listing before messaging the agent.'
            : err.message,
        );
      } else {
        setContactError('Failed to send message. Please try again.');
      }
    } finally {
      setContactLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || loadingListing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-600 font-medium">Loading property…</p>
        </div>
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (listingError || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="text-red-500 mx-auto" size={48} />
          <h2 className="text-2xl font-bold text-gray-900">Property Not Found</h2>
          <p className="text-gray-600">{listingError ?? 'This property does not exist.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentPhoto = hasPhotos ? photos[currentImageIndex] : null;
  const isListingActive = listing.status === 'Active';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                <Home size={22} />
              </div>
              <span className="text-xl font-bold text-gray-900">TrustEstate</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-sm">
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Image gallery ───────────────────────────────────────────── */}
        <div className="mb-8">
          {/* Main image */}
          <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-xl mb-4 group bg-gray-200">
            {hasPhotos ? (
              <>
                <img
                  src={currentPhoto!.photoUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg';
                  }}
                />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={22} className="text-gray-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={22} className="text-gray-900" />
                    </button>
                    <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-sm text-white rounded-xl font-semibold text-sm">
                      {currentImageIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Building2 size={64} />
              </div>
            )}
          </div>

          {/* Thumbnails (up to 6) */}
          {photos.length > 1 && (
            <div className="grid grid-cols-6 gap-3">
              {photos.slice(0, 6).map((photo, index) => (
                <button
                  key={photo.photoId}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-20 rounded-xl overflow-hidden transition-all ${
                    currentImageIndex === index
                      ? 'ring-4 ring-blue-500 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.photoUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/property-placeholder.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main content grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title & Price */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    listing.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : listing.status === 'UnderOffer'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {listing.status === 'UnderOffer' ? 'Under Offer' : listing.status}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                  For {listing.listingType}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                  {listing.propertyType}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{listing.title}</h1>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin size={18} className="text-blue-600 flex-shrink-0" />
                <span>
                  {listing.address}, {listing.city}, {listing.country}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-4xl font-bold text-blue-600">
                  {formatPrice(listing.askingPrice)}
                  {listing.listingType === 'Rent' && (
                    <span className="text-lg font-medium text-gray-500">/mo</span>
                  )}
                </p>
              </div>
            </div>

            {/* Property details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="text-blue-600" size={24} />
                Property Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
                  <Building2 className="text-blue-600 mb-2" size={22} />
                  <p className="text-xs text-gray-500 mb-1">Property Type</p>
                  <p className="font-bold text-gray-900">{listing.propertyType}</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
                  <Tag className="text-blue-600 mb-2" size={22} />
                  <p className="text-xs text-gray-500 mb-1">Listing Type</p>
                  <p className="font-bold text-gray-900">For {listing.listingType}</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
                  <Globe className="text-blue-600 mb-2" size={22} />
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {listing.city}, {listing.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Property Description</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            </div>

            {/* Published date */}
            {listing.publishedAt && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-4 flex items-center gap-3 text-sm text-gray-500">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={18} />
                Listed on{' '}
                <span className="font-semibold text-gray-800">
                  {new Date(listing.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Right column — sticky action panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Action buttons */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">

                {/* Send Offer — guests see a redirect CTA, buyers see the real button,
                    owners / agents / inspectors / admins see nothing */}
                {(isGuest || isBuyer) && (
                  <button
                    onClick={handleSendOfferClick}
                    disabled={!isGuest && !isListingActive}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare size={20} />
                    {isGuest ? 'Sign In to Send Offer' : 'Send Offer'}
                  </button>
                )}

                {/* Save to Favorites — guests see redirect CTA, buyers see toggle,
                    all other roles see nothing */}
                {(isGuest || isBuyer) && (
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`w-full py-4 font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      isBuyer && isFavorite
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {favoriteLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Heart
                        size={20}
                        className={isBuyer && isFavorite ? 'fill-red-600' : ''}
                      />
                    )}
                    {isGuest
                      ? 'Sign In to Save'
                      : isFavorite
                      ? 'Saved to Favorites'
                      : 'Save to Favorites'}
                  </button>
                )}

                {/* Contact Agent — visible to everyone */}
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="w-full py-4 bg-white text-blue-600 font-bold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={20} />
                  Contact Agent
                </button>
              </div>

              {/* Contact Agent form (expanded inline) */}
              {showContactForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Message the Agent</h3>

                  {/* Guest: redirect to login */}
                  {isGuest ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        You need to be signed in to contact the agent.
                      </p>
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Sign In to Message
                      </button>
                    </div>
                  ) : !listing.agentId ? (
                    /* No agent assigned yet */
                    <p className="text-sm text-gray-500 py-2">
                      No agent has been assigned to this listing yet.
                    </p>
                  ) : contactSuccess ? (
                    /* Success state */
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <CheckCircle2 className="text-green-500" size={36} />
                      <p className="font-semibold text-gray-900">Message sent!</p>
                      <p className="text-sm text-gray-500">
                        The agent will reply in your Messages inbox.
                      </p>
                      <button
                        onClick={() => { setContactSuccess(false); setShowContactForm(false); }}
                        className="mt-1 text-sm text-blue-600 hover:underline"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    /* Authenticated: real form */
                    <form onSubmit={handleContactAgentSubmit} className="space-y-3">
                      <textarea
                        value={contactContent}
                        onChange={(e) => setContactContent(e.target.value)}
                        placeholder="Write your message to the agent…"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                      {contactError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          {contactError}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {contactLoading
                          ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
                          : <><Phone size={16} /> Send Message</>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Trust & Safety */}
              <div className="bg-blue-50 rounded-2xl border-2 border-blue-100 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="text-blue-600" size={22} />
                  <h3 className="font-bold text-gray-900">Trust &amp; Safety</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  All listings are verified. Your information is secure and will only be shared
                  with the property agent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Offer modal ─────────────────────────────────────────────────── */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            {/* Close */}
            <button
              onClick={closeOfferModal}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={22} />
            </button>

            {offerSuccess ? (
              /* Success state */
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="text-green-500 mx-auto" size={56} />
                <h3 className="text-2xl font-bold text-gray-900">Offer Submitted!</h3>
                <p className="text-gray-600">
                  Your offer has been sent to the agent. Track its status in your dashboard.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeOfferModal}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href="/buyer"
                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center"
                  >
                    View My Offers
                  </Link>
                </div>
              </div>
            ) : (
              /* Offer form */
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Make an Offer</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Submitting for{' '}
                  <span className="font-semibold text-gray-800">{listing.title}</span>
                </p>

                <form onSubmit={handleSubmitOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Offer Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder={String(listing.askingPrice)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Asking price: {formatPrice(listing.askingPrice)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message{' '}
                      <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Add a note to the agent…"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  {offerError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {offerError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={offerLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {offerLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <MessageSquare size={20} />
                        Submit Offer
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
