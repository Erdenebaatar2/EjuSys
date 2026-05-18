import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Admin exam settings | EjuSys" }] }),
  component: AdminExamPage,
});

interface ExamRecord {
  id: string;
  name: string;
  year: number;
  session: "FIRST" | "SECOND";
  examDate: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  registrationStart: string;
  registrationEnd: string;
  description?: string | null;
  active: boolean;
}

function AdminExamPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    year: String(new Date().getFullYear()),
    session: "FIRST" as "FIRST" | "SECOND",
    examDate: "",
    location: "",
    totalSeats: "100",
    registrationStart: "",
    registrationEnd: "",
    description: "",
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exam"],
    queryFn: () => apiGet<ExamRecord | undefined>("/api/admin/exam"),
  });

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        year: Number(form.year),
        session: form.session,
        examDate: form.examDate,
        location: form.location,
        totalSeats: Number(form.totalSeats),
        registrationStart: form.registrationStart,
        registrationEnd: form.registrationEnd,
        description: form.description || null,
        isActive: form.isActive,
      };
      if (data?.id) return apiPatch<ExamRecord>("/api/admin/exam", payload);
      return apiPost<ExamRecord>("/api/admin/exam", payload);
    },
    onSuccess: () => {
      toast.success(lang === "mn" ? "Шалгалтын мэдээлэл хадгалагдлаа" : "Exam saved");
      void qc.invalidateQueries({ queryKey: ["admin", "exam"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const deactivateMut = useMutation({
    mutationFn: () => apiDelete("/api/admin/exam"),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Шалгалт идэвхгүй боллоо" : "Exam deactivated");
      void qc.invalidateQueries({ queryKey: ["admin", "exam"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      year: String(data.year),
      session: data.session,
      examDate: data.examDate,
      location: data.location,
      totalSeats: String(data.totalSeats),
      registrationStart: data.registrationStart,
      registrationEnd: data.registrationEnd,
      description: data.description ?? "",
      isActive: data.active,
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">
        {lang === "mn" ? "Шалгалтын тохиргоо" : "Exam settings"}
      </h1>
      <Card className="shadow-card">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <Field label={lang === "mn" ? "Шалгалтын нэр" : "Exam name"}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={lang === "mn" ? "Он" : "Year"}>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </Field>
          <Field label={lang === "mn" ? "Session" : "Session"}>
            <Select
              value={form.session}
              onValueChange={(v) => setForm({ ...form, session: v as "FIRST" | "SECOND" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST">First</SelectItem>
                <SelectItem value="SECOND">Second</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={lang === "mn" ? "Шалгалтын огноо" : "Exam date"}>
            <Input
              type="date"
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            />
          </Field>
          <Field label={lang === "mn" ? "Байршил" : "Location"}>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field label={lang === "mn" ? "Нийт суудал" : "Total seats"}>
            <Input
              type="number"
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
            />
          </Field>
          <Field label={lang === "mn" ? "Бүртгэл эхлэх" : "Registration start"}>
            <Input
              type="date"
              value={form.registrationStart}
              onChange={(e) => setForm({ ...form, registrationStart: e.target.value })}
            />
          </Field>
          <Field label={lang === "mn" ? "Бүртгэл дуусах" : "Registration end"}>
            <Input
              type="date"
              value={form.registrationEnd}
              onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label={lang === "mn" ? "Тайлбар" : "Description"}>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
            <Label>{lang === "mn" ? "Идэвхтэй" : "Active"}</Label>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <Button onClick={() => upsertMut.mutate()} disabled={upsertMut.isPending}>
              {upsertMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {data ? (lang === "mn" ? "Шинэчлэх" : "Update") : lang === "mn" ? "Үүсгэх" : "Create"}
            </Button>
            {data && (
              <Button
                variant="outline"
                onClick={() => deactivateMut.mutate()}
                disabled={deactivateMut.isPending}
              >
                {deactivateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lang === "mn" ? "Идэвхгүй болгох" : "Deactivate"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
