/**
 * SkillTestModal — AI-powered vigorous skill assessment.
 * Available only to: seller, hybrid, agency, admin roles.
 * Uses Grok (xAI) API to generate and grade 10-question tests.
 * Awards a SkillTok Verified Certificate on pass (≥70%).
 */
import React, { useState, useRef } from 'react';
import {
  X, BrainCircuit, ChevronRight, Loader2, CheckCircle2,
  XCircle, Award, Trophy, Lock, RotateCcw, ShieldCheck,
  FileText, Star
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SkillCertificate } from '../types';

const SKILL_CATEGORIES = [
  { category: 'Web Development', skills: ['React.js', 'Node.js', 'TypeScript', 'Next.js', 'Vue.js', 'GraphQL', 'REST API Design', 'PHP & Laravel'] },
  { category: 'Mobile Development', skills: ['React Native', 'Flutter', 'Swift / iOS', 'Kotlin / Android'] },
  { category: 'UI/UX Design', skills: ['Figma', 'User Research', 'Wireframing & Prototyping', 'Design Systems'] },
  { category: 'Data & AI', skills: ['Python for Data Science', 'Machine Learning', 'SQL & Database Design', 'Data Visualization'] },
  { category: 'DevOps & Cloud', skills: ['AWS', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Linux / Shell Scripting'] },
  { category: 'Digital Marketing', skills: ['SEO & SEM', 'Social Media Marketing', 'Email Marketing', 'Content Strategy'] },
  { category: 'Video & Animation', skills: ['Adobe Premiere Pro', 'After Effects', 'Motion Graphics', '3D Animation (Blender)'] },
  { category: 'Copywriting', skills: ['Sales Copywriting', 'Technical Writing', 'Content Writing', 'Ghostwriting'] },
];

interface Question {
  number: number;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'code';
  options?: string[];  // for multiple choice
}

interface Answer {
  questionNumber: number;
  answer: string;
}

interface GradeResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  feedback: string;
  breakdown: { qNum: number; correct: boolean; explanation: string }[];
}

type Phase = 'select' | 'loading_test' | 'testing' | 'submitting' | 'result';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL || '';

async function generateTest(skill: string): Promise<any> {
  const token = localStorage.getItem('skilltok_access_token');
  const res = await fetch(`${BACKEND}/api/ai/skill-test/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ skill }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
    throw new Error(err.error || 'Failed to generate test');
  }
  return res.json();
}

async function callGradeAPI(skill: string, questions: any[], answers: any[]): Promise<any> {
  const token = localStorage.getItem('skilltok_access_token');
  const res = await fetch(`${BACKEND}/api/ai/skill-test/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ skill, questions, answers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
    throw new Error(err.error || 'Failed to grade test');
  }
  return res.json();
}

export const SkillTestModal: React.FC<{ skill?: string; onClose: () => void }> = ({ skill: initialSkill, onClose }) => {
  const { user, awardSkillCertificate } = useAppStore();
  const [phase, setPhase] = useState<Phase>(initialSkill ? 'loading_test' : 'select');
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill || '');
  const [customSkill, setCustomSkill] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  // Roles that can access skill tests
  const canTakeTest = user && ['seller', 'hybrid', 'agency', 'admin'].includes(user.role);

  if (!canTakeTest) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="font-black text-xl text-white">Sellers Only</h2>
          <p className="text-sm text-slate-400">Skill Tests and certificates are available for <strong className="text-white">Seller, Hybrid, and Agency</strong> accounts. Upgrade your account type to unlock this feature.</p>
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black rounded-xl">Got it</button>
        </div>
      </div>
    );
  }

  const startTest = async (skill: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setSelectedSkill(skill);
    setPhase('loading_test');
    setError('');
    try {
      const parsed = await generateTest(skill);
      setQuestions(parsed.questions || []);
      setCurrentQ(0);
      setAnswers([]);
      setCurrentAnswer('');
      setPhase('testing');
    } catch (e: any) {
      setError('Failed to generate test. Check your API connection and try again.');
      setPhase('select');
    } finally {
      loadingRef.current = false;
    }
  };

  // Auto-start if skill was passed in
  React.useEffect(() => {
    if (initialSkill && phase === 'loading_test') {
      startTest(initialSkill);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, { questionNumber: questions[currentQ].number, answer: currentAnswer }];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      gradeTest(newAnswers);
    }
  };

  const gradeTest = async (finalAnswers: Answer[]) => {
    setPhase('submitting');
    try {
      const grade: GradeResult = await callGradeAPI(selectedSkill, questions, finalAnswers);
      setResult(grade);

      // Issue certificate if passed
      if (grade.passed && user) {
        const cert: SkillCertificate = {
          id: 'cert-' + Date.now(),
          skill: selectedSkill,
          score: grade.score,
          totalQuestions: grade.totalQuestions,
          passed: true,
          issuedAt: new Date().toISOString(),
        };
        awardSkillCertificate(cert);
      }

      setPhase('result');
    } catch (e) {
      setError('Failed to grade test. Try submitting again.');
      setPhase('testing');
    }
  };

  const q = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">SkillTok Skill Test</h2>
              {selectedSkill && <p className="text-xs text-indigo-400 font-semibold">{selectedSkill}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* PHASE: Select Skill */}
          {phase === 'select' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 pt-2">
                <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="font-black text-xl text-white">Choose Your Skill</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Our AI will generate a <strong className="text-white">10-question vigorous test</strong>. Score ≥70% to earn your <strong className="text-cyan-400">SkillTok Verified Certificate</strong>.</p>
                <div className="flex items-center gap-2 justify-center flex-wrap pt-1">
                  {['10 Questions', 'AI-Graded', 'Certificate Issued', 'Profile Badge'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">{tag}</span>
                  ))}
                </div>
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">{error}</div>}

              {/* Custom skill input */}
              <div className="flex gap-2">
                <input
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && customSkill.trim() && startTest(customSkill.trim())}
                  placeholder="Type any skill (e.g. Solidity, Unity, etc.)..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => customSkill.trim() && startTest(customSkill.trim())}
                  disabled={!customSkill.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Start
                </button>
              </div>

              {/* Category grid */}
              {SKILL_CATEGORIES.map(cat => (
                <div key={cat.category} className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{cat.category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.skills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => startTest(skill)}
                        className="text-left px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white">{skill}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ChevronRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[9px] text-slate-500 group-hover:text-indigo-400 transition-colors">Take Test →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PHASE: Generating test */}
          {phase === 'loading_test' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-white text-base">Generating your test…</p>
                <p className="text-xs text-slate-400">AI is crafting 10 vigorous questions for <strong className="text-indigo-400">{selectedSkill}</strong></p>
              </div>
            </div>
          )}

          {/* PHASE: Testing */}
          {phase === 'testing' && q && (
            <div className="space-y-5">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}% done</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Question type badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  q.type === 'multiple_choice' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                  q.type === 'code' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-purple-500/10 border-purple-500/30 text-purple-400'
                }`}>
                  {q.type === 'multiple_choice' ? '📋 Multiple Choice' : q.type === 'code' ? '💻 Code / Practical' : '✍️ Short Answer'}
                </span>
              </div>

              {/* Question text */}
              <div className="p-5 bg-slate-800/60 border border-slate-700 rounded-2xl">
                <p className="text-sm text-white font-semibold leading-relaxed">{q.text}</p>
              </div>

              {/* Answer area */}
              {q.type === 'multiple_choice' && q.options ? (
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentAnswer(opt)}
                      className={`text-left p-4 rounded-xl border text-sm transition-all ${
                        currentAnswer === opt
                          ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder={q.type === 'code'
                    ? 'Write your code or explain your implementation approach...'
                    : 'Type your answer here. Be specific and precise...'}
                  rows={q.type === 'code' ? 7 : 4}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none resize-none font-mono"
                />
              )}

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">{error}</div>}

              <button
                onClick={submitAnswer}
                disabled={!currentAnswer.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {currentQ < questions.length - 1 ? (
                  <><ChevronRight className="w-4 h-4" /> Next Question</>
                ) : (
                  <><FileText className="w-4 h-4" /> Submit Test</>
                )}
              </button>
            </div>
          )}

          {/* PHASE: Submitting / Grading */}
          {phase === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-white text-base">Grading your answers…</p>
                <p className="text-xs text-slate-400">AI is evaluating your responses rigorously</p>
              </div>
            </div>
          )}

          {/* PHASE: Result */}
          {phase === 'result' && result && (
            <div className="space-y-5">
              {/* Score card */}
              <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                result.passed
                  ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border-emerald-500/30'
                  : 'bg-gradient-to-br from-rose-900/40 to-red-900/30 border-rose-500/30'
              }`}>
                {result.passed ? (
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                ) : (
                  <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
                )}
                <div>
                  <p className="text-4xl font-black text-white">{result.score}<span className="text-2xl text-slate-400">/100</span></p>
                  <p className={`text-lg font-black mt-1 ${result.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.passed ? '✅ PASSED — Certificate Issued!' : '❌ FAILED — Score below 70%'}
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.feedback}</p>
              </div>

              {/* Certificate (if passed) */}
              {result.passed && (
                <div className="p-5 bg-gradient-to-br from-indigo-900/50 via-purple-900/40 to-slate-900 border border-indigo-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="font-black text-white text-sm">SkillTok Verified Certificate</p>
                      <p className="text-[10px] text-indigo-300">Issued to {user?.name}</p>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                  <div className="border-t border-indigo-500/20 pt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Skill</span>
                      <span className="font-bold text-white">{selectedSkill}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Score</span>
                      <span className="font-bold text-emerald-400">{result.score}/100</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Date</span>
                      <span className="font-bold text-white">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cert ID</span>
                      <span className="font-mono text-[10px] text-slate-400">SKT-{Date.now().toString(36).toUpperCase()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-300 text-center">✨ Certificate saved to your profile Skills tab</p>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-white flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Question Breakdown</h4>
                {result.breakdown.map(b => (
                  <div key={b.qNum} className={`p-3 rounded-xl border text-xs space-y-1 ${b.correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {b.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                      <span className="font-bold text-white">Question {b.qNum}</span>
                      <span className={`ml-auto font-bold ${b.correct ? 'text-emerald-400' : 'text-rose-400'}`}>{b.correct ? 'Correct' : 'Incorrect'}</span>
                    </div>
                    <p className="text-slate-400 pl-6 leading-relaxed">{b.explanation}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pb-2">
                {!result.passed && (
                  <button
                    onClick={() => startTest(selectedSkill)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> Retry Test
                  </button>
                )}
                <button
                  onClick={result.passed ? onClose : () => setPhase('select')}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {result.passed ? <><Award className="w-4 h-4" /> View Certificate</> : <><BrainCircuit className="w-4 h-4" /> Try Different Skill</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
