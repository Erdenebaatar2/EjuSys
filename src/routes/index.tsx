import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-eju.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EJU Бүртгэлийн Систем — Япон Их Сургуулийн Шалгалт" },
      { name: "description", content: "Монгол оюутнуудад зориулсан EJU шалгалтын онлайн бүртгэлийн систем. Шалгалт сонгож, баримтаа байршуулж, статусаа хянаарай." },
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-subtle">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-12 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{lang === "mn" ? "2026 оны бүртгэл нээлттэй" : "2026年度 出願受付中"}</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-3 text-lg text-bilingual-ja text-muted-foreground">
              日本留学への第一歩
            </p>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">
              {t("heroSub")}
            </p>
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
              alt="EJU Японы их сургуулийн оролт"
              width={1536}
              height={1024}
              className="rounded-2xl border border-border shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              titleMn: "Шалгалт сонгох",
              titleJa: "試験を選ぶ",
              descMn: "Нээлттэй EJU шалгалтуудыг харж, өөрт тохирохыг сонгоорой.",
            },
            {
              icon: FileCheck2,
              titleMn: "Баримт байршуулах",
              titleJa: "書類提出",
              descMn: "Паспорт, цээж зураг, шаардлагатай мэдээллээ цахимаар илгээнэ.",
            },
            {
              icon: ShieldCheck,
              titleMn: "Статус хянах",
              titleJa: "状況確認",
              descMn: "Бүртгэлийн төлөв, зөвшөөрсөн эсэхийг бодит цагт харна.",
            },
          ].map((f, i) => (
            <Card key={i} className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.titleMn}</h3>
                <p className="text-sm text-bilingual-ja text-muted-foreground">{f.titleJa}</p>
                <p className="mt-2 text-sm text-muted-foreground">{f.descMn}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
