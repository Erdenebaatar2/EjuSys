import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Админ — Шалгалтууд | EJU" }] }),
  component: AdminExams,
});

interface ExamRow {
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

interface ExamFormState {
  name: string;
  year: string;
  session: "FIRST" | "SECOND";
  examDate: string;
  location: string;
  totalSeats: string;
  registrationStart: string;
  registrationEnd: string;
  description: string;
  isActive: boolean;
}

const emptyForm: ExamFormState = {
  name: "",
  year: String(new Date().getFullYear()),
  session: "FIRST",
  examDate: "",
  location: "",
  totalSeats: "100",
  registrationStart: "",
  registrationEnd: "",
  description: "",
  isActive: true,
};

function AdminExams() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExamFormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: () => apiGet<ExamRow[]>("/api/admin/exams"),
  });

  const saveMut = useMutation({
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
      return editing
        ? apiPut<ExamRow>(`/api/admin/exams/${editing.id}`, payload)
        : apiPost<ExamRow>("/api/admin/exams", payload);
    },
    onSuccess: () => {
      toast.success(lang === "mn" ? "Хадгалагдлаа" : "Saved");
      setOpen(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/exams/${id}`),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Устгалаа" : "Deleted");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(e: ExamRow) {
    setEditing(e);
    setForm({
      name: e.name,
      year: String(e.year),
      session: e.session,
      examDate: e.examDate,
      location: e.location,
      totalSeats: String(e.totalSeats),
      registrationStart: e.registrationStart,
      registrationEnd: e.registrationEnd,
      description: e.description ?? "",
      isActive: e.active,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{lang === "mn" ? "Шалгалт удирдах" : "Exam management"}</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />
          {lang === "mn" ? "Шинэ шалгалт" : "New exam"}
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "mn" ? "Нэр" : "Name"}</TableHead>
                  <TableHead>{lang === "mn" ? "Огноо" : "Date"}</TableHead>
                  <TableHead>{lang === "mn" ? "Байршил" : "Location"}</TableHead>
                  <TableHead>{lang === "mn" ? "Суудал" : "Seats"}</TableHead>
                  <TableHead>{lang === "mn" ? "Төлөв" : "Status"}</TableHead>
                  <TableHead className="text-right">{lang === "mn" ? "Үйлдэл" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {e.name}
                      <div className="text-xs text-muted-foreground">
                        {e.year} · {e.session === "FIRST" ? "1" : "2"}
                      </div>
                    </TableCell>
                    <TableCell>{e.examDate}</TableCell>
                    <TableCell>{e.location}</TableCell>
                    <TableCell>
                      {e.availableSeats}/{e.totalSeats}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.active ? "default" : "outline"}>
                        {e.active ? (lang === "mn" ? "Идэвхтэй" : "Active") : lang === "mn" ? "Идэвхгүй" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {lang === "mn" ? "Шалгалт алга" : "No exams"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? lang === "mn"
                  ? "Шалгалт засах"
                  : "Edit exam"
                : lang === "mn"
                  ? "Шинэ шалгалт"
                  : "New exam"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{lang === "mn" ? "Нэр" : "Name"}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>{lang === "mn" ? "Он" : "Year"}</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <Label>{lang === "mn" ? "Улирал" : "Session"}</Label>
              <Select
                value={form.session}
                onValueChange={(v) => setForm({ ...form, session: v as "FIRST" | "SECOND" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">{lang === "mn" ? "1-р улирал" : "Session 1"}</SelectItem>
                  <SelectItem value="SECOND">{lang === "mn" ? "2-р улирал" : "Session 2"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang === "mn" ? "Шалгалтын огноо" : "Exam date"}</Label>
              <Input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div>
              <Label>{lang === "mn" ? "Нийт суудал" : "Total seats"}</Label>
              <Input
                type="number"
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{lang === "mn" ? "Байршил" : "Location"}</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>{lang === "mn" ? "Бүртгэл эхлэх" : "Reg. start"}</Label>
              <Input
                type="date"
                value={form.registrationStart}
                onChange={(e) => setForm({ ...form, registrationStart: e.target.value })}
              />
            </div>
            <div>
              <Label>{lang === "mn" ? "Бүртгэл дуусах" : "Reg. end"}</Label>
              <Input
                type="date"
                value={form.registrationEnd}
                onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{lang === "mn" ? "Тайлбар" : "Description"}</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>{lang === "mn" ? "Идэвхтэй" : "Active"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {lang === "mn" ? "Болих" : "Cancel"}
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {lang === "mn" ? "Хадгалах" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === "mn" ? "Устгах уу?" : "Delete exam?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "mn" ? "Энэ үйлдлийг буцаах боломжгүй." : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang === "mn" ? "Болих" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang === "mn" ? "Устгах" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
