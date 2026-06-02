import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { api } from '../utils/api';
import {
  Star, CheckCircle2, Clock, RefreshCw, Package, ArrowLeft, Heart,
  Share2, Flag, ChevronDown, ChevronUp, MessageSquare, ShoppingBag,
  Zap, Shield, TrendingUp, Award, Globe, Calendar, Play, ExternalLink,
  Users, BarChart3, Loader2
} from 'lucide-react';

interface GigDetailScreenProps {
  serviceId: string;
  onBack: () => void;
}

export const GigDetailScreen: React.FC<GigDetailScreenProps> = ({ serviceId, onBack }) => {
  const { services, creators, user, setSelectedServiceForCheckout, setRequirementsModalService, savedServiceIds, toggleSavedService, openReportModal, setTab, setActiveChatConversationId } = useAppStore();
  const service = services.find(s => s.id === serviceId);
  const seller = creators.find(c => c.id === service?.creatorId);

  const [selectedPkg, setSelectedPkg] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  if (!service) return null;

  const isSaved = savedServiceIds.includes(service.id);

  const packages = service.packages || [
    { tier: 'basic' as const,    priceCents: Math.round(service.priceCents * 0.6), deliveryDays: service.deliveryDays + 2, revisions: 1, features: service.features.slice(0, 2) },
    { tier: 'standard' as const, priceCents: service.priceCents,                   deliveryDays: service.deliveryDays,     revisions: 2, features: service.features.slice(0, 3) },
    { tier: 'premium' as const,  priceCents: Math.round(service.priceCents * 1.8), deliveryDays: Math.max(1, service.deliveryDays - 2), revisions: 5, features: service.features },
  ];

  const faqs = service.faqs || [
    { q: 'What do you need from me to get started?', a: 'Just share your project brief, brand guidelines (if any), and your preferred timeline. I\'ll review everything and send a detailed proposal within 24 hours.' },
    { q: 'Do you offer revisions after delivery?', a: `Yes — the selected package includes the stated number of revisions. Additional revisions beyond that are available at a flat rate.` },
    { q: 'Can I request a custom package?', a: 'Absolutely. Use the Contact Seller button to discuss a tailored scope and pricing before placing your order.' },
    { q: 'What is the refund policy?', a: 'Payments are held in escrow. If I fail to deliver by the deadline, you receive a full refund through the SkillTok Resolution Center.' },
  ];

  const galleryImages = service.galleryImages?.length
    ? service.galleryImages
    : [service.image, service.image, service.image];

  const sellerStats = {
    completedOrders: seller?.followersCount ? Math.floor(seller.followersCount / 120) : 42,
    responseTime: '< 1 hour',
    onTimeRate: 98,
    level: seller?.plan === 'agency' ? 'Top Rated Plus' : seller?.plan === 'pro' ? 'Top Rated' : 'Rising Talent',
    levelColor: seller?.plan === 'agency' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
      : seller?.plan === 'pro' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
      : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  };

  const selectedPackage = packages.find(p => p.tier === selectedPkg) || packages[1];

  // Build a service object that carries the chosen package price into checkout
  const serviceForCheckout = {
    ...service,
    priceCents: selectedPackage.priceCents,
    deliveryDays: selectedPackage.deliveryDays,
  };

  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!service?.id) return;
    setReviewsLoading(true);
    api.get(`/api/reviews/service/${service.id}`)
      .then(res => setRealReviews(res.data || []))
      .catch(() => setRealReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [service?.id]);

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-28 lg:pb-12">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-slate-200 truncate flex-1">{service.title}</span>
        <button onClick={() => toggleSavedService(service.id)} className={`p-2 rounded-xl transition-colors ${isSaved ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'}`}>
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-400' : ''}`} />
        </button>
        <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 lg:grid lg:grid-cols-3 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">

          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 relative group cursor-pointer">
              <img
                src={galleryImages[activeGalleryIdx]}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
              <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-white">
                <Play className="w-3.5 h-3.5 text-cyan-400" /> View Sample
              </div>
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGalleryIdx(i)}
                    className={`w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeGalleryIdx === i ? 'border-cyan-500 scale-105' : 'border-slate-700 hover:border-slate-500'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Meta */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-full uppercase tracking-wide">
                {service.category}
              </span>
              {service.isFeatured && (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" /> Featured
                </span>
              )}
              <span className={`px-3 py-1 border text-xs font-bold rounded-full flex items-center gap-1 ${sellerStats.levelColor}`}>
                <Zap className="w-3 h-3" /> {sellerStats.level}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white leading-tight">{service.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">{service.rating}</span>
                <span className="text-slate-400">({reviewsLoading ? "..." : realReviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag className="w-4 h-4" />
                <span>{sellerStats.completedOrders} orders completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{service.deliveryDays} days delivery</span>
              </div>
            </div>
          </div>

          {/* About Seller */}
          {seller && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">About the Seller</h2>
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <img src={seller.avatar} alt={seller.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/30" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{seller.name}</span>
                    {seller.isVerified && <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${sellerStats.levelColor}`}>{sellerStats.level}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">@{seller.username}</p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed line-clamp-2">{seller.bio}</p>
                </div>
              </div>

              {/* Seller stats row */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                {[
                  { label: 'Response Time', value: sellerStats.responseTime, icon: <Clock className="w-4 h-4 text-cyan-400" /> },
                  { label: 'On-Time Delivery', value: `${sellerStats.onTimeRate}%`, icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
                  { label: 'Orders Done', value: `${sellerStats.completedOrders}+`, icon: <CheckCircle2 className="w-4 h-4 text-amber-400" /> },
                ].map(stat => (
                  <div key={stat.label} className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400">{stat.icon}{stat.label}</div>
                    <div className="font-black text-base text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setActiveChatConversationId('conv-1'); setTab('chat'); }}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Contact Seller
                </button>
                <button onClick={() => setTab("profile")} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all">
                  <Users className="w-4 h-4 text-indigo-400" /> View Profile
                </button>
              </div>
            </div>
          )}

          {/* Service Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-white">About This Gig</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{service.description}</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every project starts with a thorough discovery call to understand your goals, brand voice, and technical requirements. Deliverables are staged so you can provide feedback early — saving time and revisions.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {service.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 rounded-full hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer">
                  #{tag.replace(/\s/g, '')}
                </span>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-white">What's Included</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {service.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
                  <span className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">✓</span>
                  <span className="text-sm text-slate-200">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-white">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-bold text-sm text-white">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-black text-white text-lg">{service.rating}</span>
                <span className="text-slate-400 text-sm">({reviewsLoading ? "..." : realReviews.length})</span>
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              {[5,4,3,2,1].map(star => {
                const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 2 : 1;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 w-3">{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : realReviews.length === 0 ? (
                <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Star className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No reviews yet</p>
                  <p className="text-xs text-slate-500 mt-1">Be the first to order and leave a review</p>
                </div>
              ) : realReviews.map((review: any, i: number) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.buyer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${review.buyer_name}&backgroundColor=06b6d4`}
                        alt={review.buyer_name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-bold text-sm text-white">{review.buyer_name || 'Anonymous'}</div>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3.5 h-3.5 ${j < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{review.comment}</p>
                  {review.seller_reply && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 mt-2">
                      <p className="text-xs font-bold text-cyan-400 mb-1">Seller Response</p>
                      <p className="text-xs text-slate-300">{review.seller_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {realReviews.length > 0 && (
              <p className="text-xs text-center text-slate-500 pb-2">
                Showing all {realReviews.length} review{realReviews.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Report */}
          <div className="flex justify-center pb-4">
            <button
              onClick={() => openReportModal('user', service.creatorId, service.creatorName)}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" /> Report This Gig
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN — Sticky Order Box */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Package Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-3 border-b border-slate-800">
                {packages.map(pkg => (
                  <button
                    key={pkg.tier}
                    onClick={() => setSelectedPkg(pkg.tier)}
                    className={`py-3 text-xs font-black uppercase tracking-wider transition-all ${selectedPkg === pkg.tier ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {pkg.tier}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-white">{formatCurrency(selectedPackage.priceCents)}</span>
                  <span className="text-xs text-slate-400 font-semibold">+ 5% buyer protection fee</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{selectedPackage.deliveryDays} day{selectedPackage.deliveryDays !== 1 ? 's' : ''} delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-indigo-400" />
                    <span>{selectedPackage.revisions} revision{selectedPackage.revisions !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPackage.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 font-black text-xs">✓</span>
                      {feat}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setRequirementsModalService(serviceForCheckout)}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-cyan-500/20"
                >
                  <Package className="w-4 h-4" /> Order Now
                </button>

                <button
                  onClick={() => { setActiveChatConversationId('conv-1'); setTab('chat'); }}
                  className="w-full py-3 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-sm font-bold text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Contact Before Ordering
                </button>
              </div>

              {/* Trust indicators */}
              <div className="border-t border-slate-800 px-5 py-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: <Shield className="w-4 h-4 text-emerald-400 mx-auto" />, label: 'Escrow Protected' },
                  { icon: <Zap className="w-4 h-4 text-amber-400 mx-auto" />, label: 'Fast Delivery' },
                  { icon: <RefreshCw className="w-4 h-4 text-indigo-400 mx-auto" />, label: 'Free Revisions' },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    {item.icon}
                    <div className="text-[10px] text-slate-400 font-semibold leading-tight">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller quick card */}
            {seller && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <img src={seller.avatar} alt={seller.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-white truncate">{seller.name}</span>
                    {seller.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 flex-shrink-0" />}
                  </div>
                  <span className="text-xs text-slate-400">Responds {sellerStats.responseTime}</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400">Online</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-slate-400">Starting at</div>
          <div className="font-black text-xl text-white">{formatCurrency(packages[0].priceCents)}</div>
        </div>
        <button
          onClick={() => setRequirementsModalService(serviceForCheckout)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-cyan-500/20"
        >
          <Package className="w-4 h-4" /> Order Now
        </button>
      </div>
    </div>
  );
};
