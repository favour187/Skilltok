import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Search, Star, CheckCircle2, MapPin, Clock, Zap, Award, Filter,
  MessageSquare, UserPlus, Check, TrendingUp, Globe, Shield, ChevronDown, X
} from 'lucide-react';

export const TalentScreen: React.FC = () => {
  const { creators, setTab, setActiveChatConversationId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [maxHourlyRate, setMaxHourlyRate] = useState(300);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const skills = ['All', 'React', 'Next.js', 'Figma', 'Blender', 'After Effects', 'Node.js', 'Tailwind', 'Sound Design', 'Video Editing'];
  const levels = ['All', 'Top Rated Plus', 'Top Rated', 'Rising Talent'];

  const getLevel = (plan: string) => plan === 'agency' ? 'Top Rated Plus' : plan === 'pro' ? 'Top Rated' : 'Rising Talent';
  const getLevelColor = (plan: string) => plan === 'agency' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : plan === 'pro' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
  const getHourlyRate = (id: string) => {
    const rates: Record<string, number> = { 'u-101': 95, 'u-102': 150, 'u-103': 120, 'u-104': 65 };
    return rates[id] || 75;
  };
  const getCompletionRate = (id: string) => {
    const rates: Record<string, number> = { 'u-101': 98, 'u-102': 96, 'u-103': 99, 'u-104': 94 };
    return rates[id] || 95;
  };
  const getRating = (id: string) => {
    const ratings: Record<string, number> = { 'u-101': 4.9, 'u-102': 5.0, 'u-103': 4.8, 'u-104': 4.7 };
    return ratings[id] || 4.8;
  };
  const getReviews = (id: string) => {
    const counts: Record<string, number> = { 'u-101': 312, 'u-102': 847, 'u-103': 284, 'u-104': 61 };
    return counts[id] || 80;
  };
  const getAvailability = (id: string) => {
    const avail: Record<string, string> = { 'u-101': 'Available Now', 'u-102': 'Busy – Available in 3 days', 'u-103': 'Available Now', 'u-104': 'Available Now' };
    return avail[id] || 'Available Now';
  };
  const getCountry = (id: string) => {
    const countries: Record<string, string> = { 'u-101': '🇺🇸 United States', 'u-102': '🇬🇧 United Kingdom', 'u-103': '🇦🇺 Australia', 'u-104': '🇨🇦 Canada' };
    return countries[id] || '🌍 Global';
  };

  const freelancers = creators.filter(c => c.role !== 'admin' && c.role !== 'buyer');

  const filtered = freelancers.filter(f => {
    const matchesSearch = searchQuery === '' ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSkill = selectedSkill === 'All' || f.skills?.some(s => s.toLowerCase().includes(selectedSkill.toLowerCase()));
    const matchesLevel = selectedLevel === 'All' || getLevel(f.plan) === selectedLevel;
    const matchesRate = getHourlyRate(f.id) <= maxHourlyRate;
    return matchesSearch && matchesSkill && matchesLevel && matchesRate;
  });

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Banner */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Verified Talent Network
            </div>
            <h1 className="text-3xl font-black text-white">Find World-Class Freelance Talent</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every seller is skill-verified. Browse profiles, check reviews, and hire confidently with escrow payment protection.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-4 mt-6">
            {[{ label: 'Verified Sellers', value: `${freelancers.length * 1200}+` }, { label: 'Categories', value: '50+' }, { label: 'Avg. Rating', value: '4.9★' }].map(stat => (
              <div key={stat.label} className="bg-slate-900/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/50 text-center">
                <div className="font-black text-xl text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filters bar */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, skill, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${showFilters ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Skill</label>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 6).map(skill => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedSkill === skill ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Seller Level</label>
                <div className="space-y-1">
                  {levels.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all ${selectedLevel === lvl ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Max Hourly Rate: <span className="text-indigo-400">${maxHourlyRate}/hr</span>
                </label>
                <input
                  type="range" min={20} max={300} step={10}
                  value={maxHourlyRate}
                  onChange={e => setMaxHourlyRate(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>$20</span><span>$300</span>
                </div>
              </div>
            </div>
          )}

          {/* Skill pills scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {skills.map(skill => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedSkill === skill ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-slate-400">
          Showing <span className="font-bold text-white">{filtered.length}</span> verified freelancers
        </div>

        {/* Talent Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <Search className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">No freelancers match your filters. Try broadening your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(creator => {
              const hourly = getHourlyRate(creator.id);
              const rating = getRating(creator.id);
              const reviews = getReviews(creator.id);
              const completion = getCompletionRate(creator.id);
              const availability = getAvailability(creator.id);
              const country = getCountry(creator.id);
              const level = getLevel(creator.plan);
              const levelColor = getLevelColor(creator.plan);
              const isAvailable = availability.startsWith('Available Now');
              const isFollowed = following[creator.id];

              return (
                <div
                  key={creator.id}
                  className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                >
                  {/* Card header gradient */}
                  <div className="h-20 bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${levelColor}`}>
                        <Award className="w-2.5 h-2.5" /> {level}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    {/* Avatar overlapping header */}
                    <div className="flex items-end justify-between -mt-8 mb-3">
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-900 shadow-xl bg-slate-800"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 mt-2">
                        <span className="font-black text-base text-white">${hourly}</span>
                        <span className="text-[10px] text-slate-400">/hr</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Name & verified */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors truncate">{creator.name}</h3>
                          {creator.isVerified && <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{country}</span>
                          <span className={`flex items-center gap-1 font-semibold ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {isAvailable ? 'Available' : 'Busy'}
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{creator.bio}</p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5">
                        {creator.skills?.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300">{skill}</span>
                        ))}
                        {(creator.skills?.length || 0) > 3 && (
                          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-500">+{(creator.skills?.length || 0) - 3}</span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-800">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-black text-sm text-white">{rating}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{reviews} reviews</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-sm text-white">{completion}%</div>
                          <div className="text-[10px] text-slate-500">Job Success</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-sm text-white">{Math.floor(creator.followersCount / 120)}+</div>
                          <div className="text-[10px] text-slate-500">Jobs Done</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActiveChatConversationId('conv-1'); setTab('chat'); }}
                          className="flex-1 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Hire Me
                        </button>
                        <button
                          onClick={() => setFollowing(prev => ({ ...prev, [creator.id]: !prev[creator.id] }))}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${isFollowed ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'}`}
                        >
                          {isFollowed ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
