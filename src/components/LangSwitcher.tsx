import { useLang } from "@/contexts/LangContext";
import { Button } from "@/components/ui/button";

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5 text-xs">
      <Button
        type="button"
        size="sm"
        variant={lang === "mn" ? "default" : "ghost"}
        className="h-7 px-2.5 text-xs"
        onClick={() => setLang("mn")}
      >
        MN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={lang === "ja" ? "default" : "ghost"}
        className="h-7 px-2.5 text-xs"
        onClick={() => setLang("ja")}
      >
        日本
      </Button>
    </div>
  );
}
