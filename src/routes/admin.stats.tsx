import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { downloadXlsx, type XlsxCell, type XlsxStyle, type XlsxValue } from "@/lib/xlsx-export";
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Loader2,
  PieChart as PieChartIcon,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/stats")({
  head: () => ({ meta: [{ title: "Админ - Тайлан | EJU" }] }),
  component: AdminStatsPage,
});

type StatsResponse = {
  kpi: {
    totalApplications: number;
    paid: number;
    unpaid: number;
  };
  monthlyApplications: Array<{ month: string; count: number }>;
  subjectDistribution: Array<{ key: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  examSeatStats: Array<{
    examId: string;
    name: string;
    year: number;
    session: string;
    location: string;
    totalSeats: number | null;
    registered: number;
    filledPercent: number;
  }>;
  rows: Array<Record<string, string | number | boolean | null>>;
  students: Array<Record<string, string | number | boolean | null>>;
  exams: Array<{
    id: string;
    name: string;
    year: number;
    session: string;
    date: string;
    location: string;
  }>;
};

const PIE_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#f59e0b", "#e11d48"];
const APPLICATION_COLUMN_WIDTHS = [
  4, 20, 26, 8, 13, 14, 14, 18, 12, 18, 14, 12, 10, 12, 24, 26, 26,
];
const CENTER_DATA_COLUMNS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

function mark(value: unknown): string {
  return value === true ? "O" : "";
}

function formatSex(value: unknown): string {
  if (value === "MALE") return "M";
  if (value === "FEMALE") return "F";
  return "";
}

function formatBirthDate(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 10).replaceAll("-", ".");
}

function normalizeEjuCode(value: unknown): string {
  if (value === null || value === undefined) return "";
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return "";
  if (/^[A-Z]{2}\d{2}$/.test(normalized)) return normalized;
  if (["MONGOLIA", "MONGOL", "MN", "MNG", "MO"].includes(normalized)) return "AS10";

  const legacyCodes: Record<string, string> = {
    "2101": "AS10",
  };
  return legacyCodes[normalized] ?? normalized;
}

function formatCountryCode(value: unknown): string {
  return normalizeEjuCode(value);
}

function formatAddressCode(addressCode: unknown, countryCode: unknown): string {
  return normalizeEjuCode(addressCode) || normalizeEjuCode(countryCode);
}

function photoFilename(value: unknown): string {
  if (!value) return "";
  const normalized = String(value).replaceAll("\\", "/");
  return normalized.split("/").filter(Boolean).pop() ?? normalized;
}

function renamedPhotoFilename(value: unknown): string {
  const applicationNumber = value ? String(value) : "APP";
  return `P${applicationNumber}.jpg`;
}

function styledCell(value: string, style: XlsxStyle): XlsxCell {
  return { value, style };
}

function dataCell(value: XlsxValue, columnIndex: number): XlsxCell {
  return {
    value,
    style: CENTER_DATA_COLUMNS.has(columnIndex) ? "center" : "text",
  };
}

function AdminStatsPage() {
  const { lang } = useLang();
  const [year, setYear] = useState<string>("all");
  const [session, setSession] = useState<string>("all");
  const [examId, setExamId] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats", year, session, examId],
    queryFn: () => {
      const q = new URLSearchParams();
      if (year !== "all") q.set("year", year);
      if (session !== "all") q.set("session", session);
      if (examId !== "all") q.set("examId", examId);
      return apiGet<StatsResponse>(`/api/admin/stats?${q.toString()}`);
    },
  });

  const exportApplicationXlsx = () => {
    if (!data) return;
    const rows: XlsxCell[][] = [
      [
        "",
        styledCell("EJU Internet Application List", "title"),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        styledCell("Exam Subjects", "group"),
        "",
        "",
        "",
        styledCell("Exam Language", "group"),
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "",
        styledCell("Application No", "header"),
        styledCell("Name", "header"),
        styledCell("Sex", "header"),
        styledCell("Birth Date", "header"),
        styledCell("Nationality", "header"),
        styledCell("Address Code", "header"),
        styledCell("Japanese Subject", "header"),
        styledCell("Science", "header"),
        styledCell("Japan and World", "header"),
        styledCell("Mathematics", "header"),
        styledCell("Japanese", "header"),
        styledCell("English", "header"),
        styledCell("Scholarship", "header"),
        styledCell("Affiliation", "header"),
        styledCell("OLDNAME", "header"),
        styledCell("NEWNAME", "header"),
      ],
      ...data.rows.map((r) =>
        [
          "",
          r.applicationNumber,
          r.nameAlphabet,
          formatSex(r.sex),
          formatBirthDate(r.dateOfBirth),
          formatCountryCode(r.countryCode),
          formatAddressCode(r.addressCode, r.countryCode),
          mark(r.subjectJapanese),
          mark(r.subjectScience),
          mark(r.subjectJapanAndWorld),
          mark(r.subjectMathematics),
          r.examLanguage === "JAPANESE" ? "O" : "",
          r.examLanguage === "ENGLISH" ? "O" : "",
          r.jassoScholarshipApply ? "Y" : "N",
          r.schoolOrOccupation,
          photoFilename(r.photoUrl),
          renamedPhotoFilename(r.applicationNumber),
        ].map((value, columnIndex) => dataCell(value, columnIndex)),
      ),
    ];
    downloadXlsx("application-list.xlsx", {
      sheetName: "Applications",
      rows,
      columnWidths: APPLICATION_COLUMN_WIDTHS,
      merges: ["B1:Q1", "H2:K2", "L2:M2"],
      freezeRows: 3,
      autoFilter: `B3:Q${rows.length}`,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={BarChart3}
        eyebrow={lang === "mn" ? "Тайлан ба экспорт" : "Reports and export"}
        title={lang === "mn" ? "Тайлан ба статистик" : "Reports and statistics"}
        description={
          lang === "mn"
            ? "Бүртгэл, төлбөр, шалгалтын үзүүлэлтийг шүүж харах болон XLSX татах хэсэг."
            : "Filter application, payment, and exam metrics, then export operational XLSX files."
        }
      />

      <AdminPanel
        title={lang === "mn" ? "Тайлангийн тохиргоо" : "Report filters"}
        description={
          lang === "mn"
            ? "Он, улирал, шалгалтаар үзүүлэлтийг нарийвчилна."
            : "Narrow metrics by year, session, and exam."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportApplicationXlsx} disabled={!data}>
              <Download className="h-4 w-4" />
              {lang === "mn" ? "Бүх өргөдөл XLSX" : "Applications XLSX"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={lang === "mn" ? "Он" : "Year"}>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Session">
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                <SelectItem value="FIRST">First</SelectItem>
                <SelectItem value="SECOND">Second</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={lang === "mn" ? "Шалгалт" : "Exam"}>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                {(data?.exams ?? []).map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </AdminPanel>

      {isLoading || !data ? (
        <AdminPanel>
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        </AdminPanel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminMetricCard
              icon={BarChart3}
              label={lang === "mn" ? "Нийт өргөдөл" : "Total"}
              value={data.kpi.totalApplications}
              tone="blue"
            />
            <AdminMetricCard
              icon={CheckCircle2}
              label={lang === "mn" ? "Төлсөн" : "Paid"}
              value={data.kpi.paid}
              tone="teal"
            />
            <AdminMetricCard
              icon={XCircle}
              label={lang === "mn" ? "Төлөөгүй" : "Unpaid"}
              value={data.kpi.unpaid}
              tone="violet"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminPanel
              title={lang === "mn" ? "Сараар өргөдлийн тоо" : "Monthly applications"}
              description={
                lang === "mn"
                  ? "Сонгосон шүүлтүүрийн дагуух бүртгэлийн урсгал."
                  : "Registration flow for the selected filters."
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyApplications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>

            <AdminPanel
              title={lang === "mn" ? "Хичээлийн ангилал" : "Subject distribution"}
              description={
                lang === "mn"
                  ? "Сонгосон хичээлүүдийн тархалт."
                  : "Distribution of selected subjects."
              }
              actions={<PieChartIcon className="h-4 w-4 text-muted-foreground" />}
            >
              <div className="h-72">
                {data.subjectDistribution.length === 0 ? (
                  <AdminEmptyState>{lang === "mn" ? "Өгөгдөл алга." : "No data."}</AdminEmptyState>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.subjectDistribution}
                        dataKey="count"
                        nameKey="key"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={82}
                        paddingAngle={2}
                      >
                        {data.subjectDistribution.map((entry, index) => (
                          <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </AdminPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminPanel
              title={lang === "mn" ? "Байршлаар хуваарилалт" : "By location"}
              description={
                lang === "mn"
                  ? "Шалгалт авах байршлын дагуух тоо."
                  : "Applications by exam location."
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.locationDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="location" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>

            <AdminPanel
              title={lang === "mn" ? "Шалгалтын бүртгэл" : "Exam registrations"}
              description={
                lang === "mn"
                  ? "Шалгалт тус бүр дээр үүссэн бүртгэлийн тоо."
                  : "Application count by exam."
              }
            >
              {data.examSeatStats.length === 0 ? (
                <AdminEmptyState>
                  {lang === "mn"
                    ? "Шалгалтын бүртгэлийн мэдээлэл алга."
                    : "No exam registration data."}
                </AdminEmptyState>
              ) : (
                <div className="space-y-3">
                  {data.examSeatStats.map((row) => {
                    const hasSeatLimit = typeof row.totalSeats === "number" && row.totalSeats > 0;

                    return (
                      <div key={row.examId} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{row.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {hasSeatLimit
                                ? `${row.registered}/${row.totalSeats}`
                                : `${row.registered} ${lang === "mn" ? "бүртгэл" : "applications"}`}{" "}
                              · {row.location}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold text-primary">
                            {hasSeatLimit ? `${row.filledPercent.toFixed(1)}%` : row.registered}
                          </div>
                        </div>
                        {hasSeatLimit && (
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(row.filledPercent, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminPanel>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
