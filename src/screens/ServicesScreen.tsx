import React, { useState } from 'react';
import { useTranslation } from '../utils/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { ShoppingBag, Star, Sparkles, Filter, PlusCircle, CheckCircle2, ArrowRight, Eye } from 'lucide-react';

export const ServicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { 
    services, 
    setCreateServiceModalOpen,
    searchQuery,
    setSearchQuery,
    user,
    savedServiceIds,
    toggleSavedService,
    setTab,
    setActiveGigDetailId
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(150000); // 1500 dollars
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'newest'>('rating');

  const categories = ['All', 'Web Development', 'Video & Animation', 'UI/UX Design', 'Audio & Music'];
  const categoryKeys: Record<string, string> = {
    'All': t('cat.all'),
    'Web Development': t('cat.webdev'),
    'Video & Animation': t('cat.video'),
    'UI/UX Design': t('cat.design'),
    'Audio & Music': t('cat.audio'),
  };

  const filteredServices = services
    .filter(s => {
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPrice = s.priceCents <= maxPrice;
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_low') return a.priceCents - b.priceCents;
      if (sortBy === 'price_high') return b.priceCents - a.priceCents;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Marketplace Banner */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-cyan-900/60 via-indigo-900/50 to-slate-900 border border-cyan-500/20 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> SkillTok Marketplace
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Hire Verified Creators & Freelancers Instantly
            </h1>
            <p className="text-sm text-slate-300 font-normal leading-relaxed">
              Explore premium video editing, web development, UI design, and audio services. Fully escrow-secured with 5% buyer protection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role !== 'buyer' && (
              <button
                onClick={() => setCreateServiceModalOpen(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create New Gig</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> {t('svc.sortBy')}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="rating">Highest Rated ⭐</option>
                <option value="price_low">{t('svc.priceLow')}</option>
                <option value="price_high">{t('svc.priceHigh')}</option>
                <option value="newest">{t('svc.newest')}</option>
              </select>
            </div>

          </div>

          {/* Search & Price Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Search gigs by title, tags, or creator name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 whitespace-nowrap">{t('svc.maxPrice')}:</span>
              <input
                type="range"
                min="1000"
                max="150000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-bold text-cyan-400">{formatCurrency(maxPrice)}</span>
            </div>
          </div>
        </div>

        {/* Gigs Grid */}
        {filteredServices.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-lg text-slate-300">{t('svc.noServices')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('svc.noServicesHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div 
                key={service.id}
                className="group bg-slate-900 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider border border-slate-700">
                    {service.category}
                  </span>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSavedService(service.id); }}
                      className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                        savedServiceIds.includes(service.id) 
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                          : 'bg-slate-950/80 border-slate-700 text-slate-400 hover:text-rose-400'
                      }`}
                      title={savedServiceIds.includes(service.id) ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <svg className="w-4 h-4" fill={savedServiceIds.includes(service.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-amber-400 border border-slate-700">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{service.rating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({service.reviewCount || 15})</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  
                  {/* Creator Info */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={service.creatorAvatar} 
                      alt={service.creatorName} 
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-200">{service.creatorName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                      </div>
                      <span className="text-[10px] text-slate-400">@{service.creatorUsername}</span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 font-light leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                    {service.features.slice(0, 2).map((feat, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Price & Order */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">STARTING AT</span>
                      <span className="font-black text-lg text-cyan-400">{formatCurrency(service.priceCents)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActiveGigDetailId(service.id); setTab('gigDetail' as any); }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => useAppStore.setState({ requirementsModalService: service })}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shadow-cyan-500/10"
                      >
                        <span>Order Gig</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
