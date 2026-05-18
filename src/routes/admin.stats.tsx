import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { buildCsv, downloadCsv } from "@/lib/csv-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/stats")({
  head: () => ({ meta: [{ title: "Admin stats | EjuSys" }] }),
  component: AdminStatsPage,
});

type StatsResponse = {
  kpi: {
    totalApplications: number;
    approved: number;
    pending: number;
    rejected: number;
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
    totalSeats: number;
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

const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"];

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

  const approvedPct = useMemo(() => {
    if (!data || data.kpi.totalApplications === 0) return 0;
    return (data.kpi.approved * 100) / data.kpi.totalApplications;
  }, [data]);
  const pendingPct = useMemo(() => {
    if (!data || data.kpi.totalApplications === 0) return 0;
    return (data.kpi.pending * 100) / data.kpi.totalApplications;
  }, [data]);
  const rejectedPct = useMemo(() => {
    if (!data || data.kpi.totalApplications === 0) return 0;
    return (data.kpi.rejected * 100) / data.kpi.totalApplications;
  }, [data]);

  const exportApplicationCsv = () => {
    if (!data) return;
    const csv = buildCsv(data.rows, [
      { header: "受験番号", value: (r) => r.applicationNumber },
      { header: "ローマ字氏名", value: (r) => r.nameAlphabet },
      { header: "性別", value: (r) => r.sex },
      { header: "生年月日", value: (r) => r.dateOfBirth },
      { header: "国籍", value: (r) => r.countryCode },
      { header: "住所", value: (r) => r.addressCode },
      { header: "日本語科目", value: (r) => ((r.subjectJapanese as boolean) ? "O" : "") },
      { header: "理科", value: (r) => ((r.subjectScience as boolean) ? "O" : "") },
      { header: "総合科目", value: (r) => ((r.subjectJapanAndWorld as boolean) ? "O" : "") },
      { header: "数学", value: (r) => ((r.subjectMathematics as boolean) ? "O" : "") },
      { header: "日本語", value: (r) => ((r.examLanguage as string) === "JAPANESE" ? "O" : "") },
      { header: "英語", value: (r) => ((r.examLanguage as string) === "ENGLISH" ? "O" : "") },
      { header: "学習奨励費", value: (r) => ((r.jassoScholarshipApply as boolean) ? "Y" : "N") },
      { header: "所属先", value: (r) => r.schoolOrOccupation },
      { header: "OLDNAME", value: (r) => r.photoUrl },
      { header: "NEWNAME", value: (r) => `${r.applicationNumber ?? "APP"}.jpg` },
    ]);
    downloadCsv("application-list.csv", csv);
  };

  const exportStudentCsv = () => {
    if (!data) return;
    const csv = buildCsv(data.students, [
      { header: "ID", value: (r) => r.id },
      { header: "First Name", value: (r) => r.firstName },
      { header: "Last Name", value: (r) => r.lastName },
      { header: "Email", value: (r) => r.email },
      { header: "Passport", value: (r) => r.passportNumber },
      { header: "Phone", value: (r) => r.phone },
      { header: "Address", value: (r) => r.address },
      { header: "Active", value: (r) => r.isActive },
      { header: "Applications", value: (r) => r.applications },
    ]);
    downloadCsv("students.csv", csv);
  };

  const exportExamReportCsv = () => {
    if (!data) return;
    const csv = buildCsv(data.examSeatStats, [
      { header: "Exam", value: (r) => r.name },
      { header: "Year", value: (r) => r.year },
      { header: "Session", value: (r) => r.session },
      { header: "Location", value: (r) => r.location },
      { header: "Total Seats", value: (r) => r.totalSeats },
      { header: "Registered", value: (r) => r.registered },
      { header: "Filled %", value: (r) => Number(r.filledPercent).toFixed(2) },
    ]);
    downloadCsv("exam-report.csv", csv);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-3xl font-bold">
        {lang === "mn" ? "Тайлан ба статистик" : "Reports and statistics"}
      </h1>

      <Card className="shadow-card">
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>{lang === "mn" ? "Он" : "Year"}</Label>
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
          </div>
          <div>
            <Label>Session</Label>
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
          </div>
          <div>
            <Label>{lang === "mn" ? "Шалгалт" : "Exam"}</Label>
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
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={exportApplicationCsv} disabled={!data}>
              {lang === "mn" ? "Бүх өргөдөл татах" : "Export applications"}
            </Button>
            <Button variant="outline" onClick={exportStudentCsv} disabled={!data}>
              {lang === "mn" ? "Оюутан CSV" : "Students CSV"}
            </Button>
            <Button variant="outline" onClick={exportExamReportCsv} disabled={!data}>
              {lang === "mn" ? "Шалгалтын тайлан" : "Exam report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <Card className="shadow-card">
          <CardContent className="py-10 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard
              title={lang === "mn" ? "Нийт өргөдөл" : "Total applications"}
              value={data.kpi.totalApplications}
            />
            <KpiCard title={`Approved (${approvedPct.toFixed(1)}%)`} value={data.kpi.approved} />
            <KpiCard title={`Pending (${pendingPct.toFixed(1)}%)`} value={data.kpi.pending} />
            <KpiCard title={`Rejected (${rejectedPct.toFixed(1)}%)`} value={data.kpi.rejected} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>
                  {lang === "mn" ? "Сараар өргөдлийн тоо" : "Monthly applications"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyApplications}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>
                  {lang === "mn" ? "Хичээлийн ангилал" : "Subject distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.subjectDistribution}
                      dataKey="count"
                      nameKey="key"
                      outerRadius={90}
                    >
                      {data.subjectDistribution.map((entry, index) => (
                        <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{lang === "mn" ? "Байршлаар хуваарилалт" : "By location"}</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.locationDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{lang === "mn" ? "Суудлын дүүргэлт %" : "Seat fill rate %"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.examSeatStats.map((row) => (
                  <div key={row.examId} className="rounded-md border p-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {row.registered}/{row.totalSeats} · {row.filledPercent.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
