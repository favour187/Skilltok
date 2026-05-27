import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Video, UploadCloud, CheckCircle2, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export const UploadScreen: React.FC = () => {
  const { uploadVideo, services, user } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [linkedServiceId, setLinkedServiceId] = useState<string>('none');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');



  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!title || !description) {
      setUploadError('Please provide both a title and description for your video.');
      return;
    }
    if (!videoFile && !videoUrl) {
      setUploadError('Please select a video file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = videoUrl;
      let finalThumbUrl = thumbnailUrl;

      // If a real file was selected, upload to backend → Cloudinary
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        if (linkedServiceId !== 'none') formData.append('linkedServiceId', linkedServiceId);

        const response = await api.post('/api/videos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setUploadProgress(percent);
            }
          },
          timeout: 600000 // 10 minutes for large videos
        });

        finalVideoUrl = response.data.video_url || response.data.videoUrl;
        finalThumbUrl = response.data.thumbnail_url || response.data.thumbnailUrl;
      }

      // Save to local state too
      uploadVideo({
        title,
        description,
        category,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbUrl,
        linkedServiceId: linkedServiceId === 'none' ? undefined : linkedServiceId
      });

      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setTitle(''); setDescription(''); setVideoFile(null); setVideoUrl(''); setThumbnailUrl('');
      }, 2000);

    } catch (err: any) {
      setIsUploading(false);
      const errMsg = err.response?.data?.error || err.message;
      setUploadError(`Upload failed: ${errMsg}. Make sure your backend is running and Cloudinary keys are configured in Railway.`);
    }
  };

  const categories = ['Web Development', 'Video & Animation', 'UI/UX Design', 'Audio & Music'];

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Creator Studio: Video Upload</h1>
              <p className="text-xs text-slate-400">Publish high-converting TikTok-style videos to showcase your skills</p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 hidden sm:inline-block">
            Algorithm Optimized
          </span>
        </div>

        {uploadSuccess ? (
          <div className="p-16 text-center bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white">Video Published Successfully! 🚀</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your video is now live on the SkillTok algorithm feed and linked directly to your freelance service.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form */}
            <form onSubmit={handleUpload} className="lg:col-span-2 space-y-5 bg-slate-900 p-6 rounded-3xl border border-slate-800">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">1. Upload Video File (MP4 / MOV)</label>
                
                {/* Real file upload - sent to Cloudinary via backend */}
                <div className={`mb-4 p-6 rounded-2xl border-2 border-dashed transition-all text-center group cursor-pointer relative ${
                  videoFile ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-cyan-500/40 bg-slate-950 hover:bg-slate-950/80'
                }`}>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (max 100MB)
                        if (file.size > 100 * 1024 * 1024) {
                          setUploadError('File too large. Maximum size is 100MB.');
                          return;
                        }
                        setUploadError('');
                        setVideoFile(file);
                        const previewUrl = URL.createObjectURL(file);
                        setVideoUrl(previewUrl);
                        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {videoFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-extrabold text-emerald-400">{videoFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB ready to upload</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setVideoFile(null); setVideoUrl(''); }} className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 underline">
                        Choose different file
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-extrabold text-white">Click to Upload Video File</p>
                      <p className="text-[10px] text-slate-400 mt-1">MP4, MOV, WebM • Max 100MB</p>
                      <p className="text-[10px] text-cyan-400 mt-1">Uploads to Cloudinary CDN via backend</p>
                    </>
                  )}
                </div>

                {/* Upload progress bar */}
                {isUploading && uploadProgress > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Uploading to Cloudinary...</span>
                      <span className="font-bold text-cyan-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold">
                    {uploadError}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Video Caption / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How I designed this viral mobile app in Figma in under 2 hours! ✨"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description / Hashtags</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain your process, give tips, and encourage viewers to check out your linked service below! #webdev #uiux #freelance"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Thumbnail URL</label>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* ATTACH FREELANCE SERVICE */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-800/80 rounded-2xl border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Attach Freelance Service Gig</span>
                </div>
                <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                  When viewers watch this video, they will see a prominent button linking directly to your freelance gig for instant checkout!
                </p>
                <select
                  value={linkedServiceId}
                  onChange={(e) => setLinkedServiceId(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="none">-- Do not link a service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} (${s.priceCents / 100})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <UploadCloud className="w-5 h-5 animate-bounce" />
                      <span>Transcoding Video & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Publish Video to Feed</span>
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Video Preview Card */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Mobile Preview</span>
              <div className="relative aspect-[9/16] bg-slate-900 rounded-3xl border-2 border-cyan-500/30 overflow-hidden shadow-2xl">
                {videoUrl ? (
                  <>
                    {/* Video plays in background */}
                    <video 
                      key={videoUrl}
                      src={videoUrl} 
                      poster={thumbnailUrl}
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      controls
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Overlay with metadata */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none">
                      <div className="space-y-2 text-white">
                        <div className="flex items-center gap-2">
                          <img src={user?.avatar || '/skilltok-logo.png'} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                          <span className="text-xs font-extrabold drop-shadow-lg">@{user?.username || 'you'}</span>
                        </div>
                        <h4 className="text-xs font-bold line-clamp-2 drop-shadow-md">{title || 'Video Title Will Appear Here ✨'}</h4>
                        <p className="text-[10px] text-slate-200 line-clamp-2 drop-shadow">{description || 'Description and hashtags #skilltok'}</p>
                        {linkedServiceId !== 'none' && (
                          <div className="p-2 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-[10px] font-bold text-slate-950 flex items-center justify-between mt-2 pointer-events-auto">
                            <span className="truncate text-white">🏷️ Attached Gig Active</span>
                            <span className="bg-white px-2 py-0.5 rounded text-black font-extrabold">Order ➔</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // Empty state when no video selected
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
                      <Video className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">No Video Selected</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                      Choose a video file from the upload area on the left to see how your TikTok-style preview will look.
                    </p>
                    <div className="mt-4 px-3 py-1.5 bg-slate-800 rounded-full text-[10px] text-slate-300 font-bold">
                      📱 9:16 Vertical Preview
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Make sure you have the rights to the uploaded video or audio. SkillTok enforces DMCA copyright protection.</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
