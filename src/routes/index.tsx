import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import heroImg from "@/assets/picture1.jpg";
import picture2 from "@/assets/picture2.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EJU Бүртгэлийн Систем — Япон Их Сургуулийн Шалгалт" },
      {
        name: "description",
        content:
          "Монгол оюутнуудад зориулсан EJU шалгалтын онлайн бүртгэлийн систем. Шалгалт сонгож, баримтаа байршуулж, статусаа хянаарай.",
      },
    ],
  }),
  component: Index,
});

const STATS = [
  { valueMn: "500+", labelMn: "Бүртгэлтэй оюутан", labelEn: "Registered students" },
  { valueMn: "2", labelMn: "Улирал жил бүр", labelEn: "Sessions per year" },
  { valueMn: "8", labelMn: "Хичээлийн чиглэл", labelEn: "Subject areas" },
  { valueMn: "98%", labelMn: "Хэрэглэгчийн сэтгэл ханамж", labelEn: "Satisfaction rate" },
];

const STEPS = [
  {
    num: "01",
    icon: Users,
    titleMn: "Бүртгэл үүсгэх",
    titleEn: "Create an account",
    descMn: "Имэйл болон паспортын мэдээллээрээ бүртгэл үүсгэнэ.",
    descEn: "Sign up with your email and passport details.",
  },
  {
    num: "02",
    icon: ClipboardList,
    titleMn: "Шалгалт сонгох",
    titleEn: "Choose your exam",
    descMn: "Хүссэн шалгалтын улирал болон хичээлүүдээ сонгоно.",
    descEn: "Select your preferred session and subjects.",
  },
  {
    num: "03",
    icon: Upload,
    titleMn: "Баримт илгээх",
    titleEn: "Submit documents",
    descMn: "Паспорт болон зургаа байршуулж бүртгэлээ дуусгана.",
    descEn: "Upload your passport copy and photo to complete the application.",
  },
  {
    num: "04",
    icon: CheckCircle2,
    titleMn: "Баталгаажуулалт авах",
    titleEn: "Get confirmed",
    descMn: "Бүртгэлийн статусаа хянаж, батламж хүлээн авна.",
    descEn: "Track your application status and receive confirmation.",
  },
];

const FEATURES = [
  {
    icon: FileCheck2,
    titleMn: "Онлайн бүртгэл",
    titleEn: "Online registration",
    descMn: "Шалгалтын улирал бүрт онлайнаар бүртгүүлэх боломжтой.",
    descEn: "Register for each exam session entirely online.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Upload,
    titleMn: "Баримт байршуулах",
    titleEn: "Document upload",
    descMn: "Паспорт, зураг болон бусад баримтаа хялбархан байршуулна.",
    descEn: "Easily upload your passport, photo and required documents.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: LayoutDashboard,
    titleMn: "Статус хянах",
    titleEn: "Application tracking",
    descMn: "Бүртгэлийнхээ явцыг бодит цаг хугацаанд хянана.",
    descEn: "Monitor your application status in real time.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: BookOpen,
    titleMn: "Хичээл сонгох",
    titleEn: "Subject selection",
    descMn: "Хэрэгтэй 8 хичээлийн чиглэлээс өөрт тохирохыг сонгоно.",
    descEn: "Choose from 8 subject areas to match your goals.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Lock,
    titleMn: "Аюулгүй систем",
    titleEn: "Secure portal",
    descMn: "JWT баталгаажуулалтаар мэдээллийн аюулгүй байдлыг хангана.",
    descEn: "Your data is protected with JWT authentication.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: ShieldCheck,
    titleMn: "Зааварчилгаа",
    titleEn: "Step-by-step guide",
    descMn: "Бүртгэлийн алхам бүрийг дагаж хялбархан бүртгүүлнэ.",
    descEn: "Follow the step-by-step guide to complete registration.",
    color: "bg-amber-50 text-amber-600",
  },
];

const SUBJECTS = [
  { code: "J1", mn: "Япон хэл (Дээд)", en: "Japanese (Advanced)", cat: "japanese" },
  { code: "J2", mn: "Япон хэл (Суурь)", en: "Japanese (Basic)", cat: "japanese" },
  { code: "K1", mn: "Математик I", en: "Mathematics I", cat: "math" },
  { code: "K2", mn: "Математик II", en: "Mathematics II", cat: "math" },
  { code: "PHY", mn: "Физик", en: "Physics", cat: "science" },
  { code: "CHEM", mn: "Хими", en: "Chemistry", cat: "science" },
  { code: "BIO", mn: "Биологи", en: "Biology", cat: "science" },
  { code: "GEN", mn: "Ерөнхий хичээл", en: "General Studies", cat: "general" },
];

const SUBJECT_COLORS: Record<string, string> = {
  japanese: "border-indigo-200 bg-indigo-50/60 text-indigo-700",
  math: "border-violet-200 bg-violet-50/60 text-violet-700",
  science: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
  general: "border-amber-200 bg-amber-50/60 text-amber-700",
};

const TESTIMONIALS = [
  {
    nameMn: "Б. Болормаа",
    roleMn: "Токиогийн Их Сургуулийн оюутан",
    roleEn: "Student at University of Tokyo",
    textMn: "Системийг ашиглахад маш хялбар байсан. Бүртгэлийн явцыг хянах функц маш тустай байлаа.",
    textEn: "The system was very easy to use. The application tracking feature was extremely helpful.",
    initials: "ББ",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    nameMn: "Д. Тэмүүжин",
    roleMn: "Осакагийн Их Сургуулийн оюутан",
    roleEn: "Student at Osaka University",
    textMn: "Онлайн бүртгэл хийх боломж маш дөхөм байсан. Бичиг баримтаа хялбархан байршуулж чадсан.",
    textEn: "Online registration was very convenient. I could easily upload all my documents.",
    initials: "ДТ",
    color: "bg-violet-100 text-violet-700",
  },
  {
    nameMn: "О. Мөнхзул",
    roleMn: "Киотогийн Их Сургуулийн оюутан",
    roleEn: "Student at Kyoto University",
    textMn: "Монгол хэл дээр бүртгүүлэх боломж байгаа нь маш сайн хэрэг болсон. Найзуудадаа санал болгоно.",
    textEn: "Having registration available in Mongolian was fantastic. I'll recommend it to friends.",
    initials: "ОМ",
    color: "bg-rose-100 text-rose-700",
  },
];

function Index() {
  const { user, role, loading } = useAuth();
  const { lang } = useLang();

  if (!loading && user) {
    return <Navigate to={role === "admin" ? "/admin/dashboard" : "/student/dashboard"} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.20_0.08_264)] via-[oklch(0.28_0.12_268)] to-[oklch(0.36_0.16_276)]">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[oklch(0.55_0.18_280)] opacity-[0.12] blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.15_15)] opacity-[0.08] blur-[80px]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative container mx-auto grid items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28 lg:py-32">
          {/* Left content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.88_0.12_15)]" />
              {lang === "mn" ? "2026 оны бүртгэл нээлттэй" : "2026 applications are open"}
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-white md:text-5xl lg:text-[3.5rem]">
              {lang === "mn" ? (
                <>Япон сургуульд<br /><span className="text-[oklch(0.88_0.12_15)]">элсэх таны эхлэл</span></>
              ) : (
                <>Your gateway to<br /><span className="text-[oklch(0.88_0.12_15)]">studying in Japan</span></>
              )}
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/70 md:text-lg">
              {lang === "mn"
                ? "EJU шалгалтад цахимаар бүртгүүлж, баримтаа байршуулж, бүртгэлийнхээ явцыг нэг дороос хянаарай."
                : "Apply for the EJU exam online, upload your documents, and track your application all in one place."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-[oklch(0.28_0.12_268)] hover:bg-white/90 shadow-lg font-semibold">
                <Link to="/register">
                  {lang === "mn" ? "Эхлэх" : "Get started"} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
                <Link to="/login">{lang === "mn" ? "Нэвтрэх" : "Sign in"}</Link>
              </Button>
            </div>

            {/* Trust chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                lang === "mn" ? "✓ Үнэгүй бүртгэл" : "✓ Free registration",
                lang === "mn" ? "✓ Монгол хэлтэй" : "✓ Mongolian language",
                lang === "mn" ? "✓ Аюулгүй систем" : "✓ Secure system",
              ].map((chip) => (
                <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/15">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right: hero image with floating cards */}
          <div className="relative hidden md:block">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] border border-white/10">
              <img src={heroImg} alt="EJU Registration" className="w-full h-[420px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Floating stat badge — top left */}
            <div className="absolute -left-6 top-10 rounded-xl border border-white/20 bg-white/95 backdrop-blur-sm p-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{lang === "mn" ? "Нийт оюутан" : "Total students"}</p>
                  <p className="text-base font-bold text-foreground">500+</p>
                </div>
              </div>
            </div>

            {/* Floating stat badge — bottom right */}
            <div className="absolute -right-6 bottom-10 rounded-xl border border-white/20 bg-white/95 backdrop-blur-sm p-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{lang === "mn" ? "Зөвшөөрөгдсөн" : "Approved"}</p>
                  <p className="text-base font-bold text-foreground">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.labelMn} className="bg-card px-6 py-7 text-center">
              <p className="text-3xl font-bold text-primary">{s.valueMn}</p>
              <p className="mt-1 text-sm text-muted-foreground">{lang === "mn" ? s.labelMn : s.labelEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
              {lang === "mn" ? "Бүртгэлийн процесс" : "How it works"}
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "mn" ? "4 хялбар алхмаар бүртгүүлэх" : "Register in 4 simple steps"}
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {lang === "mn"
                ? "Бүртгэлийн процессыг аль болох хялбар, ойлгомжтой байхаар зохион бүтээсэн."
                : "We've made the registration process as simple and clear as possible."}
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-4">
            {/* Connecting line */}
            <div className="pointer-events-none absolute top-10 left-0 right-0 hidden md:block">
              <div className="mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" style={{ width: "calc(100% - 4rem)", marginLeft: "2rem" }} />
            </div>

            {STEPS.map((step) => (
              <div key={step.num} className="relative flex flex-col items-center text-center md:items-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.45_0.16_280)] text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.36_0.13_264/0.45)] z-10">
                  <step.icon className="h-7 w-7" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow border border-border">
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {lang === "mn" ? step.titleMn : step.titleEn}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {lang === "mn" ? step.descMn : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
              {lang === "mn" ? "Системийн давуу талууд" : "Platform features"}
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "mn" ? "Бүх шаардлагатай хэрэгсэл нэг дор" : "Everything you need in one place"}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.titleMn} className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {lang === "mn" ? f.titleMn : f.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {lang === "mn" ? f.descMn : f.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS SECTION ────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
                {lang === "mn" ? "Хичээлийн чиглэлүүд" : "Subject areas"}
              </p>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                {lang === "mn" ? "EJU-гийн 8 хичээл" : "8 EJU subjects"}
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md">
                {lang === "mn"
                  ? "Өөрийн зорилго болон шаардлагад тохирсон хичээлүүдийг сонгон бүртгүүлнэ."
                  : "Choose the subjects that match your goals and university requirements."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/register">{lang === "mn" ? "Бүртгүүлэх" : "Register now"} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {SUBJECTS.map((s) => (
              <div key={s.code} className={`rounded-xl border px-5 py-4 ${SUBJECT_COLORS[s.cat]} transition-shadow hover:shadow-sm`}>
                <span className="text-xs font-mono font-bold opacity-60">{s.code}</span>
                <p className="mt-1 text-sm font-semibold">{lang === "mn" ? s.mn : s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
              {lang === "mn" ? "Оюутнуудын сэтгэгдэл" : "Student testimonials"}
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "mn" ? "Оюутнууд юу хэлдэг вэ?" : "What students say"}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.nameMn} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <span key={n} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                  "{lang === "mn" ? t.textMn : t.textEn}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0 ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.nameMn}</p>
                    <p className="text-[11px] text-muted-foreground">{lang === "mn" ? t.roleMn : t.roleEn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT VISUAL SECTION ────────────────────────────── */}
      <section className="py-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-violet-500/5 -z-10" />
              <img src={picture2} alt="EJU exam campus" className="rounded-2xl shadow-elegant border border-border w-full object-cover h-[360px]" />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 rounded-xl bg-card border border-border shadow-card px-5 py-3">
                <p className="text-xs text-muted-foreground">{lang === "mn" ? "Дараагийн шалгалт" : "Next exam session"}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">2026 · {lang === "mn" ? "6-р сар" : "June"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-4">
                {lang === "mn" ? "Яагаад биднийг сонгох вэ?" : "Why choose us?"}
              </p>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl leading-tight">
                {lang === "mn" ? "Монгол оюутнуудад зориулсан, монголоор" : "Built for Mongolian students, in Mongolian"}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {lang === "mn"
                  ? "Япон их сургуулийн элсэлтийн шалгалтын бүртгэлийг монгол хэлээр, хялбар интерфэйсээр хийх боломж олгодог цорын ганц систем."
                  : "The only platform offering EJU exam registration in the Mongolian language with a clean, simple interface."}
              </p>
              <ul className="mt-6 space-y-3">
                {(lang === "mn"
                  ? ["Монгол хэлний дэмжлэг", "Хялбар баримт байршуулалт", "Бодит цагийн статус хянах", "Хурдан баталгаажуулалт"]
                  : ["Full Mongolian language support", "Simple document upload flow", "Real-time application status", "Quick approval notifications"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 shadow-elegant">
                <Link to="/register">
                  {lang === "mn" ? "Одоо бүртгүүлэх" : "Register now"} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[oklch(0.22_0.10_264)] to-[oklch(0.32_0.15_276)] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-white/5 blur-[60px]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots2)" />
          </svg>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
            {lang === "mn" ? "Бүртгэл эхлэх" : "Get started today"}
          </p>
          <h2 className="text-3xl font-bold text-white md:text-5xl max-w-2xl mx-auto leading-tight">
            {lang === "mn" ? "Японд суралцах мөрөөллөө биелүүл" : "Make your dream of studying in Japan a reality"}
          </h2>
          <p className="mt-4 text-white/60 max-w-lg mx-auto">
            {lang === "mn"
              ? "Хэдхэн алхмаар EJU шалгалтад бүртгүүлж, өөрийн ирээдүйг өөрчил."
              : "Register for the EJU exam in just a few steps and change your future."}
          </p>
          <div className="mt-8 flex justify-center flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[oklch(0.28_0.12_268)] hover:bg-white/90 font-semibold shadow-lg">
              <Link to="/register">
                {lang === "mn" ? "Үнэгүй бүртгүүлэх" : "Register for free"} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
              <Link to="/registration-guide">
                {lang === "mn" ? "Зааварчилгаа харах" : "View guide"}
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-white/40 text-xs">
            {lang === "mn" ? "Бүртгэл үнэгүй · Нэмэлт хураамж байхгүй" : "Free to register · No hidden fees"}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
