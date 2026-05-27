import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  StudentEmptyState,
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, sessionLabel } from "@/lib/eju-format";
import type { Lang } from "@/lib/i18n";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Plus,
  ReceiptText,
} from "lucide-react";

export const Route = createFileRoute("/student/applications")({
  head: () => ({ meta: [{ title: "Миний бүртгэлүүд | EJU" }] }),
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
    year?: number | null;
    session?: string | null;
    examDate: string;
    location: string;
  } | null;
}

function StudentApplications() {
  const { lang }: { lang: Lang } = useLang();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["student", "applications"],
    queryFn: () => apiGet<StudentApplicationSummary[]>("/api/student/application/all").catch(() => []),
  });

  if (pathname !== "/student/applications") {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const latestApplication = applications[0];
  const paidCount = applications.filter((app) => app.paymentStatus === "paid").length;
  const pendingPaymentCount = applications.filter((app) => app.paymentStatus !== "paid").length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={FileText}
        eyebrow={lang === "mn" ? "Оюутны бүртгэл" : "Student applications"}
        title={lang === "mn" ? "Миний бүртгэлүүд" : "My applications"}
        description={
          lang === "mn"
            ? "Илгээсэн EJU бүртгэл болон төлбөрийн төлөвөө эндээс харна."
            : "Review your submitted EJU applications and payment state."
        }
        actions={
          <Button asChild>
            <Link to="/student/exams">
              <Plus className="h-4 w-4" />
              {lang === "mn" ? "Шинэ бүртгэл" : "New application"}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StudentMetricCard
          icon={ClipboardList}
          label={lang === "mn" ? "Нийт бүртгэл" : "Applications"}
          value={applications.length}
          helper={lang === "mn" ? "Илгээсэн бүртгэлүүд" : "Submitted records"}
          tone="blue"
        />
        <StudentMetricCard
          icon={CreditCard}
          label={lang === "mn" ? "Төлбөр төлөгдсөн" : "Paid"}
          value={paidCount}
          helper={
            lang === "mn"
              ? `Төлөгдөөгүй: ${pendingPaymentCount}`
              : `Pending payment: ${pendingPaymentCount}`
          }
          tone={pendingPaymentCount > 0 ? "teal" : "emerald"}
        />
        <StudentMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Сүүлийн шалгалт" : "Latest exam"}
          value={latestApplication?.exam?.examDate ? formatDate(latestApplication.exam.examDate, lang) : "-"}
          helper={
            latestApplication?.exam?.location ??
            (lang === "mn" ? "Байршил тодорхойгүй" : "No location yet")
          }
          tone="violet"
        />
      </div>

      {applications.length === 0 ? (
        <StudentPanel>
          <StudentEmptyState>
            <div className="mx-auto max-w-md space-y-3">
              <p className="font-medium text-foreground">
                {lang === "mn" ? "Танд бүртгэл алга" : "You have no application yet"}
              </p>
              <p>
                {lang === "mn"
                  ? "Нээлттэй шалгалт сонгоод бүртгэлийн маягтаа эхлүүлнэ үү."
                  : "Choose an open exam and start your application form."}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/student/exams">
                  {lang === "mn" ? "Шалгалт сонгох" : "Choose exam"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </StudentEmptyState>
        </StudentPanel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <StudentPanel
            title={lang === "mn" ? "Миний бүртгэлүүд" : "My applications"}
            description={
              lang === "mn"
                ? "Шалгалт тус бүрийн бүртгэл, дугаар, төлбөрийн төлөв."
                : "Exam details, application numbers, and payment summaries."
            }
          >
            <div className="space-y-4">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} lang={lang} />
              ))}
            </div>
          </StudentPanel>

          <StudentPanel
            title={lang === "mn" ? "Төлөвийн хураангуй" : "Status summary"}
            description={
              lang === "mn"
                ? "Сүүлийн бүртгэл болон төлбөрийн мэдээллийг хурдан шалгана."
                : "Quickly confirm the latest application and payment state."
            }
          >
            <div className="space-y-3">
              <SummaryRow
                label={lang === "mn" ? "Сүүлийн бүртгэлийн дугаар" : "Latest application"}
                value={latestApplication?.applicationNumber ?? "-"}
                mono
              />
              <SummaryRow label={lang === "mn" ? "Нийт бүртгэл" : "Applications"} value={applications.length} />
              <SummaryRow label={lang === "mn" ? "Төлөгдсөн" : "Paid"} value={paidCount} />

              <div className="space-y-2 pt-2">
                {latestApplication?.paymentStatus !== "paid" ? (
                  <Button asChild className="w-full justify-between">
                    <Link to="/student/payment/$id" params={{ id: latestApplication.id }}>
                      {lang === "mn" ? "Төлбөр төлөх" : "Pay now"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                {latestApplication ? (
                  <Button asChild className="w-full justify-between">
                    <Link to="/student/applications/$id" params={{ id: latestApplication.id }}>
                      {lang === "mn" ? "Applicant form харах" : "View applicant form"}
                      <Download className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/student/exams">
                    {lang === "mn" ? "Шалгалтууд" : "Exam information"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </StudentPanel>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  lang,
}: {
  application: StudentApplicationSummary;
  lang: Lang;
}) {
  const exam = application.exam;
  const session = exam?.session ? formatSession(exam.session, lang) : null;

  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {application.applicationNumber}
            </Badge>
            <StatusBadge status={application.paymentStatus} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {exam?.name ?? (lang === "mn" ? "Шалгалт сонгогдоогүй" : "No exam selected")}
          </h2>
          {exam?.year || session ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {[exam?.year, session].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {application.paymentStatus !== "paid" ? (
            <Button asChild size="sm">
              <Link to="/student/payment/$id" params={{ id: application.id }}>
                <CreditCard className="h-4 w-4" />
                {lang === "mn" ? "Төлөх" : "Pay"}
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link to="/student/applications/$id" params={{ id: application.id }}>
              <Download className="h-4 w-4" />
              {lang === "mn" ? "Form" : "Form"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <DetailTile
          icon={CalendarDays}
          label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
          value={exam?.examDate ? formatDate(exam.examDate, lang) : "-"}
        />
        <DetailTile
          icon={MapPin}
          label={lang === "mn" ? "Байршил" : "Location"}
          value={exam?.location ?? "-"}
        />
        <DetailTile
          icon={ReceiptText}
          label={lang === "mn" ? "Илгээсэн" : "Submitted"}
          value={formatDate(application.createdAt, lang)}
        />
      </div>
    </div>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          mono
            ? "min-w-0 truncate font-mono text-sm font-medium"
            : "min-w-0 truncate text-sm font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatSession(session: string, lang: Lang) {
  const normalized = session.toLowerCase();
  if (normalized === "first" || normalized === "second") {
    return sessionLabel(normalized, lang);
  }
  return session;
}
