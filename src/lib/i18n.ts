export type Lang = "mn" | "en";

export const translations = {
  // Brand & general
  appName: { mn: "EJU Бүртгэлийн Систем", en: "EJU Registration System" },
  appTagline: {
    mn: "Япон Их Сургуулийн Шалгалт",
    en: "Examination for Japanese University Admission",
  },

  // Auth
  login: { mn: "Нэвтрэх", en: "Login" },
  logout: { mn: "Гарах", en: "Logout" },
  register: { mn: "Бүртгүүлэх", en: "Register" },
  email: { mn: "Имэйл", en: "Email" },
  password: { mn: "Нууц үг", en: "Password" },
  confirmPassword: { mn: "Нууц үг давтах", en: "Confirm Password" },
  firstName: { mn: "Нэр", en: "First Name" },
  lastName: { mn: "Овог", en: "Last Name" },
  passportNumber: { mn: "Паспорт дугаар", en: "Passport Number" },
  phone: { mn: "Утас", en: "Phone" },
  forgotPassword: { mn: "Нууц үг мартсан уу?", en: "Forgot password?" },
  noAccount: { mn: "Бүртгэл байхгүй юу?", en: "Don't have an account?" },
  hasAccount: { mn: "Бүртгэлтэй юу?", en: "Already have an account?" },
  signInWithGoogle: { mn: "Google-р нэвтрэх", en: "Sign in with Google" },

  // Nav
  dashboard: { mn: "Хяналтын самбар", en: "Dashboard" },
  exams: { mn: "Шалгалтууд", en: "Exams" },
  applications: { mn: "Бүртгэлүүд", en: "Applications" },
  myApplications: { mn: "Миний бүртгэл", en: "My Applications" },
  students: { mn: "Оюутнууд", en: "Students" },
  profile: { mn: "Профайл", en: "Profile" },
  stats: { mn: "Тайлан", en: "Statistics" },

  // Status
  pending: { mn: "Хүлээгдэж буй", en: "Pending" },
  approved: { mn: "Зөвшөөрсөн", en: "Approved" },
  rejected: { mn: "Татгалзсан", en: "Rejected" },
  paid: { mn: "Төлсөн", en: "Paid" },
  unpaid: { mn: "Төлөөгүй", en: "Unpaid" },

  // Actions
  apply: { mn: "Бүртгүүлэх", en: "Apply" },
  submit: { mn: "Илгээх", en: "Submit" },
  cancel: { mn: "Цуцлах", en: "Cancel" },
  save: { mn: "Хадгалах", en: "Save" },
  edit: { mn: "Засах", en: "Edit" },
  delete: { mn: "Устгах", en: "Delete" },
  approve: { mn: "Зөвшөөрөх", en: "Approve" },
  reject: { mn: "Татгалзах", en: "Reject" },
  view: { mn: "Харах", en: "View" },
  search: { mn: "Хайх", en: "Search" },

  // Hero
  heroTitle: { mn: "Япон сургуульд элсэх таны эхлэл", en: "Your gateway to studying in Japan" },
  heroSub: {
    mn: "EJU шалгалтад цахимаар бүртгүүлж, мэдээллээ нэг газраас удирдаарай.",
    en: "Apply for the EJU exam online and manage everything in one place.",
  },
  getStarted: { mn: "Эхлэх", en: "Get Started" },
  learnMore: { mn: "Дэлгэрэнгүй", en: "Learn More" },

  // Common
  loading: { mn: "Уншиж байна...", en: "Loading..." },
  noData: { mn: "Мэдээлэл байхгүй", en: "No data" },
  required: { mn: "Заавал", en: "Required" },
  optional: { mn: "Заавал биш", en: "Optional" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang = "mn"): string {
  return translations[key]?.[lang] ?? key;
}