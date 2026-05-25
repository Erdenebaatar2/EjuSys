import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileImage,
  Hash,
  Home,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { formatDate, sessionLabel, statusLabel, subjectLabel } from "@/lib/eju-format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/student/applications/$id")({
  head: () => ({ meta: [{ title: "Applicant form | EJU" }] }),
  component: AppDetail,
});

interface ProfileInfo {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  passportNumber?: string | null;
}

interface SelectedSubject {
  code: string;
  nameMn: string;
  nameJa: string;
  category: string;
}

interface ApplicationDetailRecord {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  photoUrl?: string | null;
  photoPath?: string | null;
  nameAlphabet?: string | null;
  nameKanji?: string | null;
  sex?: "MALE" | "FEMALE" | null;
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
  subjectJapanese?: boolean;
  subjectScience?: boolean;
  subjectJapanAndWorld?: boolean;
  subjectMathematics?: boolean;
  scienceOption1?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | null;
  scienceOption2?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | null;
  examLanguage?: "JAPANESE" | "ENGLISH" | null;
  jassoScholarshipApply?: boolean;
  examSite?: string | null;
  createdAt: string;
  exam?: {
    name: string;
    examDate: string;
    location: string;
    session: "first" | "second";
    year: number;
  };
  profile?: ProfileInfo | null;
  subjects: SelectedSubject[];
}

function AppDetail() {
  const { id } = Route.useParams();
  const { lang } = useLang();
  const [app, setApp] = useState<ApplicationDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<ApplicationDetailRecord>(`/api/student/application/${id}`)
      .then((data) => setApp(data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
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

  const profile = app.profile;
  const confirmed = app.paymentStatus === "paid" || app.status === "confirmed";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student/applications">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {lang === "mn" ? "Бүх бүртгэл" : "All applications"}
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {lang === "mn" ? "PDF / Хэвлэх" : "PDF / Print"}
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadApplication(app, lang)}>
            <Download className="h-4 w-4" />
            {lang === "mn" ? "Файл татах" : "Download"}
          </Button>
        </div>
      </div>

      {!confirmed && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 print:hidden">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {lang === "mn"
              ? "Төлбөр төлөгдөөгүй тул applicant form баталгаажаагүй байна. Төлбөр PAID болсон үед бүртгэл CONFIRMED болно."
              : "This applicant form is not confirmed until payment is PAID."}
          </p>
        </div>
      )}

      <Card className="shadow-card print:shadow-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {lang === "mn" ? "Applicant form" : "Applicant form"}
              </p>
              <CardTitle className="mt-1 text-2xl">{app.exam?.name ?? "EJU"}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {app.applicationNumber}
                </code>
                <span className="text-xs text-muted-foreground">
                  {lang === "mn" ? "Бүртгэсэн:" : "Registered:"} {formatDate(app.createdAt, lang)}
                </span>
              </div>
            </div>
            <StatusBadge status={confirmed ? "confirmed" : (app.status ?? app.paymentStatus)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApplicantForm app={app} lang={lang} />
          <div className="space-y-6 print:hidden">
          <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                {applicantPhoto(app) ? (
                  <img
                    src={mediaUrl(applicantPhoto(app))}
                    alt="Applicant"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <FileImage className="h-8 w-8" />
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {lang === "mn" ? "Цээж зураг" : "Applicant photo"}
              </p>
            </div>

            <div className="space-y-6">
              <Section title={lang === "mn" ? "Хувийн мэдээлэл" : "Personal information"}>
                <Field
                  icon={UserRound}
                  label={lang === "mn" ? "Овог" : "Last name"}
                  value={valueOrDash(profile?.lastName)}
                />
                <Field
                  icon={UserRound}
                  label={lang === "mn" ? "Нэр" : "First name"}
                  value={valueOrDash(profile?.firstName)}
                />
                <Field
                  icon={Mail}
                  label={lang === "mn" ? "Имэйл" : "Email"}
                  value={valueOrDash(profile?.email)}
                />
                <Field
                  icon={Phone}
                  label={lang === "mn" ? "Утас" : "Phone"}
                  value={valueOrDash(profile?.phone)}
                />
                <Field
                  icon={Home}
                  label={lang === "mn" ? "Оршин суугаа хаяг" : "Residential address"}
                  value={valueOrDash(profile?.address)}
                />
                <Field
                  icon={ShieldCheck}
                  label={lang === "mn" ? "Бичиг баримтын дугаар" : "Document number"}
                  value={valueOrDash(profile?.passportNumber)}
                />
              </Section>

              <Section title={lang === "mn" ? "Шалгалтын мэдээлэл" : "Exam information"}>
                <Field
                  icon={Calendar}
                  label={lang === "mn" ? "Шалгалтын огноо" : "Exam date"}
                  value={app.exam?.examDate ? formatDate(app.exam.examDate, lang) : "-"}
                />
                <Field
                  icon={MapPin}
                  label={lang === "mn" ? "Байршил" : "Location"}
                  value={valueOrDash(app.exam?.location)}
                />
                <Field
                  icon={Hash}
                  label={lang === "mn" ? "Он / улирал" : "Year / session"}
                  value={
                    app.exam ? `${app.exam.year} / ${sessionLabel(app.exam.session, lang)}` : "-"
                  }
                />
                <Field
                  icon={Hash}
                  label={lang === "mn" ? "Application code" : "Application code"}
                  value={app.applicationNumber}
                />
                <Field
                  icon={BookOpen}
                  label={lang === "mn" ? "Төлбөрийн төлөв" : "Payment status"}
                  value={statusLabel(app.paymentStatus, lang)}
                />
                <Field
                  icon={BookOpen}
                  label={lang === "mn" ? "Бүртгэлийн төлөв" : "Application status"}
                  value={statusLabel(confirmed ? "confirmed" : app.status, lang)}
                />
              </Section>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">
              {lang === "mn" ? "Сонгосон хичээлүүд" : "Selected subjects"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {app.subjects.map((subject) => (
                <span
                  key={`${subject.code}-${subject.nameJa}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
                >
                  <code className="text-muted-foreground">{subject.code}</code>
                  <span>{subjectLabel(subject.code, lang)}</span>
                </span>
              ))}
              {app.subjects.length === 0 && (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
          </div>
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
      <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function ApplicantForm({ app, lang }: { app: ApplicationDetailRecord; lang: Lang }) {
  const profile = app.profile;
  const year = String(app.exam?.year ?? new Date(app.createdAt).getFullYear()).slice(-2);
  const sessionNo = app.exam?.session === "second" ? "2" : "1";
  const photo = applicantPhoto(app);
  const name = applicantName(app);
  const address = app.address || profile?.address || "";
  const phone = app.telephone || app.phone || profile?.phone || "";
  const mobile = app.mobilePhone || profile?.phone || "";

  return (
    <section className="overflow-hidden rounded-md border border-slate-400 bg-[#eef6ff] p-4 text-slate-950 print:rounded-none print:border-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-[900px] bg-[#eef6ff] p-4 print:bg-white">
        <div className="grid grid-cols-[90px_1fr_140px] items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center border border-slate-700 bg-white text-3xl font-serif">
            A
          </div>
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
              <span>20</span>
              <BoxLetters value={year} count={2} />
              <span>年 第</span>
              <BoxLetters value={sessionNo} count={1} />
              <span>回 日本留学試験 (EJU)</span>
            </div>
            <h1 className="text-3xl font-bold tracking-[0.35em]">受 験 願 書</h1>
            <p className="mt-1 text-xl font-semibold">Application Form</p>
          </div>
          <div className="aspect-[3/4] border-2 border-slate-800 bg-white p-2 text-center">
            {photo ? (
              <img src={mediaUrl(photo)} alt="Applicant" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-sm">
                <span>顔 写 真</span>
                <span className="mt-2 font-semibold">Photo</span>
                <span className="mt-2">(4cm x 3cm)</span>
              </div>
            )}
          </div>
        </div>

        <table className="mt-4 w-full border-collapse bg-white text-sm [&_td]:border [&_td]:border-slate-700 [&_td]:p-2">
          <tbody>
            <tr>
              <LabelCell label="受験番号" sub="Examination Registration No." />
              <td colSpan={4}>
                <BoxLetters value={app.applicationNumber.replace(/[^A-Za-z0-9]/g, "")} count={16} />
              </td>
            </tr>
            <tr>
              <LabelCell label="受験科目" sub="Subject(s)" rowSpan={2} />
              <ChoiceCell title="1. 日本語" sub="Japanese as a Foreign Language" checked={app.subjectJapanese} />
              <ChoiceCell title="2-1. 理科" sub="Science" checked={app.subjectScience} />
              <ChoiceCell title="2-2. 総合科目" sub="Japan and the World" checked={app.subjectJapanAndWorld} />
              <ChoiceCell title="3. 数学" sub="Mathematics" checked={app.subjectMathematics} />
            </tr>
            <tr>
              <td className="text-center text-xs" colSpan={4}>
                {scienceText(app)}
              </td>
            </tr>
            <tr>
              <LabelCell label="出題言語" sub="Examination Language" />
              <td colSpan={2} className="text-center">
                日本語 / in Japanese <CheckMark checked={app.examLanguage === "JAPANESE"} />
              </td>
              <td colSpan={2} className="text-center">
                英語 / in English <CheckMark checked={app.examLanguage === "ENGLISH"} />
              </td>
            </tr>
            <tr>
              <LabelCell label="氏名" sub="Name" />
              <td colSpan={4}>
                <BoxLetters value={name.toUpperCase()} count={34} />
              </td>
            </tr>
            <tr>
              <LabelCell label="漢字" sub="Chinese Characters" />
              <td colSpan={2}>{valueOrDash(app.nameKanji)}</td>
              <td className="text-center">男 Male <CheckMark checked={app.sex === "MALE"} /></td>
              <td className="text-center">女 Female <CheckMark checked={app.sex === "FEMALE"} /></td>
            </tr>
            <tr>
              <LabelCell label="生年月日" sub="Date of Birth (yyyy/mm/dd)" />
              <td colSpan={2}>{formatFormDate(app.dateOfBirth)}</td>
              <LabelCell label="国・地域コード" sub="Country/Region Code" />
              <td>{valueOrDash(app.countryCode)}</td>
            </tr>
            <tr>
              <LabelCell label="国籍" sub="Nationality" />
              <td colSpan={4}>{valueOrDash(app.nationality)}</td>
            </tr>
            <tr>
              <LabelCell label="住所" sub="Address" />
              <td colSpan={4}>{valueOrDash(address)}</td>
            </tr>
            <tr>
              <LabelCell label="郵便番号" sub="Postal Code" />
              <td>{valueOrDash(app.postalCode)}</td>
              <LabelCell label="住所コード" sub="Address Code" />
              <td colSpan={2}>{valueOrDash(app.addressCode)}</td>
            </tr>
            <tr>
              <LabelCell label="電話番号" sub="Telephone Number" />
              <td colSpan={4}>{valueOrDash(phone)}</td>
            </tr>
            <tr>
              <LabelCell label="携帯電話番号" sub="Mobile Phone Number" />
              <td colSpan={4}>{valueOrDash(mobile)}</td>
            </tr>
            <tr>
              <LabelCell label="Eメールアドレス" sub="E-mail Address" />
              <td colSpan={4}>{valueOrDash(profile?.email)}</td>
            </tr>
            <tr>
              <LabelCell label="在籍学校名と学年または職業" sub="Name of School and Grade or Occupation" />
              <td colSpan={4}>{valueOrDash(app.schoolOrOccupation)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-xs leading-5">
          {lang === "mn"
            ? "Энэ маягт бүртгүүлсэн мэдээллээр автоматаар бөглөгдөнө. PDF болгох бол PDF / Хэвлэх товчийг дарна уу."
            : "This form is automatically filled from the submitted application. Use PDF / Print to save it as PDF."}
        </div>
      </div>
    </section>
  );
}

function LabelCell({ label, sub, rowSpan }: { label: string; sub: string; rowSpan?: number }) {
  return (
    <td rowSpan={rowSpan} className="w-[210px] bg-[#cfe3f7] align-middle font-semibold">
      <div>{label}</div>
      <div className="text-xs font-normal">{sub}</div>
    </td>
  );
}

function ChoiceCell({ title, sub, checked }: { title: string; sub: string; checked?: boolean }) {
  return (
    <td className="w-1/4 bg-[#d9ebfb] text-center align-top">
      <div className="font-semibold">{title}</div>
      <div className="text-xs">{sub}</div>
      <CheckMark checked={checked} />
    </td>
  );
}

function CheckMark({ checked }: { checked?: boolean }) {
  return <span className="ml-2 inline-block text-xl leading-none">{checked ? "○" : "◌"}</span>;
}

function BoxLetters({ value, count }: { value: string; count: number }) {
  const chars = value.replace(/\s+/g, " ").slice(0, count).split("");
  return (
    <span className="inline-flex align-middle">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="flex h-8 w-7 items-center justify-center border-y border-r border-slate-700 bg-white first:border-l"
        >
          {chars[index] ?? ""}
        </span>
      ))}
    </span>
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

function applicantPhoto(app: ApplicationDetailRecord) {
  return app.photoUrl || app.photoPath || null;
}

function applicantName(app: ApplicationDetailRecord) {
  const profile = app.profile;
  return (
    app.nameAlphabet ||
    [profile?.lastName, profile?.firstName].filter(Boolean).join(" ").trim() ||
    "-"
  );
}

function scienceText(app: ApplicationDetailRecord) {
  const selected = [app.scienceOption1, app.scienceOption2]
    .filter(Boolean)
    .map((option) => subjectLabel(optionCode(option), "en"));
  return selected.length > 0 ? `Science choices: ${selected.join(", ")}` : "-";
}

function optionCode(option: ApplicationDetailRecord["scienceOption1"]) {
  if (option === "PHYSICS") return "PHY";
  if (option === "CHEMISTRY") return "CHEM";
  if (option === "BIOLOGY") return "BIO";
  return "SCI";
}

function formatFormDate(value?: string | null) {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[1]} / ${match[2]} / ${match[3]}`;
}

function downloadApplication(app: ApplicationDetailRecord, lang: Lang) {
  const profile = app.profile;
  const rows = [
    [lang === "mn" ? "Application code" : "Application code", app.applicationNumber],
    [lang === "mn" ? "Name" : "Name", applicantName(app)],
    [lang === "mn" ? "Овог" : "Last name", valueOrDash(profile?.lastName)],
    [lang === "mn" ? "Нэр" : "First name", valueOrDash(profile?.firstName)],
    [lang === "mn" ? "Имэйл" : "Email", valueOrDash(profile?.email)],
    [lang === "mn" ? "Утас" : "Phone", valueOrDash(profile?.phone)],
    [lang === "mn" ? "Оршин суугаа хаяг" : "Residential address", valueOrDash(profile?.address)],
    [
      lang === "mn" ? "Бичиг баримтын дугаар" : "Document number",
      valueOrDash(profile?.passportNumber),
    ],
    [lang === "mn" ? "Шалгалт" : "Exam", valueOrDash(app.exam?.name)],
    [
      lang === "mn" ? "Шалгалтын огноо" : "Exam date",
      app.exam?.examDate ? formatDate(app.exam.examDate, lang) : "-",
    ],
    [lang === "mn" ? "Байршил" : "Location", valueOrDash(app.exam?.location)],
    [
      lang === "mn" ? "Сонгосон хичээлүүд" : "Selected subjects",
      app.subjects.map((subject) => subjectLabel(subject.code, lang)).join(", ") || "-",
    ],
    [lang === "mn" ? "Exam language" : "Exam language", app.examLanguage ?? "-"],
    [lang === "mn" ? "Төлбөрийн төлөв" : "Payment status", statusLabel(app.paymentStatus, lang)],
    [lang === "mn" ? "Бүртгэсэн огноо" : "Registered at", formatDate(app.createdAt, lang)],
  ];
  const photoPath = applicantPhoto(app);
  const photo = photoPath
    ? `<img src="${escapeHtml(mediaUrl(photoPath))}" alt="Applicant photo" class="photo" />`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    app.applicationNumber,
  )}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;padding:32px;color:#111}h1{font-size:22px;margin:0 0 16px}.layout{display:grid;grid-template-columns:140px 1fr;gap:24px;align-items:start}.photo{width:140px;aspect-ratio:3/4;object-fit:cover;border:1px solid #ddd;border-radius:8px}table{border-collapse:collapse;width:100%;max-width:820px}td{border:1px solid #ddd;padding:10px;vertical-align:top}td:first-child{font-weight:700;width:220px;background:#f7f7f7}@media print{body{padding:0}.layout{grid-template-columns:130px 1fr}}</style></head><body><h1>EJU ${
    lang === "mn" ? "Applicant form" : "Applicant form"
  }</h1><div class="layout"><div>${photo}</div><table>${rows
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(String(value ?? "-"))}</td></tr>`,
    )
    .join("")}</table></div></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${app.applicationNumber || "eju-application"}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const normalized = path.startsWith("/uploads/")
    ? path
    : path.startsWith("uploads/")
      ? `/${path}`
      : `/uploads/${path}`;
  return `${mediaBaseUrl()}${normalized}`;
}

function mediaBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.port && window.location.port !== "8080") {
    return "http://localhost:8080";
  }
  return "";
}
