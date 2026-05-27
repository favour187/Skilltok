import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../utils/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { Heart, MessageCircle, Share2, Bookmark, ShieldAlert, Volume2, VolumeX, Play, ChevronUp, ChevronDown, CheckCircle2, ShoppingBag, ArrowRight, UserPlus, Check } from 'lucide-react';

export const FeedScreen: React.FC = () => {
  const { 
    videos, 
    services, 
    toggleLikeVideo, 
    toggleSaveVideo, 
    setActiveVideoForComments,
    setRequirementsModalService,
    openReportModal,
    searchQuery,
    selectedCategory,
    setSelectedCategory
  } = useAppStore();

  const { t } = useTranslation();

  // Persist scroll position across page refreshes
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = sessionStorage.getItem('feed_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPlaying, setIsPlaying] = useState(true);
  // Start unmuted; browser autoplay policy requires muted for the first play() call,
  // but we immediately switch to unmuted once autoplay succeeds.
  const [isMuted, setIsMuted] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});
  const [showShareToast, setShowShareToast] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef<number | null>(null);
  const isTransitioning = useRef<boolean>(false);

  // Filter videos by search query and category
  const filteredVideos = videos.filter(vid => {
    const matchesSearch = searchQuery === '' || 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || vid.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const currentVid = filteredVideos[currentIndex];

  useEffect(() => {
    // Reset index if filtered list is shorter
    if (currentIndex >= filteredVideos.length) {
      setCurrentIndex(0);
    }
  }, [filteredVideos.length, currentIndex]);

  useEffect(() => {
    // Browsers block unmuted autoplay — ensure muted before calling play()
    videoRefs.current.forEach((el, idx) => {
      if (el) {
        if (idx === currentIndex) {
          el.muted = true; // Must be muted for initial autoplay call (browser policy)
          el.play().then(() => {
            setIsPlaying(true);
            // Unmute immediately after play succeeds — user wants sound by default
            el.muted = isMuted;
          }).catch(() => {
            // Autoplay blocked entirely — stay muted and show hint
            el.muted = true;
            setIsMuted(true);
            setShowUnmuteHint(true);
            setIsPlaying(false);
          });
        } else {
          el.pause();
        }
      }
    });
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < filteredVideos.length - 1) {
      const next = currentIndex + 1;
      sessionStorage.setItem('feed_index', String(next));
      setCurrentIndex(next);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      sessionStorage.setItem('feed_index', String(prev));
      setCurrentIndex(prev);
    }
  };

  // TikTok-style mouse wheel and swipe vertical scrolling!
  const handleWheel = (e: React.WheelEvent) => {
    if (isTransitioning.current) return;
    if (Math.abs(e.deltaY) > 30) {
      isTransitioning.current = true;
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTimeout(() => {
        isTransitioning.current = false;
      }, 600);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || isTransitioning.current) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(deltaY) > 50) { // Swiped up or down
      isTransitioning.current = true;
      if (deltaY > 0) {
        handleNext(); // swiped up -> next video
      } else {
        handlePrev(); // swiped down -> prev video
      }
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
    touchStartY.current = null;
  };

  const toggleFollow = (creatorId: string) => {
    setFollowedCreators(prev => ({ ...prev, [creatorId]: !prev[creatorId] }));
  };

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const categoryKeys: Record<string, string> = {
    'All': t('cat.all'),
    'Web Development': t('cat.webdev'),
    'Video & Animation': t('cat.video'),
    'UI/UX Design': t('cat.design'),
    'Audio & Music': t('cat.audio'),
  };
  const categories = ['All', 'Web Development', 'Video & Animation', 'UI/UX Design', 'Audio & Music'];

  if (filteredVideos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-white min-h-[70vh]">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">{t('feed.noVideos')}</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">{t('feed.noVideosHint')}</p>
        <button
          onClick={() => { setSelectedCategory('All'); sessionStorage.setItem('feed_index', '0'); setCurrentIndex(0); }}
          className="mt-6 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  // Linked service
  const linkedService = currentVid?.linkedServiceId 
    ? services.find(s => s.id === currentVid.linkedServiceId)
    : null;

  return (
    <div className="flex-1 flex flex-col items-center bg-slate-950 text-white relative min-h-[calc(100vh-70px)] pb-16 lg:pb-0">
      
      {/* Top Filter Category Pills */}
      <div className="w-full max-w-xl px-4 py-3 absolute top-0 left-0 right-0 z-10 mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar backdrop-blur-md bg-gradient-to-b from-slate-950/80 to-transparent">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); sessionStorage.setItem('feed_index', '0'); setCurrentIndex(0); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/20' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
            }`}
          >
            {categoryKeys[cat] || cat}
          </button>
        ))}
      </div>

      {/* Main TikTok Video Container with Wheel / Touch Swipe support */}
      <div 
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-lg h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] bg-slate-900 overflow-hidden flex items-center justify-center group shadow-2xl shadow-cyan-500/5 select-none transition-all duration-300"
      >
        
        {/* Video Player */}
        <video
          ref={(el) => { videoRefs.current[currentIndex] = el; }}
          src={currentVid.videoUrl}
          poster={currentVid.thumbnailUrl}
          loop
          muted={isMuted}
          playsInline
          onClick={() => {
            const vidEl = videoRefs.current[currentIndex];
            if (vidEl) {
              if (isPlaying) {
                vidEl.pause();
                setIsPlaying(false);
              } else {
                vidEl.play();
                setIsPlaying(true);
              }
            }
          }}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Tap-to-unmute hint (shown until user taps the mute button) */}
        {showUnmuteHint && isMuted && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer z-20 animate-pulse"
            onClick={() => { setIsMuted(false); setShowUnmuteHint(false); }}
          >
            🔇 Tap to unmute
          </div>
        )}

        {/* Play/Pause Overlay animation */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[1px]">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white p-6 shadow-2xl">
              <Play className="w-10 h-10 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Volume Controls */}
        <button
          onClick={() => { setIsMuted(!isMuted); setShowUnmuteHint(false); }}
          className="absolute top-16 right-4 z-20 p-3 bg-slate-900/60 hover:bg-slate-900/90 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>

        {/* Video Nav Chevrons (Up/Down) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-all disabled:opacity-30 shadow-xl border border-slate-700"
            title="Previous Video"
          >
            <ChevronUp className="w-6 h-6 text-cyan-400" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === filteredVideos.length - 1}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-all disabled:opacity-30 shadow-xl border border-slate-700"
            title="Next Video"
          >
            <ChevronDown className="w-6 h-6 text-cyan-400" />
          </button>
        </div>

        {/* Share toast */}
        {showShareToast && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl animate-bounce z-50 flex items-center gap-1.5">
            <Share2 className="w-4 h-4" /> Link copied to clipboard!
          </div>
        )}

        {/* Floating Action Column (Right Side) */}
        <div className="absolute right-3 bottom-28 sm:bottom-20 z-20 flex flex-col items-center gap-5">
          
          {/* Creator Avatar with follow badge */}
          <div className="relative group/avatar cursor-pointer">
            <img 
              src={currentVid.creatorAvatar} 
              alt={currentVid.creatorName} 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xl bg-slate-800"
            />
            <button
              onClick={() => toggleFollow(currentVid.creatorId)}
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg border border-slate-950 ${
                followedCreators[currentVid.creatorId]
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-500 text-white hover:scale-110'
              }`}
            >
              {followedCreators[currentVid.creatorId] ? <Check className="w-3.5 h-3.5 font-bold" /> : <UserPlus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Like Button */}
          <button
            onClick={() => toggleLikeVideo(currentVid.id)}
            className="flex flex-col items-center gap-1 group/btn transition-transform active:scale-90 mt-2"
          >
            <div className={`p-3 rounded-full bg-slate-900/60 backdrop-blur-md transition-colors ${
              currentVid.isLikedByMe ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40' : 'text-white hover:bg-slate-800/80'
            }`}>
              <Heart className={`w-6 h-6 ${currentVid.isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentVid.likes}</span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setActiveVideoForComments(currentVid)}
            className="flex flex-col items-center gap-1 group/btn transition-transform active:scale-90"
          >
            <div className="p-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800/80 transition-colors">
              <MessageCircle className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentVid.commentsCount}</span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => toggleSaveVideo(currentVid.id)}
            className="flex flex-col items-center gap-1 group/btn transition-transform active:scale-90"
          >
            <div className={`p-3 rounded-full bg-slate-900/60 backdrop-blur-md transition-colors ${
              currentVid.isSavedByMe ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-white hover:bg-slate-800/80'
            }`}>
              <Bookmark className={`w-6 h-6 ${currentVid.isSavedByMe ? 'fill-amber-400 text-amber-400' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentVid.isSavedByMe ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group/btn transition-transform active:scale-90"
          >
            <div className="p-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800/80 transition-colors">
              <Share2 className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentVid.shares}</span>
          </button>

          {/* Report Violation */}
          <button
            onClick={() => openReportModal('video', currentVid.id, currentVid.title)}
            className="p-2 rounded-full bg-slate-900/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors mt-2"
            title="Report Video"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

        </div>

        {/* Video Info Overlay (Bottom Left) */}
        <div className="absolute bottom-16 sm:bottom-6 left-4 right-20 z-20 flex flex-col gap-2 pointer-events-auto">
          
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-white drop-shadow-lg tracking-tight">@{currentVid.creatorUsername}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full text-slate-300 font-semibold border border-slate-700">
              {currentVid.category}
            </span>
          </div>

          <h1 className="font-bold text-sm text-slate-100 drop-shadow-md line-clamp-2">
            {currentVid.title}
          </h1>

          <p className="text-xs text-slate-200 drop-shadow line-clamp-2 font-light">
            {currentVid.description}
          </p>

          {/* LINKED SERVICE BANNER - DIRECT FIVERR GIG CHECKOUT */}
          {linkedService && (
            <div 
              onClick={() => {
                // Pause the video before opening the purchase flow so it doesn't
                // continue playing silently behind the modal — and so the user's
                // place is preserved when they come back to the feed.
                const vidEl = videoRefs.current[currentIndex];
                if (vidEl) { vidEl.pause(); setIsPlaying(false); }
                setRequirementsModalService(linkedService);
              }}
              className="mt-2 p-3 bg-gradient-to-r from-cyan-500/90 via-teal-500/90 to-indigo-600/90 hover:from-cyan-400 hover:to-indigo-500 rounded-2xl cursor-pointer shadow-xl shadow-cyan-500/20 backdrop-blur-md border border-white/20 transition-all transform active:scale-98 group/service animate-pulse-glow flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-950/80 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <ShoppingBag className="w-5 h-5 group-hover/service:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-cyan-200">
                  <span>Attached Freelance Gig</span>
                  <span className="bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded text-[9px]">Verified</span>
                </div>
                <p className="text-xs font-bold text-white truncate">{linkedService.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-100 font-semibold mt-0.5">
                  <span className="bg-slate-950/40 px-2 py-0.5 rounded text-cyan-300 font-extrabold">{formatCurrency(linkedService.priceCents)}</span>
                  <span>⚡ {linkedService.deliveryDays} Days Delivery</span>
                </div>
              </div>
              <div className="bg-white text-slate-950 p-2 rounded-xl flex items-center justify-center font-bold text-xs shadow-md">
                <ArrowRight className="w-4 h-4 group-hover/service:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

        </div>

        {/* Mobile Swipe hints */}
        <div className="absolute bottom-2 left-0 right-0 text-center sm:hidden text-[11px] text-slate-400 bg-gradient-to-t from-slate-950 py-1.5 flex items-center justify-center gap-4">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="hover:text-white disabled:opacity-20 flex items-center gap-1 font-bold">
            <ChevronUp className="w-4 h-4 text-cyan-400" /> Swipe Up
          </button>
          <span className="font-mono text-cyan-300 font-bold">{currentIndex + 1} / {filteredVideos.length}</span>
          <button onClick={handleNext} disabled={currentIndex === filteredVideos.length - 1} className="hover:text-white disabled:opacity-20 flex items-center gap-1 font-bold">
            Swipe Down <ChevronDown className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

      </div>

    </div>
  );
};
