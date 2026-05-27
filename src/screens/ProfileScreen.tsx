import React, { useState, useEffect } from 'react';
import { useTranslation } from '../utils/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { CheckCircle2, Video, ShoppingBag, Heart, Star, Settings, TrendingUp, Eye, DollarSign, Users, ArrowUpRight, Award, BookOpen, Bookmark } from 'lucide-react';
import { ReferralHub } from '../components/ReferralHub';
import { SkillTestModal } from '../components/SkillTestModal';

export const ProfileScreen: React.FC = () => {
  const { user, videos, services, setTab, setSelectedServiceForCheckout, savedServiceIds, setActiveGigDetailId, toggleSavedService } = useAppStore();
  const [activeTab, setActiveTab] = useState<'videos' | 'services' | 'reviews' | 'analytics' | 'referral' | 'saved' | 'skills'>('videos');
  const [profileReviews, setProfileReviews] = useState<any[]>([]);
  const [skillTestModal, setSkillTestModal] = useState<{ open: boolean; skill?: string }>({ open: false });

  // Declare early so it's available in useEffect below
  const currentUser = user;
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('skilltok_access_token');
    fetch(`${(import.meta as any).env?.VITE_BACKEND_URL || ''}/api/reviews/seller/${currentUser.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : { reviews: [] })
      .then(data => setProfileReviews(data.reviews || []))
      .catch(() => setProfileReviews([]));
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="flex-1 bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400 text-sm">Please log in to view your profile.</p>
      </div>
    );
  }

  const myVideos = videos.filter(v => v.creatorId === currentUser.id || currentUser.role === 'admin');
  const myServices = services.filter(s => s.creatorId === currentUser.id || currentUser.role === 'admin');

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Card Banner */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="h-36 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            <div className="absolute top-4 right-4 bg-slate-950/80 px-3 py-1 rounded-full text-xs font-extrabold text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              {currentUser.role} Account ({currentUser.plan} tier)
            </div>
          </div>

          <div className="p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              <div className="flex items-end gap-4">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-slate-900 shadow-2xl bg-slate-800"
                />
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <p className="text-sm font-semibold text-cyan-400">@{currentUser.username}</p>
                </div>
              </div>

              <button
                onClick={() => setTab('settings')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 self-start sm:self-auto transition-all"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Edit Profile & Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Bio</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-light">{currentUser.bio || 'No bio specified.'}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Expertise / Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.skills?.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-cyan-300 border border-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 flex flex-col justify-around gap-2 text-center">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-xl font-black text-white">{(currentUser.followersCount ?? 0).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Followers</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-xl font-black text-white">{(currentUser.followingCount ?? 0).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Following</span>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-slate-500">
                  Member since {currentUser.joinedDate} • Verified Account
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Portfolio Tabs Toggle */}
        <div className="flex border-b border-slate-800 gap-6 overflow-x-auto">
          {[
            { id: 'videos', label: `${t('prof.videos')} (${myVideos.length})`, icon: Video },
            { id: 'services', label: `${t('prof.gigs')} (${myServices.length})`, icon: ShoppingBag },
            { id: 'saved', label: `Saved (${savedServiceIds.length})`, icon: Bookmark },
            { id: 'skills', label: 'Skills & Certs', icon: Award },
            { id: 'reviews', label: `${t('prof.reviews')} (${profileReviews.length})`, icon: Star },
            { id: 'analytics', label: t('prof.analytics'), icon: TrendingUp },
            { id: 'referral', label: '🎁 Refer & Earn', icon: Heart }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`pb-3 font-extrabold text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                  activeTab === t.id 
                    ? 'border-cyan-400 text-cyan-400 font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}>
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'videos' && (
          myVideos.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <Video className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-300">No Videos Published Yet</h3>
              <p className="text-xs text-slate-500">Upload your first video clip to start getting views and gig orders!</p>
              <button onClick={() => setTab('upload')} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl">Upload First Video</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {myVideos.map(vid => (
                <div key={vid.id} className="group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer">
                  <img src={vid.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <p className="font-bold text-xs line-clamp-2 drop-shadow">{vid.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-bold">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> {vid.likes}</span>
                      <span>👁️ {(vid.views ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'services' && (
          myServices.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-300">No Freelance Gigs Created Yet</h3>
              <p className="text-xs text-slate-500">List your professional service so buyers can hire you instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map(service => (
                <div key={service.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
                  <img src={service.image} className="w-full h-44 object-cover" alt="" />
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{service.category}</span>
                      <h4 className="font-bold text-sm text-white line-clamp-2 mt-0.5">{service.title}</h4>
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{service.rating}</span>
                        <span className="text-[10px] text-slate-400">({service.reviewCount})</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">PRICE</span>
                        <span className="font-black text-lg text-cyan-400">{formatCurrency(service.priceCents)}</span>
                      </div>
                      <button onClick={() => setSelectedServiceForCheckout(service)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl">Order Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {profileReviews.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
                <Star className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-bold text-base text-slate-300">No Reviews Yet</h3>
                <p className="text-xs text-slate-500">Complete orders to start receiving reviews from buyers.</p>
              </div>
            ) : profileReviews.map((r: any) => (
              <div key={r.id} className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <img src={r.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewer_name)}&background=0f172a&color=06b6d4`} className="w-10 h-10 rounded-full" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{r.reviewer_name}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />)}
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Views', value: currentUser.totalViews ? `${(currentUser.totalViews/1000).toFixed(1)}K` : '—', icon: Eye, color: 'cyan' },
                { label: 'Profile Visits', value: currentUser.followersCount ? (currentUser.followersCount ?? 0).toLocaleString() : '0', icon: Users, color: 'purple' },
                { label: 'Total Earnings', value: currentUser.totalEarnings ? `$${(currentUser.totalEarnings ?? 0).toLocaleString()}` : '$0', icon: DollarSign, color: 'emerald' },
                { label: 'Avg Rating', value: currentUser.avgRating ? `${currentUser.avgRating} ★` : '—', icon: Star, color: 'amber' }
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`p-5 bg-slate-900 rounded-2xl border border-${s.color}-500/30 shadow-xl`}>
                    <Icon className={`w-5 h-5 text-${s.color}-400 mb-2`} />
                    <span className="text-2xl font-black text-white block">{s.value}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{s.label}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">Live from your account</span>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Performance Insights</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-700">
                  <p className="text-slate-400">📊 Videos posted: <strong className="text-white">{myVideos.length}</strong></p>
                  <p className="text-slate-500 mt-1">Keep posting consistently to grow your reach on the platform.</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-700">
                  <p className="text-slate-400">🛍️ Active gigs: <strong className="text-white">{myServices.length}</strong></p>
                  <p className="text-slate-500 mt-1">{myServices.length === 0 ? 'Create a gig in the Studio to start receiving orders.' : 'Your gigs are live and visible in the Marketplace.'}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-700">
                  <p className="text-slate-400">⭐ Reviews received: <strong className="text-white">{profileReviews.length}</strong></p>
                  <p className="text-slate-500 mt-1">{profileReviews.length === 0 ? 'Complete orders to start receiving reviews from buyers.' : `Average rating from ${profileReviews.length} review${profileReviews.length !== 1 ? 's' : ''}.`}</p>
                </div>
                {currentUser.plan === 'free' && (['seller','hybrid','agency'].includes(currentUser.role)) && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/20">
                    <p className="text-amber-400 font-bold">💡 Upgrade to Pro to lower your fee from 5% to 4%</p>
                    <p className="text-slate-400 mt-1">Go to Settings → Subscription to upgrade your plan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (() => {
          const saved = services.filter(s => savedServiceIds.includes(s.id));
          return saved.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-300">No Saved Gigs Yet</h3>
              <p className="text-xs text-slate-500">Browse the Marketplace and tap the bookmark icon to save gigs you love.</p>
              <button onClick={() => setTab('services')} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all">{t('svc.browse')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {saved.map(service => (
                <div key={service.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden group hover:border-cyan-500/40 transition-all hover:-translate-y-0.5 shadow-lg">
                  <div className="relative h-40 overflow-hidden">
                    <img src={service.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button
                      onClick={() => toggleSavedService(service.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-slate-950/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-rose-400" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{service.category}</span>
                      <h4 className="font-bold text-sm text-white line-clamp-2 mt-0.5">{service.title}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">From</span>
                        <span className="font-black text-base text-cyan-400">{formatCurrency(service.priceCents)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActiveGigDetailId(service.id); setTab('gigDetail' as any); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                        >View</button>
                        <button
                          onClick={() => setSelectedServiceForCheckout(service)}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
                        >Order</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Verified Skill Badges */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-white flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> Verified Skills</h3>
                <span className="text-xs text-slate-400">Verified via SkillTok Skill Tests</span>
              </div>
              {currentUser.skills && currentUser.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentUser.skills.map((skill: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-cyan-500/5 border-cyan-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">⚡</span>
                        <div>
                          <span className="font-bold text-sm text-white">{skill}</span>
                          <div className="mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Added</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSkillTestModal({ open: true, skill })} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-lg transition-all hover:bg-cyan-500/10">
                        Take Test
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">No skills added yet</p>
                  <p className="text-xs text-slate-500 mt-1">Add skills in Settings → Profile to showcase your expertise</p>
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-black text-sm text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Certifications & Education</h3>
              {currentUser.certifications && currentUser.certifications.length > 0 ? (
                <div className="space-y-3">
                  {currentUser.certifications.map((cert: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                      <span className="text-2xl flex-shrink-0">🎓</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{cert.name}</div>
                        <div className="text-xs text-slate-400">{cert.issuer} · {cert.year}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">Verified</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">No certifications added yet</p>
                  <p className="text-xs text-slate-500 mt-1">Add your certifications in Settings → Profile</p>
                </div>
              )}
              <button className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all mt-3">
                + Add Certification
              </button>
            </div>

            {/* Skill Certificates */}
            {(currentUser.skillCertificates || []).length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> SkillTok Certificates</h3>
                <div className="space-y-2">
                  {(currentUser.skillCertificates || []).map(cert => (
                    <div key={cert.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 rounded-xl">
                      <Award className="w-7 h-7 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-white truncate">{cert.skill}</p>
                        <p className="text-[10px] text-slate-400">Score: {cert.score}/100 · {new Date(cert.issuedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[9px] font-black px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex-shrink-0">VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Test CTA */}
            {['seller','hybrid','agency','admin'].includes(currentUser.role) && (
              <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-white">Take a Skill Test</h3>
                  <p className="text-xs text-slate-400 mt-1">AI gives you a vigorous 10-question test. Score ≥70% to earn a <strong className="text-cyan-400">SkillTok Verified Certificate</strong> on your profile.</p>
                </div>
                <button
                  onClick={() => setSkillTestModal({ open: true })}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-black text-xs rounded-xl flex-shrink-0 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                >
                  Start Test →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'referral' && <ReferralHub />}

      </div>

      {skillTestModal.open && (
        <SkillTestModal
          skill={skillTestModal.skill}
          onClose={() => setSkillTestModal({ open: false })}
        />
      )}
    </div>
  );
};
