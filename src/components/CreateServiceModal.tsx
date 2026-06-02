import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Sparkles, Clock, Tag } from 'lucide-react';

export const CreateServiceModal: React.FC = () => {
  const { isCreateServiceModalOpen, setCreateServiceModalOpen, createService } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [priceDollars, setPriceDollars] = useState('150');
  const [deliveryDays, setDeliveryDays] = useState('3');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80');
  const [featuresInput, setFeaturesInput] = useState('High Quality Code, Fast Delivery, 3 Revisions');
  const [tagsInput, setTagsInput] = useState('react, webdev, frontend');

  if (!isCreateServiceModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceDollars) return;

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const features = featuresInput.split(',').map(f => f.trim()).filter(Boolean);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    createService({
      title,
      description,
      category,
      priceCents: isNaN(priceCents) ? 5000 : priceCents,
      deliveryDays: parseInt(deliveryDays, 10) || 3,
      image: image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      tags,
      features
    });
  };

  const categories = [
    'Web Development',
    'Video & Animation',
    'UI/UX Design',
    'Audio & Music',
    'AI Coaching & Consultation'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-6 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white">Create Freelance Service Gig</h2>
              <p className="text-xs text-slate-400">List your professional service for SkillTok buyers</p>
            </div>
          </div>
          <button 
            onClick={() => setCreateServiceModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Gig Title</label>
            <input
              type="text"
              required
              placeholder="e.g. I will build a custom React & Tailwind landing page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price (USD $)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold text-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Time (Days)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400"><Clock className="w-3.5 h-3.5" /></span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preview Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={4}
              required
              placeholder="Describe what is included in your gig, your expertise, and why buyers should choose you..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Included Features (comma separated)</label>
            <input
              type="text"
              placeholder="Source code, Responsive design, 3 Revisions"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Search Tags (comma separated)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400"><Tag className="w-3.5 h-3.5" /></span>
              <input
                type="text"
                placeholder="react, tailwind, uiux"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCreateServiceModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-extrabold transition-all shadow-xl shadow-cyan-500/20 active:scale-98"
            >
              Publish Service Gig 🚀
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
