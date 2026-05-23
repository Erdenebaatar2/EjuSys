import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  Hash,
  Home,
  Languages,
  Loader2,
  MapPin,
  Phone,
  School,
  UserRound,
} from "lucide-react";
import { formatDate, subjectLabel } from "@/lib/eju-format";
import { StatusBadge } from "@/components/StatusBadge";

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
  paymentStatus: string;
  photoUrl?: string | null;
  nameAlphabet?: string | null;
  nameKanji?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  countryCode?: string | null;
  address?: string | null;
  postalCode?: string | null;
  addressCode?: string | null;
  telephone?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  schoolOrOccupation?: string | null;
  targetUniversity?: string | null;
  scienceOption1?: string | null;
  scienceOption2?: string | null;
  mathCourse?: string | null;
  examLanguage?: string | null;
  jassoScholarshipApply?: boolean | null;
  examSite?: string | null;
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
    <div className="max-w-6xl space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/applications">
          <ArrowLeft className="mr-1.5 h-4 w-4" />{" "}
          {lang === "mn" ? "Бүх бүртгэл" : "All applications"}
        </Link>
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{app.applicationNumber}</code>
              <CardTitle className="mt-2 text-2xl">{app.exam?.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "mn"
                  ? "Бүртгүүлэхдээ оруулсан мэдээлэл болон шалгалтын дэлгэрэнгүй."
                  : "Registration details you submitted and exam information."}
              </p>
            </div>
            <StatusBadge status={app.paymentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title={lang === "mn" ? "Шалгалтын мэдээлэл" : "Exam information"}>
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
              value={formatDate(app.exam.examDate, lang)}
            />
            <Field icon={MapPin} label={lang === "mn" ? "Байршил" : "Location"} value={app.exam.location} />
            <Field
              icon={Hash}
              label={lang === "mn" ? "Бүртгэлийн дугаар" : "Application number"}
              value={app.applicationNumber}
            />
            <Field
              icon={MapPin}
              label={lang === "mn" ? "Шалгалтын төв" : "Exam site"}
              value={valueOrDash(app.examSite)}
            />
          </Section>

          <Section title={lang === "mn" ? "Хувийн мэдээлэл" : "Personal information"}>
            <Field
              icon={UserRound}
              label={lang === "mn" ? "Нэр (Alphabet)" : "Name alphabet"}
              value={valueOrDash(app.nameAlphabet)}
            />
            <Field
              icon={UserRound}
              label={lang === "mn" ? "Нэр (Kanji)" : "Name kanji"}
              value={valueOrDash(app.nameKanji)}
            />
            <Field icon={UserRound} label={lang === "mn" ? "Хүйс" : "Sex"} value={sexLabel(app.sex, lang)} />
            <Field
              icon={Calendar}
              label={lang === "mn" ? "Төрсөн огноо" : "Date of birth"}
              value={app.dateOfBirth ? formatDate(app.dateOfBirth, lang) : "-"}
            />
            <Field
              icon={Languages}
              label={lang === "mn" ? "Иргэншил" : "Nationality"}
              value={valueOrDash(app.nationality)}
            />
          </Section>

          <Section title={lang === "mn" ? "Холбоо барих болон хаяг" : "Contact and address"}>
            <Field icon={Phone} label={lang === "mn" ? "Утас" : "Phone"} value={valueOrDash(app.phone)} />
            <Field
              icon={Phone}
              label={lang === "mn" ? "Суурин утас" : "Telephone"}
              value={valueOrDash(app.telephone)}
            />
            <Field
              icon={Phone}
              label={lang === "mn" ? "Гар утас" : "Mobile phone"}
              value={valueOrDash(app.mobilePhone)}
            />
            <Field icon={Home} label={lang === "mn" ? "Хаяг" : "Address"} value={valueOrDash(app.address)} />
            <Field
              icon={Hash}
              label={lang === "mn" ? "Шуудангийн код" : "Postal code"}
              value={valueOrDash(app.postalCode)}
            />
            <Field
              icon={Hash}
              label={lang === "mn" ? "Хаягийн код" : "Address code"}
              value={valueOrDash(app.addressCode)}
            />
            <Field
              icon={Hash}
              label={lang === "mn" ? "Улсын код" : "Country code"}
              value={valueOrDash(app.countryCode)}
            />
            <Field
              icon={School}
              label={lang === "mn" ? "Сургууль / ажил" : "School or occupation"}
              value={valueOrDash(app.schoolOrOccupation)}
            />
            <Field
              icon={GraduationCap}
              label={lang === "mn" ? "Орохыг хүссэн сургууль" : "Target university"}
              value={valueOrDash(app.targetUniversity)}
            />
          </Section>

          <div>
            <div className="mb-2 text-sm font-semibold">
              {lang === "mn" ? "Сонгосон хичээл" : "Selected subjects"}
            </div>
            <div className="flex flex-wrap gap-2">
              {app.subjects.map((subject) => (
                <span
                  key={subject.code}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
                >
                  <code className="text-muted-foreground">{subject.code}</code>
                  <span>{lang === "mn" ? subject.nameMn : subjectLabel(subject.code, lang)}</span>
                </span>
              ))}
              {app.subjects.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
            </div>
          </div>

          <Section title={lang === "mn" ? "Шалгалтад сонгосон мэдээлэл" : "Exam choices"}>
            <Field
              icon={BookOpen}
              label={lang === "mn" ? "Science option 1" : "Science option 1"}
              value={formatEnum(app.scienceOption1)}
            />
            <Field
              icon={BookOpen}
              label={lang === "mn" ? "Science option 2" : "Science option 2"}
              value={formatEnum(app.scienceOption2)}
            />
            <Field
              icon={BookOpen}
              label={lang === "mn" ? "Математикийн курс" : "Math course"}
              value={formatEnum(app.mathCourse)}
            />
            <Field
              icon={Languages}
              label={lang === "mn" ? "Шалгалтын хэл" : "Exam language"}
              value={formatEnum(app.examLanguage)}
            />
            <Field
              icon={GraduationCap}
              label={lang === "mn" ? "JASSO тэтгэлэг" : "JASSO scholarship"}
              value={yesNo(app.jassoScholarshipApply, lang)}
            />
          </Section>

          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            {lang === "mn" ? "Илгээсэн:" : "Submitted:"} {formatDate(app.createdAt, lang)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="break-words font-medium">{value}</div>
      </div>
    </div>
  );
}

function valueOrDash(value?: string | null) {
  return value?.trim() ? value : "-";
}

function formatEnum(value?: string | null) {
  return value?.trim() ? value.replaceAll("_", " ") : "-";
}

function yesNo(value: boolean | null | undefined, lang: Lang) {
  if (value == null) return "-";
  if (lang === "mn") return value ? "Тийм" : "Үгүй";
  return value ? "Yes" : "No";
}

function sexLabel(value: string | null | undefined, lang: Lang) {
  const normalized = value?.toUpperCase();
  if (!normalized) return "-";
  if (normalized === "M" || normalized === "MALE") return lang === "mn" ? "Эр" : "Male";
  if (normalized === "F" || normalized === "FEMALE") return lang === "mn" ? "Эм" : "Female";
  return valueOrDash(value);
}
