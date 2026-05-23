import { createFileRoute, Link } from "@tanstack/react-router";
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
import { formatDate, sessionLabel, statusLabel } from "@/lib/eju-format";
import type { Lang } from "@/lib/i18n";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Plus,
  ReceiptText,
} from "lucide-react";

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
    year?: number | null;
    session?: string | null;
    examDate: string;
    location: string;
  } | null;
}

function StudentApplications() {
  const { lang }: { lang: Lang } = useLang();

  const { data: application, isLoading } = useQuery({
    queryKey: ["student", "application"],
    queryFn: () =>
      apiGet<StudentApplicationSummary | undefined>("/api/student/application").catch(
        () => undefined,
      ),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasApplication = Boolean(application);
  const paymentStatus = application?.paymentStatus ?? "-";
  const paymentDone = paymentStatus === "paid";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={FileText}
        eyebrow={lang === "mn" ? "Оюутны бүртгэл" : "Student applications"}
        title={lang === "mn" ? "Миний бүртгэл" : "My application"}
        description={
          lang === "mn"
            ? "Илгээсэн EJU бүртгэл, төлбөрийн мэдээллээ нэг дороос харна."
            : "Review your submitted EJU application and payment state."
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
          value={hasApplication ? 1 : 0}
          helper={lang === "mn" ? "Одоогийн илгээсэн бүртгэл" : "Current submitted record"}
          tone="blue"
        />
        <StudentMetricCard
          icon={CreditCard}
          label={lang === "mn" ? "Төлбөр" : "Payment"}
          value={paymentStatus === "-" ? "-" : statusLabel(paymentStatus, lang)}
          helper={
            paymentDone
              ? lang === "mn"
                ? "Баталгаажсан"
                : "Confirmed"
              : lang === "mn"
                ? "Төлбөр шалгах"
                : "Needs attention"
          }
          tone={paymentDone ? "emerald" : "teal"}
        />
        <StudentMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
          value={application?.exam?.examDate ? formatDate(application.exam.examDate, lang) : "-"}
          helper={
            application?.exam?.location ??
            (lang === "mn" ? "Байршил тодорхойгүй" : "No location yet")
          }
          tone="violet"
        />
      </div>

      {!application ? (
        <StudentPanel>
          <StudentEmptyState>
            <div className="mx-auto max-w-md space-y-3">
              <p className="font-medium text-foreground">
                {lang === "mn" ? "Танд бүртгэл алга" : "You have no application yet"}
              </p>
              <p>
                {lang === "mn"
                  ? "Нээлттэй шалгалтаа сонгоод бүртгэлийн маягтаа эхлүүлнэ үү."
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
            title={lang === "mn" ? "Одоогийн бүртгэл" : "Current application"}
            description={
              lang === "mn"
                ? "Шалгалтын мэдээлэл, бүртгэлийн дугаар, төлбөрийн товч мэдээлэл."
                : "Exam details, application number, and payment summary."
            }
          >
            <ApplicationCard application={application} lang={lang} />
          </StudentPanel>

          <StudentPanel
            title={lang === "mn" ? "Төлөвийн хураангуй" : "Status summary"}
            description={
              lang === "mn"
                ? "Дараагийн хийх зүйлээ эндээс хурдан шалгана."
                : "Quickly confirm what needs to happen next."
            }
          >
            <div className="space-y-3">
              <SummaryRow
                label={lang === "mn" ? "Бүртгэлийн дугаар" : "Application number"}
                value={application.applicationNumber}
                mono
              />
              <SummaryRow
                label={lang === "mn" ? "Төлбөр" : "Payment"}
                value={<StatusBadge status={application.paymentStatus} />}
              />
              <SummaryRow
                label={lang === "mn" ? "Илгээсэн огноо" : "Submitted"}
                value={formatDate(application.createdAt, lang)}
              />

              <div className="space-y-2 pt-2">
                {application.paymentStatus !== "paid" ? (
                  <Button asChild className="w-full justify-between">
                    <Link to="/student/payment/$id" params={{ id: application.id }}>
                      {lang === "mn" ? "Төлбөр төлөх" : "Pay now"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/student/exams">
                    {lang === "mn" ? "Шалгалтын мэдээлэл" : "Exam information"}
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
        {application.paymentStatus !== "paid" ? (
          <Button asChild size="sm">
            <Link to="/student/payment/$id" params={{ id: application.id }}>
              <CreditCard className="h-4 w-4" />
              {lang === "mn" ? "Төлөх" : "Pay"}
            </Link>
          </Button>
        ) : null}
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
