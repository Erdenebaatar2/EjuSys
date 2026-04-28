import type { Lang } from "@/lib/i18n";

export function formatDate(dateStr: string, lang: Lang = "mn"): string {
  const d = new Date(dateStr);
  if (lang === "ja") {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isRegistrationOpen(start: string, end: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(start) <= today && new Date(end) >= today;
}

export function statusLabel(status: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; ja: string }> = {
    pending: { mn: "Хүлээгдэж буй", ja: "審査中" },
    approved: { mn: "Зөвшөөрсөн", ja: "承認済み" },
    rejected: { mn: "Татгалзсан", ja: "却下" },
    paid: { mn: "Төлсөн", ja: "支払済" },
    unpaid: { mn: "Төлөөгүй", ja: "未払い" },
  };
  return map[status]?.[lang] ?? status;
}

export function sessionLabel(s: string, lang: Lang = "mn"): string {
  if (s === "first") return lang === "mn" ? "1-р улирал" : "第1回";
  if (s === "second") return lang === "mn" ? "2-р улирал" : "第2回";
  return s;
}

export function categoryLabel(cat: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; ja: string }> = {
    japanese: { mn: "Япон хэл", ja: "日本語" },
    math: { mn: "Математик", ja: "数学" },
    science: { mn: "Шинжлэх ухаан", ja: "理科" },
    general: { mn: "Ерөнхий хичээл", ja: "総合科目" },
  };
  return map[cat]?.[lang] ?? cat;
}
