import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import japanLifeImage from "@/assets/picture3.jpg";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import {
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  FileText,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Home,
  Languages,
  Loader2,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Оюутны хяналтын самбар | EJU" }] }),
  component: StudentDashboard,
});

interface DashboardData {
  firstName: string;
  totalApps: number;
  hasApplication: boolean;
}

function StudentDashboard() {
  const { lang }: { lang: Lang } = useLang();

  const { data, isLoading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiGet<DashboardData>("/api/student/dashboard"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const greeting =
    lang === "mn"
      ? `Сайн байна уу, ${data.firstName || "Оюутан"}`
      : `Hello, ${data.firstName || "Student"}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={GraduationCap}
        eyebrow={lang === "mn" ? "EJU оюутан" : "EJU student"}
        title={greeting}
        description={
          lang === "mn"
            ? "Бүртгэл, профайл болон Японд ажиллаж амьдрахад хэрэгтэй мэдээллээ нэг дороос харна."
            : "Review your application, profile, and helpful information about living and working in Japan."
        }
        actions={
          <>
            <Button asChild>
              <Link to={data.hasApplication ? "/student/applications" : "/student/exams"}>
                {data.hasApplication
                  ? lang === "mn"
                    ? "Бүртгэл харах"
                    : "View application"
                  : lang === "mn"
                    ? "Бүртгүүлэх"
                    : "Register"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/student/requests">
                <MessageSquare className="h-4 w-4" />
                {lang === "mn" ? "Админд хүсэлт" : "Request admin"}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4">
        <StudentMetricCard
          icon={FileText}
          label={lang === "mn" ? "Миний бүртгэл" : "My applications"}
          value={data.totalApps}
          helper={lang === "mn" ? "Илгээсэн бүртгэл" : "Submitted records"}
          tone="teal"
        />
      </div>

      <JapanLifeSection lang={lang} />

      <StudentPanel
        title={lang === "mn" ? "Японд ажиллахын давуу тал" : "Benefits of working in Japan"}
        description={
          lang === "mn"
            ? "EJU болон япон хэлний бэлтгэл нь зөвхөн шалгалт биш, ирээдүйн ажил амьдралын суурь болно."
            : "EJU and Japanese preparation can become a foundation for future work and life."
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <BenefitCard
            icon={Briefcase}
            title={lang === "mn" ? "Ажлын соёл" : "Work culture"}
            text={
              lang === "mn"
                ? "Цаг баримтлах, багийн ажиллагаа, хариуцлагатай ажиллах дадал хурдан сууна."
                : "Build punctuality, teamwork, and responsible work habits."
            }
          />
          <BenefitCard
            icon={Languages}
            title={lang === "mn" ? "Хэлний орчин" : "Language environment"}
            text={
              lang === "mn"
                ? "Япон хэлээ өдөр тутам хэрэглэж, сонсох ярих чадвараа бодитоор ахиулна."
                : "Use Japanese daily and improve real listening and speaking skills."
            }
          />
          <BenefitCard
            icon={Building2}
            title={lang === "mn" ? "Карьерын туршлага" : "Career experience"}
            text={
              lang === "mn"
                ? "Үйлчилгээ, технологи, үйлдвэрлэлийн өндөр стандарттай орчинд ажиллана."
                : "Work in environments with strong service, technology, and production standards."
            }
          />
          <BenefitCard
            icon={Globe2}
            title={lang === "mn" ? "Олон улсын боломж" : "Global opportunity"}
            text={
              lang === "mn"
                ? "Японд сурсан туршлага цаашдын сургууль, ажил, бизнесийн боломжийг нэмнэ."
                : "Experience in Japan can support future study, work, and business paths."
            }
          />
        </div>
      </StudentPanel>
    </div>
  );
}

function JapanLifeSection({ lang }: { lang: Lang }) {
  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-lg border border-border/80 bg-slate-950 shadow-card">
      <img
        src={japanLifeImage}
        alt={lang === "mn" ? "Японы байгаль, хотын зураг" : "Japan landscape and city"}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/15" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/75 to-transparent" />

      <div className="relative flex min-h-[420px] flex-col justify-between p-5 sm:p-7 lg:max-w-2xl">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white/90 text-primary shadow-sm">
            <Home className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {lang === "mn" ? "Японд ажиллаж, амьдрах боломж" : "Living and working in Japan"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
            {lang === "mn"
              ? "Япон улс нь аюулгүй орчин, тогтвортой ажлын соёл, үйлчилгээний өндөр стандарт, шинэ ур чадвар сурах боломжтой гэдгээрээ олон залууст том туршлага болдог."
              : "Japan offers a safe environment, reliable work culture, high service standards, and the chance to build new skills through everyday experience."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniPoint
              icon={BadgeCheck}
              title={lang === "mn" ? "Сахилга бат" : "Discipline"}
              text={lang === "mn" ? "Цаг, чанар, хариуцлага" : "Time, quality, responsibility"}
            />
            <MiniPoint
              icon={HeartHandshake}
              title={lang === "mn" ? "Соёлын туршлага" : "Culture"}
              text={
                lang === "mn" ? "Хүмүүстэй зөв харилцах дадал" : "Respectful communication habits"
              }
            />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/student/requests">
                {lang === "mn" ? "Админаас асуух" : "Ask admin"}
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/student/profile">
                {lang === "mn" ? "Профайл бэлдэх" : "Prepare profile"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Badge className="border-white/20 bg-white/90 text-slate-950 hover:bg-white">
            {lang === "mn" ? "Амьдрал" : "Life"}
          </Badge>
          <Badge className="border-white/20 bg-white/90 text-slate-950 hover:bg-white">
            {lang === "mn" ? "Ажил" : "Work"}
          </Badge>
          <Badge className="border-white/20 bg-white/90 text-slate-950 hover:bg-white">
            {lang === "mn" ? "Соёл" : "Culture"}
          </Badge>
        </div>
      </div>
    </section>
  );
}

function MiniPoint({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/90 p-3 text-slate-950 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-1 text-xs text-slate-600">{text}</p>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
