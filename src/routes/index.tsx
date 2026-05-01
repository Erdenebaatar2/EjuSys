import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import heroImg from "@/assets/picture1.jpg";

interface FeatureItem {
  icon: LucideIcon;
  titleMn: string;
  titleJa: string;
  descMn: string;
  descJa: string;
  link: string;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EJU Бүртгэлийн Систем — Япон Их Сургуулийн Шалгалт" },
      {
        name: "description",
        content:
          "Монгол оюутнуудад зориулсан EJU шалгалтын онлайн бүртгэлийн систем. Шалгалт сонгож, баримтаа байршуулж, статусаа хянаарай.",
      },
      { property: "og:title", content: "EJU Бүртгэлийн Систем" },
      { property: "og:description", content: "Япон Их Сургуулийн шалгалтад онлайнаар бүртгүүл." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const { t, lang } = useLang();

  if (!loading && user) {
    return <Navigate to={role === "admin" ? "/admin/dashboard" : "/student/dashboard"} />;
  }

  const features: FeatureItem[] = [
    {
      icon: FileCheck2,
      titleMn: "EJU шалгалтын тухай мэдээлэл",
      titleJa: "EJU exam information",
      descMn: "Шалгалтын талаарх шаардлагатай мэдээллийг харах боломжтой.",
      descJa: "View essential information about the EJU exam.",
      link: "/files/EJU_Bulletin_2026.pdf",
    },
    {
      icon: ShieldCheck,
      titleMn: "Бүртгэлийн зааварчилгаа",
      titleJa: "Registration guide",
      descMn: "Бүртгэлийн алхмууд болон явцыг хянах зааврыг үзнэ.",
      descJa: "Review the registration steps and guidance.",
      link: "/registration-guide",
    },
    {
      icon: BookOpen,
      titleMn: "Мэдээ мэдээлэл",
      titleJa: "News and updates",
      descMn: "EJU-тэй холбоотой шинэ мэдээ, зарлалуудыг үзнэ.",
      descJa: "Read the latest EJU news and announcements.",
      link: "https://www.studyinjapan.go.jp/en/",
    },
  ];

  const isExternalLink = (link: string) => /^https?:\/\//i.test(link);
  const isDownloadLink = (link: string) => /\.(pdf|doc|docx|xls|xlsx|zip)$/i.test(link);

  const handleFeatureClick = (link: string) => {
    if (isExternalLink(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    if (isDownloadLink(link)) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.download = link.split("/").pop() ?? "download";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return;
    }

    window.location.assign(link);
  };

  const handleFeatureKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, link: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleFeatureClick(link);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-subtle">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-12 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>
                {lang === "mn" ? "2026 оны бүртгэл нээлттэй" : "2026 applications are open"}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-3 text-lg text-bilingual-ja text-muted-foreground">
              {lang === "mn"
                ? "Японд суралцах дараагийн алхмаа эндээс эхлүүлээрэй"
                : "Start your Japan study journey here"}
            </p>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">{t("heroSub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/register">
                  {t("getStarted")} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">{t("login")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-10 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="EJU шалгалтын бүртгэлийн зураг"
              width={1536}
              height={1024}
              className="rounded-2xl border border-border shadow-elegant"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.titleMn}
              role="link"
              tabIndex={0}
              onClick={() => handleFeatureClick(feature.link)}
              onKeyDown={(event) => handleFeatureKeyDown(event, feature.link)}
              className="shadow-card border-border cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/10"
            >
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {lang === "mn" ? feature.titleMn : feature.titleJa}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "mn" ? feature.descMn : feature.descJa}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
