import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES, Language } from '../utils/i18n';
import { useTranslation } from '../utils/useTranslation';

export const LanguageSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useTranslation();

  const select = (l: Language) => {
    setLang(l);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors">
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span>{LANGUAGES[lang].flag}</span>
        <span className="hidden sm:inline">{LANGUAGES[lang].native}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Language</p>
            </div>
            {(Object.keys(LANGUAGES) as Language[]).map(code => (
              <button key={code} onClick={() => select(code)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-base">{LANGUAGES[code].flag}</span>
                  <div className="text-left">
                    <p className="font-bold text-white">{LANGUAGES[code].native}</p>
                    <p className="text-[10px] text-slate-400">{LANGUAGES[code].name}</p>
                  </div>
                </div>
                {lang === code && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
