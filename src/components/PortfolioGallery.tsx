import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  images: string[];
  alt?: string;
}

export const PortfolioGallery: React.FC<Props> = ({ images, alt = 'Portfolio' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const prev = () => setActiveIndex(i => i === 0 ? images.length - 1 : i - 1);
  const next = () => setActiveIndex(i => i === images.length - 1 ? 0 : i + 1);

  return (
    <>
      <div className="space-y-3">
        {/* Main display */}
        <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group">
          <img 
            src={images[activeIndex]} 
            alt={alt}
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
          />
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/80 hover:bg-slate-950 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/80 hover:bg-slate-950 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-950/80 rounded-full text-xs text-white font-bold">
                {activeIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveIndex(i)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  activeIndex === i ? 'border-cyan-400 ring-1 ring-cyan-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-900 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          <img src={images[activeIndex]} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  );
};
