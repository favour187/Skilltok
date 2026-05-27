/**
 * useTranslation hook — stores lang in Zustand so ANY component subscribed to the
 * store re-renders instantly when the language changes (not just those with listeners).
 */
import { useCallback } from 'react';
import { create } from 'zustand';
import { i18n, Language, LANGUAGES } from './i18n';

interface LangStore {
  lang: Language;
  setLang: (l: Language) => void;
}

/** Singleton Zustand store for the active language */
export const useLangStore = create<LangStore>((set) => ({
  lang: i18n.getCurrent(),
  setLang: (l) => {
    i18n.set(l);
    set({ lang: l });
  },
}));

// Keep the store in sync if i18n.set() is called elsewhere (legacy code)
if (typeof window !== 'undefined') {
  window.addEventListener('languagechange', () => {
    useLangStore.setState({ lang: i18n.getCurrent() });
  });
}

export function useTranslation() {
  const { lang, setLang } = useLangStore();

  const t = useCallback((key: string) => i18n.t(key), [lang]); // eslint-disable-line

  return { t, lang, setLang, languages: LANGUAGES };
}
