import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang, TranslationKey } from "@/lib/i18n";
import { t as translate } from "@/lib/i18n";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mn");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("eju-lang") : null;
    if (saved === "mn" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("eju-lang", l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: (k) => translate(k, lang) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
