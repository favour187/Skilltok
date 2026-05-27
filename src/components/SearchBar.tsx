import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Star, Clock } from 'lucide-react';

interface Props {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
}

export interface SearchFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  maxDeliveryDays: number;
  sortBy: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'newest';
}

const CATEGORIES = ['All', 'Web Development', 'Video & Animation', 'UI/UX Design', 'Audio & Music', 'Marketing', 'Writing', 'Business', 'AI & Data'];

export const SearchBar: React.FC<Props> = ({ onSearch, placeholder = 'Search videos, creators, services...' }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'All',
    minPrice: 0,
    maxPrice: 1000000,
    minRating: 0,
    maxDeliveryDays: 60,
    sortBy: 'relevance'
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const activeFiltersCount = [
    filters.category !== 'All',
    filters.minPrice > 0,
    filters.maxPrice < 1000000,
    filters.minRating > 0,
    filters.maxDeliveryDays < 60,
    filters.sortBy !== 'relevance'
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {query && (
            <button onClick={() => { setQuery(''); onSearch('', filters); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button onClick={handleSearch}
          className="px-5 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-cyan-500/20">
          Search
        </button>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3.5 rounded-2xl border-2 font-bold text-xs flex items-center gap-1.5 relative ${
            showFilters || activeFiltersCount > 0 
              ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300' 
              : 'bg-slate-950 border-slate-700 text-slate-300'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 animate-in fade-in duration-200">
          {/* Categories */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilters({ ...filters, category: cat })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    filters.category === cat 
                      ? 'bg-cyan-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Price Range: ${filters.minPrice / 100} – ${filters.maxPrice / 100}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Min" value={filters.minPrice / 100}
                onChange={(e) => setFilters({ ...filters, minPrice: parseFloat(e.target.value || '0') * 100 })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              <input type="number" placeholder="Max" value={filters.maxPrice / 100}
                onChange={(e) => setFilters({ ...filters, maxPrice: parseFloat(e.target.value || '10000') * 100 })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          {/* Min rating */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Minimum Rating</label>
            <div className="flex gap-2">
              {[0, 3, 4, 4.5, 5].map(r => (
                <button key={r} onClick={() => setFilters({ ...filters, minRating: r })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    filters.minRating === r ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                  <Star className="w-3 h-3 fill-current" />
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Max delivery */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Delivery</label>
            <div className="flex gap-2">
              {[1, 3, 7, 14, 60].map(d => (
                <button key={d} onClick={() => setFilters({ ...filters, maxDeliveryDays: d })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    filters.maxDeliveryDays === d ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                  <Clock className="w-3 h-3" />
                  {d === 60 ? 'Any' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</label>
            <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500">
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated ⭐</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button onClick={() => {
              const reset: SearchFilters = { category: 'All', minPrice: 0, maxPrice: 1000000, minRating: 0, maxDeliveryDays: 60, sortBy: 'relevance' };
              setFilters(reset);
              onSearch(query, reset);
            }} className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">
              Reset
            </button>
            <button onClick={handleSearch}
              className="flex-1 py-2 bg-cyan-500 text-slate-950 text-xs font-extrabold rounded-xl">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
