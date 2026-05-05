import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";
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
  session: "first" | "second";
  year: number;
  isActive: boolean;
}

function StudentExams() {
  const { lang } = useLang();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<Exam[]>("/api/student/exams")
      .then((data) => setExams(data ?? []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">
          {lang === "mn" ? "Нээлттэй шалгалтууд" : "Open exams"}
        </h1>
        <p className="mt-1 text-muted-foreground text-bilingual-ja">
          {lang === "mn"
            ? "Бүртгүүлэх боломжтой EJU шалгалтын жагсаалт"
            : "Browse the EJU exams that are currently open for application"}
        </p>
      </div>

      {exams.length === 0 ? (
        <Card className="mt-6 shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            {lang === "mn"
              ? "Одоогоор нээлттэй шалгалт байхгүй байна"
              : "There are no open exams at the moment."}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {exams.map((e) => {
            const open = isRegistrationOpen(e.registrationStart, e.registrationEnd);
            const seatsLeft = e.availableSeats;
            const fillPct = ((e.totalSeats - seatsLeft) / e.totalSeats) * 100;
            return (
              <Card key={e.id} className="shadow-card hover:shadow-elegant transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg leading-tight">{e.name}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sessionLabel(e.session, lang)} · {e.year}
                      </div>
                    </div>
                    <Badge variant={open ? "default" : "secondary"} className="shrink-0">
                      {open
                        ? lang === "mn"
                          ? "Нээлттэй"
                          : "Open"
                        : lang === "mn"
                          ? "Хаалттай"
                          : "Closed"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{formatDate(e.examDate, lang)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{e.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>
                        {lang === "mn"
                          ? `${seatsLeft} / ${e.totalSeats} суудал үлдсэн`
                          : `${seatsLeft} / ${e.totalSeats} seats remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {lang === "mn" ? "Бүртгэл дуусах:" : "Application closes:"}{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(e.registrationEnd, lang)}
                    </span>
                  </div>

                  <Button asChild className="w-full" disabled={!open}>
                    <Link to="/student/exams/$examId" params={{ examId: e.id }}>
                      {lang === "mn" ? "Дэлгэрэнгүй" : "View details"}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
