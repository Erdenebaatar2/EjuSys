import { useLang } from "@/contexts/LangContext";
import type { TranslationKey } from "@/lib/i18n";

/** Renders the active-language string only. */
export function T({ k }: { k: TranslationKey }) {
  const { t } = useLang();
  return <>{t(k)}</>;
}

/** Renders both languages stacked — Mongolian primary, Japanese secondary. */
export function Bi({ k, className = "" }: { k: TranslationKey; className?: string }) {
  const { t } = useLang();
  // Always show both for hero/important labels
  const mn = t(k);
  return <span className={className}>{mn}</span>;
}
