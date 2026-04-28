// EJU subject combination validation per JASSO rules
export type SubjectCode = "J1" | "J2" | "K1" | "K2" | "PHY" | "CHEM" | "BIO" | "GEN";

export interface ValidationResult {
  valid: boolean;
  messageMn?: string;
  messageJa?: string;
}

/**
 * JASSO rules:
 * - Must include at least one of: Japanese (J1/J2), Math (K1/K2), Science, or General
 * - Cannot pick both J1 and J2
 * - Cannot pick both K1 and K2
 * - Cannot combine Science (PHY/CHEM/BIO) with General (GEN)
 * - Within Science, can pick at most 2 of PHY/CHEM/BIO (EJU rule)
 */
export function validateSubjectCombination(codes: SubjectCode[]): ValidationResult {
  if (codes.length === 0) {
    return {
      valid: false,
      messageMn: "Хамгийн багадаа нэг хичээл сонгоно уу",
      messageJa: "少なくとも1科目を選択してください",
    };
  }

  const hasJ1 = codes.includes("J1");
  const hasJ2 = codes.includes("J2");
  if (hasJ1 && hasJ2) {
    return {
      valid: false,
      messageMn: "Япон хэл (J1) болон (J2)-г хамт сонгох боломжгүй",
      messageJa: "日本語(上級)と(基礎)を同時に選択できません",
    };
  }

  const hasK1 = codes.includes("K1");
  const hasK2 = codes.includes("K2");
  if (hasK1 && hasK2) {
    return {
      valid: false,
      messageMn: "Математик (К1) болон (К2)-г хамт сонгох боломжгүй",
      messageJa: "数学コース1と2を同時に選択できません",
    };
  }

  const sciences = codes.filter((c) => c === "PHY" || c === "CHEM" || c === "BIO");
  const hasGeneral = codes.includes("GEN");
  if (sciences.length > 0 && hasGeneral) {
    return {
      valid: false,
      messageMn: "Шинжлэх ухаан (Физик/Хими/Биологи) болон Ерөнхий хичээлийг хамт сонгох боломжгүй",
      messageJa: "理科と総合科目を同時に選択できません",
    };
  }

  if (sciences.length > 2) {
    return {
      valid: false,
      messageMn: "Шинжлэх ухааны хичээлээс ихдээ 2-ыг сонгоно",
      messageJa: "理科は最大2科目まで選択できます",
    };
  }

  return { valid: true };
}

export const MAX_PASSPORT_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

export function validateFile(
  file: File,
  type: "passport" | "photo",
): ValidationResult {
  const maxSize = type === "passport" ? MAX_PASSPORT_SIZE : MAX_PHOTO_SIZE;
  const allowed = type === "passport"
    ? ["application/pdf", "image/jpeg", "image/png"]
    : ["image/jpeg", "image/png"];

  if (file.size > maxSize) {
    return {
      valid: false,
      messageMn: `Файлын хэмжээ ${maxSize / 1024 / 1024}MB-аас хэтэрсэн`,
      messageJa: `ファイルサイズが${maxSize / 1024 / 1024}MBを超えています`,
    };
  }
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      messageMn: `Зөвшөөрөгдсөн формат: ${allowed.join(", ")}`,
      messageJa: `許可された形式: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
