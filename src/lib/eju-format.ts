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
  if (lang === "ja") {
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
  const map: Record<string, { mn: string; ja: string }> = {
    pending: { mn: "Хүлээгдэж буй", ja: "Pending" },
    approved: { mn: "Зөвшөөрсөн", ja: "Approved" },
    rejected: { mn: "Татгалзсан", ja: "Rejected" },
    paid: { mn: "Төлсөн", ja: "Paid" },
    unpaid: { mn: "Төлөөгүй", ja: "Unpaid" },
  };
  return map[status]?.[lang] ?? status;
}

export function sessionLabel(s: string, lang: Lang = "mn"): string {
  if (s === "first") return lang === "mn" ? "1-р улирал" : "Session 1";
  if (s === "second") return lang === "mn" ? "2-р улирал" : "Session 2";
  return s;
}

export function categoryLabel(cat: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; ja: string }> = {
    japanese: { mn: "Япон хэл", ja: "Japanese" },
    math: { mn: "Математик", ja: "Mathematics" },
    science: { mn: "Шинжлэх ухаан", ja: "Science" },
    general: { mn: "Ерөнхий хичээл", ja: "General subjects" },
  };
  return map[cat]?.[lang] ?? cat;
}

export function subjectLabel(code: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; ja: string }> = {
    J1: { mn: "Япон хэл (дээд түвшин)", ja: "Japanese (advanced)" },
    J2: { mn: "Япон хэл (суурь түвшин)", ja: "Japanese (basic)" },
    K1: { mn: "Математик курс 1", ja: "Mathematics course 1" },
    K2: { mn: "Математик курс 2", ja: "Mathematics course 2" },
    PHY: { mn: "Физик", ja: "Physics" },
    CHEM: { mn: "Хими", ja: "Chemistry" },
    BIO: { mn: "Биологи", ja: "Biology" },
    GEN: { mn: "Ерөнхий хичээл", ja: "General subjects" },
  };
  return map[code]?.[lang] ?? code;
}
