import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/eju-format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/student/applications")({
  head: () => ({ meta: [{ title: "Миний бүртгэл | EJU" }] }),
  component: StudentApplications,
});

interface StudentApplicationSummary {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  examId: string;
  exam?: {
    name: string;
    examDate: string;
    location: string;
  } | null;
}

function StudentApplications() {
  const { lang } = useLang();
  const [apps, setApps] = useState<StudentApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<StudentApplicationSummary[]>("/api/student/applications")
      .then((data) => setApps(data ?? []))
      .catch(() => setApps([]))
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
    <div className="max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            {lang === "mn" ? "Миний бүртгэл" : "My applications"}
          </h1>
          <p className="mt-1 text-muted-foreground text-bilingual-ja">
            {lang === "mn" ? "Та илгээсэн бүх бүртгэл" : "All applications you have submitted"}
          </p>
        </div>
        <Button asChild>
          <Link to="/student/exams">
            <Plus className="mr-1.5 h-4 w-4" />{" "}
            {lang === "mn" ? "Шинэ бүртгэл" : "New application"}
          </Link>
        </Button>
      </div>

      {apps.length === 0 ? (
        <Card className="mt-6 shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p>{lang === "mn" ? "Танд бүртгэл алга" : "You have no applications yet"}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/student/exams">
                {lang === "mn" ? "Шалгалт сонгох" : "Browse exams"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {apps.map((a) => (
            <Card key={a.id} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {a.applicationNumber}
                      </code>
                      <StatusBadge status={a.status} />
                      <StatusBadge status={a.paymentStatus} />
                    </div>
                    <h3 className="mt-2 font-semibold">{a.exam?.name}</h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      {a.exam?.examDate && formatDate(a.exam.examDate, lang)} ·{" "}
                      {a.exam?.location}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/student/applications/$id" params={{ id: a.id }}>
                      {lang === "mn" ? "Харах" : "View"}{" "}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
