// Bilingual translations (Mongolian + Japanese) for EJU registration system
export type Lang = "mn" | "ja";

export const translations = {
  // Brand & general
  appName: { mn: "EJU Бүртгэлийн Систем", ja: "EJU 出願システム" },
  appTagline: {
    mn: "Япон Их Сургуулийн Шалгалт",
    ja: "日本留学試験",
  },

  // Auth
  login: { mn: "Нэвтрэх", ja: "ログイン" },
  logout: { mn: "Гарах", ja: "ログアウト" },
  register: { mn: "Бүртгүүлэх", ja: "新規登録" },
  email: { mn: "Имэйл", ja: "メール" },
  password: { mn: "Нууц үг", ja: "パスワード" },
  confirmPassword: { mn: "Нууц үг давтах", ja: "パスワード確認" },
  firstName: { mn: "Нэр", ja: "名" },
  lastName: { mn: "Овог", ja: "姓" },
  passportNumber: { mn: "Паспорт дугаар", ja: "パスポート番号" },
  phone: { mn: "Утас", ja: "電話" },
  forgotPassword: { mn: "Нууц үг мартсан уу?", ja: "パスワードをお忘れですか？" },
  noAccount: { mn: "Бүртгэл байхгүй юу?", ja: "アカウントをお持ちでない方" },
  hasAccount: { mn: "Бүртгэлтэй юу?", ja: "アカウントをお持ちの方" },
  signInWithGoogle: { mn: "Google-р нэвтрэх", ja: "Googleでログイン" },

  // Nav
  dashboard: { mn: "Хяналтын самбар", ja: "ダッシュボード" },
  exams: { mn: "Шалгалтууд", ja: "試験" },
  applications: { mn: "Бүртгэлүүд", ja: "出願" },
  myApplications: { mn: "Миний бүртгэл", ja: "マイ出願" },
  students: { mn: "Оюутнууд", ja: "学生" },
  profile: { mn: "Профайл", ja: "プロフィール" },
  stats: { mn: "Тайлан", ja: "統計" },

  // Status
  pending: { mn: "Хүлээгдэж буй", ja: "審査中" },
  approved: { mn: "Зөвшөөрсөн", ja: "承認済み" },
  rejected: { mn: "Татгалзсан", ja: "却下" },
  paid: { mn: "Төлсөн", ja: "支払済" },
  unpaid: { mn: "Төлөөгүй", ja: "未払い" },

  // Actions
  apply: { mn: "Бүртгүүлэх", ja: "申し込む" },
  submit: { mn: "Илгээх", ja: "送信" },
  cancel: { mn: "Цуцлах", ja: "キャンセル" },
  save: { mn: "Хадгалах", ja: "保存" },
  edit: { mn: "Засах", ja: "編集" },
  delete: { mn: "Устгах", ja: "削除" },
  approve: { mn: "Зөвшөөрөх", ja: "承認" },
  reject: { mn: "Татгалзах", ja: "却下" },
  view: { mn: "Харах", ja: "表示" },
  search: { mn: "Хайх", ja: "検索" },

  // Hero
  heroTitle: { mn: "Япон сургуульд элсэх таны эхлэл", ja: "日本留学への第一歩" },
  heroSub: {
    mn: "EJU шалгалтад цахимаар бүртгүүлж, мэдээллээ нэг газраас удирдаарай.",
    ja: "EJU試験にオンラインで出願し、すべての情報を一元管理。",
  },
  getStarted: { mn: "Эхлэх", ja: "はじめる" },
  learnMore: { mn: "Дэлгэрэнгүй", ja: "詳しく見る" },

  // Common
  loading: { mn: "Уншиж байна...", ja: "読み込み中..." },
  noData: { mn: "Мэдээлэл байхгүй", ja: "データがありません" },
  required: { mn: "Заавал", ja: "必須" },
  optional: { mn: "Заавал биш", ja: "任意" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang = "mn"): string {
  return translations[key]?.[lang] ?? key;
}
