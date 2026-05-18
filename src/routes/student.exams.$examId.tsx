import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
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

interface ExistingApplication {
  id: string;
  applicationNumber: string;
  status: string;
}

interface ExamDetailRecord {
  id: string;
  name: string;
  examDate: string;
  location: string;
  registrationStart: string;
  registrationEnd: string;
  availableSeats: number;
  totalSeats: number;
  session: "first" | "second";
  year: number;
  description?: string | null;
  existingApplication?: ExistingApplication | null;
}

function ExamDetail() {
  const { examId } = Route.useParams();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<ExamDetailRecord>(`/api/student/exams/${examId}`)
      .then((data) => setExam(data))
      .catch(() => setExam(null))
      .finally(() => setLoading(false));
  }, [examId]);

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

  const open = isRegistrationOpen(exam.registrationStart, exam.registrationEnd);
  const canApply = open && exam.availableSeats > 0 && !exam.existingApplication;

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
              value={formatDate(exam.examDate, lang)}
            />
            <Field
              icon={MapPin}
              label={lang === "mn" ? "Байршил" : "Location"}
              value={exam.location}
            />
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Бүртгэл эхлэх" : "Registration opens"}
              value={formatDate(exam.registrationStart, lang)}
            />
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Бүртгэл дуусах" : "Registration closes"}
              value={formatDate(exam.registrationEnd, lang)}
            />
            <Field
              icon={Users}
              label={lang === "mn" ? "Үлдсэн суудал" : "Seats left"}
              value={`${exam.availableSeats} / ${exam.totalSeats}`}
            />
          </div>

          {exam.description && (
            <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
              {exam.description}
            </div>
          )}

          {exam.existingApplication ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {lang === "mn"
                  ? `Та энэ шалгалтад аль хэдийн бүртгүүлсэн (${exam.existingApplication.applicationNumber}).`
                  : `You have already applied for this exam (${exam.existingApplication.applicationNumber}).`}
                <Button asChild variant="link" size="sm" className="px-2 h-auto">
                  <Link
                    to="/student/applications/$id"
                    params={{ id: exam.existingApplication.id }}
                  >
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
          ) : exam.availableSeats <= 0 ? (
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
