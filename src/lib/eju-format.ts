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
  const date = parseDateKey(dateStr);
  if (date) {
    if (lang === "en") {
      return `${EN_MONTHS[date.month - 1]} ${date.day}, ${date.year}`;
    }
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  }

  const d = new Date(dateStr);
  if (lang === "en") {
    return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isRegistrationOpen(start: string, end: string): boolean {
  const today = localDateKey(new Date());
  const startKey = normalizeDateKey(start);
  const endKey = normalizeDateKey(end);

  return startKey <= today && endKey >= today;
}

function normalizeDateKey(value: string): string {
  const date = parseDateKey(value);
  if (date) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  }
  return localDateKey(new Date(value));
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function statusLabel(status: string, lang: Lang = "mn"): string {
  const map: Record<string, { mn: string; en: string }> = {
    pending_payment: { mn: "Төлбөр хүлээгдэж буй", en: "Awaiting payment" },
    pending: { mn: "Хүлээгдэж буй", en: "Pending" },
    confirmed: { mn: "Баталгаажсан", en: "Confirmed" },
    approved: { mn: "Зөвшөөрсөн", en: "Approved" },
    rejected: { mn: "Татгалзсан", en: "Rejected" },
    paid: { mn: "Төлсөн", en: "Paid" },
    unpaid: { mn: "Төлөөгүй", en: "Unpaid" },
    failed: { mn: "Амжилтгүй", en: "Failed" },
    expired: { mn: "Хугацаа дууссан", en: "Expired" },
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
    J1: { mn: "Япон хэл", en: "Japanese" },
    J2: { mn: "Япон хэл", en: "Japanese" },
    SCI: { mn: "Шинжлэх ухаан", en: "Science" },
    K1: { mn: "Математик", en: "Mathematics" },
    K2: { mn: "Математик", en: "Mathematics" },
    PHY: { mn: "Физик", en: "Physics" },
    CHEM: { mn: "Хими", en: "Chemistry" },
    BIO: { mn: "Биологи", en: "Biology" },
    GEN: { mn: "Japan and the World", en: "Japan and the World" },
  };
  return map[code]?.[lang] ?? code;
}
