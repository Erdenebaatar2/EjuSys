import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowLeft, Loader2, Info } from "lucide-react";
import { formatDate, isRegistrationOpen, sessionLabel } from "@/lib/eju-format";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/student/exams/$examId")({
  head: () => ({ meta: [{ title: "Шалгалтын дэлгэрэнгүй | EJU" }] }),
  component: ExamDetail,
});

interface ExamDetailRecord {
  id: string;
  name: string;
  exam_date: string;
  location: string;
  registration_start: string;
  registration_end: string;
  available_seats: number;
  total_seats: number;
  session: "first" | "second";
  year: number;
  description?: string | null;
}

interface ExistingApplication {
  id: string;
  application_number: string;
  status: string;
}

function ExamDetail() {
  const { examId } = Route.useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetailRecord | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", examId).maybeSingle();
      setExam(e);

      if (user) {
        const { data: app } = await supabase
          .from("applications")
          .select("id, application_number, status")
          .eq("user_id", user.id)
          .eq("exam_id", examId)
          .maybeSingle();
        setExistingApp(app);
      }
      setLoading(false);
    })();
  }, [examId, user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-2xl">
        <p className="text-muted-foreground">
          {lang === "mn" ? "Шалгалт олдсонгүй" : "Exam not found"}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/student/exams">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {lang === "mn" ? "Буцах" : "Back"}
          </Link>
        </Button>
      </div>
    );
  }

  const open = isRegistrationOpen(exam.registration_start, exam.registration_end);
  const canApply = open && exam.available_seats > 0 && !existingApp;

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/student/exams">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {lang === "mn" ? "Шалгалтууд" : "All exams"}
        </Link>
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <div className="text-xs text-muted-foreground">
            {sessionLabel(exam.session, lang)} · {exam.year}
          </div>
          <CardTitle className="text-2xl">{exam.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
              value={formatDate(exam.exam_date, lang)}
            />
            <Field
              icon={MapPin}
              label={lang === "mn" ? "Байршил" : "Location"}
              value={exam.location}
            />
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Бүртгэл эхлэх" : "Registration opens"}
              value={formatDate(exam.registration_start, lang)}
            />
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Бүртгэл дуусах" : "Registration closes"}
              value={formatDate(exam.registration_end, lang)}
            />
            <Field
              icon={Users}
              label={lang === "mn" ? "Үлдсэн суудал" : "Seats left"}
              value={`${exam.available_seats} / ${exam.total_seats}`}
            />
          </div>

          {exam.description && (
            <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
              {exam.description}
            </div>
          )}

          {existingApp ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {lang === "mn"
                  ? `Та энэ шалгалтад аль хэдийн бүртгүүлсэн (${existingApp.application_number}).`
                  : `You have already applied for this exam (${existingApp.application_number}).`}
                <Button asChild variant="link" size="sm" className="px-2 h-auto">
                  <Link to="/student/applications/$id" params={{ id: existingApp.id }}>
                    {lang === "mn" ? "Харах" : "View"}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : !open ? (
            <Alert variant="destructive">
              <AlertDescription>
                {lang === "mn"
                  ? "Бүртгэлийн хугацаа дууссан"
                  : "The registration period has ended."}
              </AlertDescription>
            </Alert>
          ) : exam.available_seats <= 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                {lang === "mn" ? "Суудал дууссан" : "No seats remain for this exam."}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            disabled={!canApply}
            onClick={() =>
              void navigate({ to: "/student/exams/$examId/apply", params: { examId } })
            }
          >
            {lang === "mn" ? "Бүртгүүлэх" : "Apply now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border p-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
