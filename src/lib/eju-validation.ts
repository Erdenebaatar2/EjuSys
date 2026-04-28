// EJU subject combination validation per JASSO rules
export type SubjectCode = "J1" | "J2" | "K1" | "K2" | "PHY" | "CHEM" | "BIO" | "GEN";

export interface ValidationResult {
  valid: boolean;
  messageMn?: string;
  messageJa?: string;
}

export function validateSubjectCombination(codes: SubjectCode[]): ValidationResult {
  if (codes.length === 0) {
    return {
      valid: false,
      messageMn: "Хамгийн багадаа нэг хичээл сонгоно уу",
      messageJa: "Please select at least one subject.",
    };
  }

  const hasJ1 = codes.includes("J1");
  const hasJ2 = codes.includes("J2");
  if (hasJ1 && hasJ2) {
    return {
      valid: false,
      messageMn: "Япон хэл (J1) болон (J2)-г хамт сонгох боломжгүй",
      messageJa: "You cannot choose J1 and J2 at the same time.",
    };
  }

  const hasK1 = codes.includes("K1");
  const hasK2 = codes.includes("K2");
  if (hasK1 && hasK2) {
    return {
      valid: false,
      messageMn: "Математик (K1) болон (K2)-г хамт сонгох боломжгүй",
      messageJa: "You cannot choose Mathematics course 1 and 2 together.",
    };
  }

  const sciences = codes.filter((c) => c === "PHY" || c === "CHEM" || c === "BIO");
  const hasGeneral = codes.includes("GEN");
  if (sciences.length > 0 && hasGeneral) {
    return {
      valid: false,
      messageMn: "Шинжлэх ухаан болон Ерөнхий хичээлийг хамт сонгох боломжгүй",
      messageJa: "Science and General subjects cannot be selected together.",
    };
  }

  if (sciences.length > 2) {
    return {
      valid: false,
      messageMn: "Шинжлэх ухааны хичээлээс ихдээ 2-ыг сонгоно",
      messageJa: "You can select at most 2 science subjects.",
    };
  }

  return { valid: true };
}

export const MAX_PASSPORT_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

export function validateFile(file: File, type: "passport" | "photo"): ValidationResult {
  const maxSize = type === "passport" ? MAX_PASSPORT_SIZE : MAX_PHOTO_SIZE;
  const allowed =
    type === "passport"
      ? ["application/pdf", "image/jpeg", "image/png"]
      : ["image/jpeg", "image/png"];

  if (file.size > maxSize) {
    return {
      valid: false,
      messageMn: `Файлын хэмжээ ${maxSize / 1024 / 1024}MB-аас хэтэрсэн`,
      messageJa: `File size exceeds ${maxSize / 1024 / 1024}MB.`,
    };
  }
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      messageMn: `Зөвшөөрөгдсөн формат: ${allowed.join(", ")}`,
      messageJa: `Allowed formats: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
