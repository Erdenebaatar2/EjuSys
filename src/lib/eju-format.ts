import type { Lang } from "@/lib/i18n";

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(dateStr: string, lang: Lang = "mn"): string {
  const d = new Date(dateStr);
  if (lang === "en") {
    return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isRegistrationOpen(start: string, end: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(start) <= today && new Date(end) >= today;
}

export function statusLabel(status: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; en: string }> = {
    pending: { mn: "Хүлээгдэж буй", en: "Pending" },
    approved: { mn: "Зөвшөөрсөн", en: "Approved" },
    rejected: { mn: "Татгалзсан", en: "Rejected" },
    paid: { mn: "Төлсөн", en: "Paid" },
    unpaid: { mn: "Төлөөгүй", en: "Unpaid" },
  };
  return map[status]?.[lang] ?? status;
}

export function sessionLabel(s: string, lang: Lang = "mn"): string {
  if (s === "first") return lang === "mn" ? "1-р улирал" : "Session 1";
  if (s === "second") return lang === "mn" ? "2-р улирал" : "Session 2";
  return s;
}

export function categoryLabel(cat: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; en: string }> = {
    japanese: { mn: "Япон хэл", en: "Japanese" },
    math: { mn: "Математик", en: "Mathematics" },
    science: { mn: "Шинжлэх ухаан", en: "Science" },
    general: { mn: "Ерөнхий хичээл", en: "General subjects" },
  };
  return map[cat]?.[lang] ?? cat;
}

export function subjectLabel(code: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; en: string }> = {
    J1: { mn: "Япон хэл (дээд түвшин)", en: "Japanese (advanced)" },
    J2: { mn: "Япон хэл (суурь түвшин)", en: "Japanese (basic)" },
    K1: { mn: "Математик курс 1", en: "Mathematics course 1" },
    K2: { mn: "Математик курс 2", en: "Mathematics course 2" },
    PHY: { mn: "Физик", en: "Physics" },
    CHEM: { mn: "Хими", en: "Chemistry" },
    BIO: { mn: "Биологи", en: "Biology" },
    GEN: { mn: "Ерөнхий хичээл", en: "General subjects" },
  };
  return map[code]?.[lang] ?? code;
}
