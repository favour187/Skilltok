import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Briefcase, GraduationCap, FileText, Link2, Sparkles, X, ArrowRight, Upload, Plus, Trash2 } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  company: string;
  years: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export const ProfileBuilderModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, updateUserProfile } = useAppStore();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [aiMatchPercent, setAiMatchPercent] = useState(0);

  if (!open) return null;

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, { id: 'e-' + Date.now(), title: '', company: '', years: '' }]);
  };

  const updateExp = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeExp = (id: string) => setExperiences(experiences.filter(e => e.id !== id));

  const addEdu = () => {
    setEducation([...education, { id: 'd-' + Date.now(), school: '', degree: '', year: '' }]);
  };

  const updateEdu = (id: string, field: keyof Education, value: string) => {
    setEducation(education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEdu = (id: string) => setEducation(education.filter(e => e.id !== id));

  const addLink = () => {
    if (linkInput.trim()) {
      setPortfolioLinks([...portfolioLinks, linkInput.trim()]);
      setLinkInput('');
    }
  };

  const runAIMatch = () => {
    // Simulate Mercor-style AI scan that calculates a profile match score
    let score = 0;
    if (bio.length > 50) score += 20;
    if (skills.length >= 3) score += 25;
    if (resumeName) score += 20;
    if (experiences.length > 0) score += 15;
    if (education.length > 0) score += 10;
    if (portfolioLinks.length > 0) score += 10;
    setAiMatchPercent(Math.min(100, score));
  };

  const handleSave = () => {
    updateUserProfile({
      bio,
      skills
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Build Your SkillTok Profile</h2>
              <p className="text-[11px] text-slate-400">Mercor-style profile · Apply once, get matched to many opportunities</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4 flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full transition-all ${step >= n ? 'bg-cyan-400' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="p-6 space-y-5">

          {step === 1 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">About You & Resume</h3>
                </div>
                <textarea
                  rows={4}
                  placeholder="Brief professional bio... e.g. Senior UI Designer with 5 years experience helping startups ship beautiful products."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Upload Resume (PDF / DOCX)</label>
                <div className="p-5 border-2 border-dashed border-cyan-500/40 bg-slate-950 rounded-2xl text-center hover:border-cyan-500/70 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setResumeName(file.name);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">{resumeName || 'Click to upload your resume'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, or DOCX — Max 10MB</p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Your Skills (Add at least 3)</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill or pick suggestions below..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button onClick={addSkill} className="px-4 py-2.5 bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-xl">
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-300 flex items-center gap-2 font-semibold">
                    {s}
                    <button onClick={() => setSkills(skills.filter(sk => sk !== s))} className="text-rose-400 hover:text-rose-300">×</button>
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">💡 Popular skill suggestions — tap to add</span>
                <div className="space-y-3">
                  {[
                    { cat: '💻 Development', items: ['React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django', 'Flask', 'TypeScript', 'JavaScript', 'PHP', 'Laravel', 'Ruby on Rails', 'Java', 'Kotlin', 'Swift', 'Flutter', 'React Native', 'Solidity', 'Rust', 'Go', 'C++', 'C#', '.NET', 'WordPress', 'Shopify'] },
                    { cat: '🎨 Design', items: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects', 'Sketch', 'UI Design', 'UX Research', 'Logo Design', 'Branding', 'Web Design', '3D Modeling', 'Blender', 'Cinema 4D', 'Motion Graphics'] },
                    { cat: '🎬 Video & Audio', items: ['Video Editing', 'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Sound Design', 'Music Production', 'Voiceover', 'Podcast Editing', 'Color Grading', 'VFX', 'Animation', 'TikTok Editing'] },
                    { cat: '✍️ Writing & Marketing', items: ['Copywriting', 'SEO', 'Content Strategy', 'Email Marketing', 'Social Media', 'Google Ads', 'Facebook Ads', 'Blog Writing', 'Technical Writing', 'Translation', 'Ghostwriting'] },
                    { cat: '💼 Business', items: ['Project Management', 'Financial Analysis', 'Accounting', 'Bookkeeping', 'Business Plans', 'Legal Consulting', 'HR', 'Recruiting', 'Sales', 'Customer Support'] },
                    { cat: '🤖 AI & Data', items: ['Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'SQL', 'PostgreSQL', 'MongoDB', 'Power BI', 'Tableau', 'Prompt Engineering', 'ChatGPT API', 'LangChain', 'OpenAI'] },
                    { cat: '🔐 Other', items: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'Cybersecurity', 'Penetration Testing', 'Linux', 'iOS Development', 'Android Development', 'Game Development', 'Unity', 'Unreal Engine', 'Crypto', 'NFT', 'Web3'] }
                  ].map(group => (
                    <div key={group.cat}>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">{group.cat}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            disabled={skills.includes(skill)}
                            onClick={() => setSkills([...skills, skill])}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              skills.includes(skill)
                                ? 'bg-cyan-500/10 text-cyan-500/40 cursor-not-allowed line-through'
                                : 'bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700'
                            }`}
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white">Work Experience</h3>
                    </div>
                    <button onClick={addExperience} className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  {experiences.map(exp => (
                    <div key={exp.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2 space-y-2">
                      <div className="flex gap-2">
                        <input placeholder="Job title" value={exp.title} onChange={(e) => updateExp(exp.id, 'title', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                        <button onClick={() => removeExp(exp.id)} className="text-rose-400 px-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <input placeholder="Company name" value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                      <input placeholder="Years (e.g. 2020 - Present)" value={exp.years} onChange={(e) => updateExp(exp.id, 'years', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white">Education</h3>
                    </div>
                    <button onClick={addEdu} className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  {education.map(edu => (
                    <div key={edu.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2 space-y-2">
                      <div className="flex gap-2">
                        <input placeholder="School / University" value={edu.school} onChange={(e) => updateEdu(edu.id, 'school', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                        <button onClick={() => removeEdu(edu.id)} className="text-rose-400 px-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <input placeholder="Degree / Field" value={edu.degree} onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                      <input placeholder="Year (e.g. 2018-2022)" value={edu.year} onChange={(e) => updateEdu(edu.id, 'year', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white">Portfolio / Project Links</h3>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input placeholder="https://github.com/yourname" value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
                    <button onClick={addLink} className="px-3 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl">Add</button>
                  </div>
                  <div className="space-y-1">
                    {portfolioLinks.map(link => (
                      <div key={link} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-mono text-cyan-400 truncate">{link}</span>
                        <button onClick={() => setPortfolioLinks(portfolioLinks.filter(l => l !== link))} className="text-rose-400">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto" />
              <h3 className="font-extrabold text-lg text-white">AI Profile Analysis</h3>
              <p className="text-xs text-slate-400">SkillTok's AI matches your skills to live opportunities in real-time</p>
              
              {aiMatchPercent === 0 ? (
                <button onClick={runAIMatch}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xl shadow-cyan-500/20">
                  ✨ Run AI Match Analysis
                </button>
              ) : (
                <div className="p-6 bg-gradient-to-br from-cyan-900/30 via-slate-900 to-indigo-900/30 rounded-2xl border border-cyan-500/30">
                  <div className="text-5xl font-black text-cyan-400 mb-2">{aiMatchPercent}%</div>
                  <p className="text-xs text-slate-300 font-semibold">Profile Strength Score</p>
                  <div className="mt-4 space-y-1 text-[11px] text-slate-300 text-left">
                    {bio.length > 50 ? '✅ Strong bio' : '⚠ Add more bio detail (+20%)'}<br/>
                    {skills.length >= 3 ? '✅ Skills well listed' : '⚠ Add at least 3 skills (+25%)'}<br/>
                    {resumeName ? '✅ Resume uploaded' : '⚠ Upload resume (+20%)'}<br/>
                    {experiences.length > 0 ? '✅ Experience added' : '⚠ Add work experience (+15%)'}<br/>
                    {portfolioLinks.length > 0 ? '✅ Portfolio linked' : '⚠ Add portfolio links (+10%)'}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex items-center justify-between gap-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl">
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          <span className="text-xs text-slate-500">Step {step} of 4</span>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1">
              Next <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/20">
              ✓ Save Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
