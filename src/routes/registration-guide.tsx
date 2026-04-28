import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/contexts/LangContext";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Download,
  ExternalLink,
  FileText,
  Info,
  Newspaper,
  Sparkles,
} from "lucide-react";

interface GuideStep {
  titleMn: string;
  titleEn: string;
  bodyMn: string;
  bodyEn: string;
}

interface GuideUpdate {
  titleMn: string;
  titleEn: string;
  date: string;
  href: string;
  download?: boolean;
}

const bulletinPath = "/files/EJU_Bulletin_2026.pdf";

export const Route = createFileRoute("/registration-guide")({
  head: () => ({
    meta: [
      { title: "Бүртгэлийн зааварчилгаа | EJU" },
      {
        name: "description",
        content:
          "EJU бүртгэлийн алхам, хугацаа, шалгалтын тов, шаардлагатай мэдээллийг нэг дороос харах хуудас.",
      },
    ],
  }),
  component: RegistrationGuidePage,
});

function RegistrationGuidePage() {
  const { lang } = useLang();

  const highlights = [
    {
      mn: "EJU нь Японы их, дээд сургуульд суралцах хүсэлтэй гадаад оюутнуудад зориулсан элсэлтийн шалгалт.",
      en: "EJU is the entrance examination used by international students applying to universities in Japan.",
    },
    {
      mn: "Шалгалтад япон хэл, суурь мэдлэг, математикийн болон шинжлэх ухааны агуулга багтдаг.",
      en: "The exam covers Japanese language ability together with math, science, and other academic foundations.",
    },
    {
      mn: "Эндээс та бүртгэлийн алхам, хугацаа, шинэ мэдээ мэдээллээ нэг дороос авна.",
      en: "This page brings together the registration steps, bulletin, dates, and updates in one place.",
    },
  ];

  const steps: GuideStep[] = [
    {
      titleMn: "1. Товч танилцах",
      titleEn: "1. Review the bulletin",
      bodyMn: "Шалгалтыг нээж шалгалтын бүтэц, шаардлагатай материал, хугацааг нягтална.",
      bodyEn: "Open the exam bulletin and confirm the structure, required materials, and schedule.",
    },
    {
      titleMn: "2. Бүртгэлийн мэдээллээ бэлтгэх",
      titleEn: "2. Prepare your registration details",
      bodyMn:
        "Холбоо барих мэдээлэл, зорилтот сургууль, паспорт болон зураг зэрэг файлуудаа урьдчилан бэлдэнэ.",
      bodyEn:
        "Prepare your contact details, target university, passport scan, and photo in advance.",
    },
    {
      titleMn: "3. Системээр бүртгүүлэх",
      titleEn: "3. Submit through the system",
      bodyMn:
        "Нээлттэй шалгалтаа сонгоод энэ систем дээрээс хүсэлтээ илгээж, явцаа дараа нь хянах боломжтой.",
      bodyEn:
        "Choose an open exam, submit your application through this system, and track the result later.",
    },
  ];

  const updates: GuideUpdate[] = [
    {
      titleMn: "2026-06-21 шалгалтын бүртгэлийн хугацаа: 2026-02-16 - 2026-03-12",
      titleEn: "Registration period for the June 21, 2026 exam: 2026-02-16 to 2026-03-12",
      date: "2026-03-12",
      href: bulletinPath,
      download: true,
    },
    {
      titleMn: "2026-11-08 шалгалтын огноог шалгах",
      titleEn: "Check the November 8, 2026 exam details in the bulletin",
      date: "2026-02-16",
      href: bulletinPath,
      download: true,
    },
    {
      titleMn: "Японд суралцах ерөнхий мэдээлэл",
      titleEn: "General information about studying in Japan",
      date: "2026-04-28",
      href: "https://www.studyinjapan.go.jp/en/",
    },
  ];

  const dateItems = [
    {
      labelMn: "Бүртгэлийн хугацаа",
      labelEn: "Registration window",
      value: "2026-02-16 — 2026-03-12",
    },
    {
      labelMn: "1-р шалгалтын өдөр",
      labelEn: "First exam date",
      value: "2026-06-21",
    },
    {
      labelMn: "2-р шалгалтын өдөр",
      labelEn: "Second exam date",
      value: "2026-11-08",
    },
  ];

  const statItems = [
    {
      num: "2",
      labelMn: "шалгалтын цикл",
      labelEn: "exam cycles",
    },
    {
      num: "24",
      labelMn: "бүртгэлийн хоног",
      labelEn: "days to register",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-6xl mx-auto">
            {/* Page header */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-accent/60 text-accent-foreground">
                {lang === "mn" ? "Бүртгэлийн заавар" : "Registration Guide"}
              </Badge>
              <Badge variant="outline">
                {lang === "mn" ? "2026 оны шалгалт" : "2026 Exam Cycle"}
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  {lang === "mn" ? "EJU бүртгэлийн зааварчилгаа" : "EJU registration guide"}
                </h1>
              </div>
              <Button asChild variant="outline">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {lang === "mn" ? "Нүүр рүү буцах" : "Back to home"}
                </Link>
              </Button>
            </div>

            {/* Main grid */}
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">

              {/* ── Left column ── */}
              <div className="space-y-8">

                {/* About card */}
                <div className="rounded-xl border border-border bg-card px-6 py-7 shadow-card">
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {lang === "mn" ? "Шалгалтын тухай" : "About the exam"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground md:text-[15px]">
                    {highlights.map((item) => (
                      <p key={item.en}>{lang === "mn" ? item.mn : item.en}</p>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        mn: "Япон дахь их, дээд сургуульд элсэх шалгуурын нэг хэсэг",
                        en: "A key requirement for university admission in Japan",
                      },
                      {
                        mn: "Олон улсын оюутнуудад зориулсан шалгалт",
                        en: "Designed for international students",
                      },
                      {
                        mn: "Шалгалтын материал, огноо, зааврыг товхимлоос шалгана",
                        en: "Schedules and instructions are confirmed in the bulletin",
                      },
                      {
                        mn: "Энэ системээр дамжуулан бүртгэлээ хянана",
                        en: "Track your registration through this system",
                      },
                    ].map((point) => (
                      <div
                        key={point.en}
                        className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3"
                      >
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <p className="text-sm text-foreground">
                          {lang === "mn" ? point.mn : point.en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-2xl font-semibold">
                      {lang === "mn" ? "Бүртгэлийн үндсэн алхмууд" : "Core registration steps"}
                    </h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                      <div
                        key={step.titleEn}
                        className="rounded-xl border border-border bg-card px-5 py-5 shadow-card"
                      >
                        <div className="text-sm font-semibold text-primary">
                          {lang === "mn" ? step.titleMn : step.titleEn}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {lang === "mn" ? step.bodyMn : step.bodyEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Updates */}
                <div className="rounded-xl border border-border bg-card shadow-card">
                  <div className="flex items-center gap-2 px-6 py-5">
                    <Newspaper className="h-4 w-4 text-primary" />
                    <h2 className="text-2xl font-semibold">
                      {lang === "mn" ? "Сүүлд нэмэгдсэн мэдээлэл" : "Latest updates"}
                    </h2>
                  </div>
                  <Separator />
                  <div className="px-4 py-2">
                    {updates.map((update) => {
                      const external = /^https?:\/\//i.test(update.href);
                      return (
                        <a
                          key={`${update.titleEn}-${update.date}`}
                          href={update.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noreferrer noopener" : undefined}
                          download={update.download ? "" : undefined}
                          className="flex items-start gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-muted/40"
                        >
                          <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <p className="text-sm font-medium leading-6 text-foreground">
                                {lang === "mn" ? update.titleMn : update.titleEn}
                              </p>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {update.date}
                              </span>
                            </div>
                          </div>
                          {external ? (
                            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Right sidebar ── */}
              <aside className="space-y-5 lg:sticky lg:top-24 self-start">

                {/* Bulletin download card */}
                <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-card">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {lang === "mn" ? "Товч мэдээлэл" : "Bulletin"}
                  </Badge>
                  <h3 className="mt-4 text-2xl font-semibold leading-tight">
                    {lang === "mn"
                      ? "2026 оны EJU бүртгэлийн мэдээлэл"
                      : "2026 EJU registration bulletin"}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {lang === "mn"
                      ? "Шалгалтын хуваарь, бүртгэлийн хугацаа, материалын шаардлага, анхаарах зүйлсийг PDF хувилбараар дэлгэрэнгүй татаж үзээрэй."
                      : "Download the official PDF to review the exam schedule, registration window, and document requirements."}
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Button asChild className="w-full">
                      <a href={bulletinPath} download>
                        <Download className="mr-2 h-4 w-4" />
                        {lang === "mn" ? "PDF татах" : "Download PDF"}
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href={bulletinPath} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {lang === "mn" ? "Шинэ tab дээр нээх" : "Open in new tab"}
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Dates card */}
                <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-card">
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {lang === "mn" ? "Хугацааны сануулга" : "Important dates"}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {statItems.map(({ num, labelMn, labelEn }) => (
                      <div
                        key={labelEn}
                        className="rounded-lg bg-muted/40 p-3 text-center"
                      >
                        <div className="text-2xl font-semibold text-primary">{num}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {lang === "mn" ? labelMn : labelEn}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2 text-sm">
                    {dateItems.map(({ labelMn, labelEn, value }) => (
                      <div key={labelEn} className="rounded-lg bg-muted/40 px-4 py-3">
                        <div className="font-medium text-foreground">
                          {lang === "mn" ? labelMn : labelEn}
                        </div>
                        <div className="mt-1 text-muted-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}