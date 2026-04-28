import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calendar, MapPin, Phone, Home, GraduationCap } from "lucide-react";
import { formatDate, subjectLabel } from "@/lib/eju-format";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/student/applications/$id")({
  head: () => ({ meta: [{ title: "Бүртгэлийн дэлгэрэнгүй | EJU" }] }),
  component: AppDetail,
});

interface SelectedSubject {
  code: string;
  name_mn: string;
  name_ja: string;
  category: string;
}

interface ApplicationDetailRecord {
  application_number: string;
  status: string;
  payment_status: string;
  rejection_reason?: string | null;
  phone?: string | null;
  address?: string | null;
  target_university?: string | null;
  created_at: string;
  exams: {
    name: string;
    exam_date: string;
    location: string;
    session: "first" | "second";
    year: number;
  };
}

function AppDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const [app, setApp] = useState<ApplicationDetailRecord | null>(null);
  const [subjects, setSubjects] = useState<SelectedSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const [appRes, subRes] = await Promise.all([
        supabase
          .from("applications")
          .select("*, exams(name, exam_date, location, session, year)")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("application_subjects")
          .select("subjects(code, name_mn, name_ja, category)")
          .eq("application_id", id),
      ]);
      setApp(appRes.data);
      setSubjects(
        (subRes.data ?? [])
          .map((r) => r.subjects)
          .filter((subject): subject is SelectedSubject => Boolean(subject)),
      );
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!app) {
    return (
      <div>
        <p className="text-muted-foreground">
          {lang === "mn" ? "Бүртгэл олдсонгүй" : "Application not found"}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/student/applications">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {lang === "mn" ? "Буцах" : "Back"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/applications">
          <ArrowLeft className="mr-1.5 h-4 w-4" />{" "}
          {lang === "mn" ? "Бүх бүртгэл" : "All applications"}
        </Link>
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{app.application_number}</code>
              <CardTitle className="mt-2 text-2xl">{app.exams?.name}</CardTitle>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={app.status} />
              <StatusBadge status={app.payment_status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {app.status === "rejected" && app.rejection_reason && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>{lang === "mn" ? "Татгалзсан шалтгаан:" : "Reason for rejection:"}</strong>{" "}
                {app.rejection_reason}
              </AlertDescription>
            </Alert>
          )}
          {app.status === "approved" && (
            <Alert className="border-success/30 bg-success/10">
              <AlertDescription className="text-success">
                {lang === "mn"
                  ? "Таны бүртгэл зөвшөөрөгдсөн!"
                  : "Your application has been approved!"}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
              value={formatDate(app.exams.exam_date, lang)}
            />
            <Field
              icon={MapPin}
              label={lang === "mn" ? "Байршил" : "Location"}
              value={app.exams.location}
            />
            <Field icon={Phone} label={lang === "mn" ? "Утас" : "Phone"} value={app.phone || "—"} />
            <Field
              icon={Home}
              label={lang === "mn" ? "Хаяг" : "Address"}
              value={app.address || "—"}
            />
            {app.target_university && (
              <Field
                icon={GraduationCap}
                label={lang === "mn" ? "Очих их сургууль" : "Target university"}
                value={app.target_university}
              />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">
              {lang === "mn" ? "Сонгосон хичээл" : "Selected subjects"}
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
                >
                  <code className="text-muted-foreground">{s.code}</code>
                  <span>{lang === "mn" ? s.name_mn : subjectLabel(s.code, lang)}</span>
                </span>
              ))}
              {subjects.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            {lang === "mn" ? "Илгээсэн:" : "Submitted:"} {formatDate(app.created_at, lang)}
          </div>
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
