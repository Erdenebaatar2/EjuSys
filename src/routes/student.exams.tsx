import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "../contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Loader2,
  Clock,
  CalendarSearch,
} from "lucide-react";
import { formatDate, isRegistrationOpen, sessionLabel } from "@/lib/eju-format";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Шалгалтууд | EJU" }] }),
  component: StudentExams,
});

interface Exam {
  id: string;
  name: string;
  examDate: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  registrationStart: string;
  registrationEnd: string;
  session: "FIRST" | "SECOND";
  year: number;
  active: boolean;
}

function StudentExams() {
  const { lang } = useLang();
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["student", "exams"],
    queryFn: () => apiGet<Exam[]>("/api/student/exams"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/60 mb-1">
          <CalendarSearch className="h-3.5 w-3.5" />
          {lang === "mn" ? "EJU шалгалтууд" : "EJU exams"}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {lang === "mn" ? "Нээлттэй шалгалтууд" : "Open exams"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {lang === "mn"
            ? "Бүртгүүлэх боломжтой EJU шалгалтын жагсаалт"
            : "Browse the EJU exams that are currently open for application"}
        </p>
      </div>

      {exams.length === 0 ? (
        <Card className="shadow-card border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarSearch className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {lang === "mn" ? "Нээлттэй шалгалт байхгүй" : "No open exams"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "mn"
                ? "Одоогоор нээлттэй шалгалт байхгүй байна. Дараа шалгана уу."
                : "There are no open exams at the moment. Please check back later."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {exams.map((e) => {
            const open = isRegistrationOpen(e.registrationStart, e.registrationEnd);
            const seatsLeft = e.availableSeats;
            const fillPct = Math.min(
              100,
              ((e.totalSeats - seatsLeft) / e.totalSeats) * 100,
            );
            const almostFull = seatsLeft < e.totalSeats * 0.2;

            return (
              <Card
                key={e.id}
                className={`overflow-hidden shadow-card transition-all duration-200 hover:shadow-elegant hover:-translate-y-0.5 ${
                  !open ? "opacity-75" : ""
                }`}
              >
                {/* Top accent line */}
                <div
                  className={`h-1 w-full ${open ? "bg-gradient-to-r from-primary to-[oklch(0.55_0.18_280)]" : "bg-muted"}`}
                />

                <CardContent className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg leading-tight text-foreground">
                        {e.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sessionLabel(e.session.toLowerCase() as "first" | "second", lang)} ·{" "}
                        {e.year}
                      </p>
                    </div>
                    <Badge
                      variant={open ? "default" : "secondary"}
                      className={`shrink-0 text-xs font-semibold ${
                        open
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : ""
                      }`}
                    >
                      {open
                        ? lang === "mn" ? "✓ Нээлттэй" : "✓ Open"
                        : lang === "mn" ? "Хаалттай" : "Closed"}
                    </Badge>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span>{formatDate(e.examDate, lang)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{e.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <span>
                        {lang === "mn" ? "Бүртгэл:" : "Registration:"}{" "}
                        {formatDate(e.registrationStart, lang)} —{" "}
                        {formatDate(e.registrationEnd, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Seats progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {lang === "mn" ? "Суудал" : "Seats"}
                      </span>
                      <span
                        className={`font-semibold ${
                          almostFull ? "text-rose-600" : "text-foreground"
                        }`}
                      >
                        {seatsLeft} / {e.totalSeats}{" "}
                        {lang === "mn" ? "үлдсэн" : "remaining"}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          almostFull
                            ? "bg-rose-500"
                            : fillPct > 60
                            ? "bg-amber-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-border" />

                  {/* Register button — separated and prominent */}
                  <div className="space-y-2">
                    <Button
                      asChild
                      className={`w-full font-semibold transition-all ${
                        open
                          ? "bg-gradient-to-r from-primary to-[oklch(0.45_0.16_280)] hover:opacity-90 shadow-soft"
                          : ""
                      }`}
                      disabled={!open}
                    >
                      <Link to="/student/application">
                        {lang === "mn" ? "Шалгалтанд бүртгүүлэх" : "Register for this exam"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {open && (
                      <p className="text-center text-xs text-muted-foreground">
                        {lang === "mn"
                          ? "Бүртгэл дуусах хугацаа: "
                          : "Registration closes: "}
                        <span className="font-medium text-foreground">
                          {formatDate(e.registrationEnd, lang)}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
