import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
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
  nameMn: string;
  nameJa: string;
  category: string;
}

interface ApplicationDetailRecord {
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  rejectionReason?: string | null;
  phone?: string | null;
  address?: string | null;
  targetUniversity?: string | null;
  createdAt: string;
  exam: {
    name: string;
    examDate: string;
    location: string;
    session: "first" | "second";
    year: number;
  };
  subjects: SelectedSubject[];
}

function AppDetail() {
  const { id } = Route.useParams();
  const { lang } = useLang();
  const [app, setApp] = useState<ApplicationDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<ApplicationDetailRecord>(`/api/student/applications/${id}`)
      .then((data) => setApp(data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  }, [id]);

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
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{app.applicationNumber}</code>
              <CardTitle className="mt-2 text-2xl">{app.exam?.name}</CardTitle>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={app.status} />
              <StatusBadge status={app.paymentStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {app.status === "rejected" && app.rejectionReason && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>
                  {lang === "mn" ? "Татгалзсан шалтгаан:" : "Reason for rejection:"}
                </strong>{" "}
                {app.rejectionReason}
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
              value={formatDate(app.exam.examDate, lang)}
            />
            <Field
              icon={MapPin}
              label={lang === "mn" ? "Байршил" : "Location"}
              value={app.exam.location}
            />
            <Field
              icon={Phone}
              label={lang === "mn" ? "Утас" : "Phone"}
              value={app.phone || "—"}
            />
            <Field
              icon={Home}
              label={lang === "mn" ? "Хаяг" : "Address"}
              value={app.address || "—"}
            />
            {app.targetUniversity && (
              <Field
                icon={GraduationCap}
                label={lang === "mn" ? "Очих их сургууль" : "Target university"}
                value={app.targetUniversity}
              />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">
              {lang === "mn" ? "Сонгосон хичээл" : "Selected subjects"}
            </div>
            <div className="flex flex-wrap gap-2">
              {app.subjects.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
                >
                  <code className="text-muted-foreground">{s.code}</code>
                  <span>{lang === "mn" ? s.nameMn : subjectLabel(s.code, lang)}</span>
                </span>
              ))}
              {app.subjects.length === 0 && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            {lang === "mn" ? "Илгээсэн:" : "Submitted:"} {formatDate(app.createdAt, lang)}
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
