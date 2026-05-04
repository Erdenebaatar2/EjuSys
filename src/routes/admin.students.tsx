import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Eye, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Админ — Оюутнууд | EJU" }] }),
  component: AdminStudents,
});

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  passportNumber: string;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface StudentDetail extends StudentRow {
  applications: {
    id: string;
    applicationNumber: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
}

interface ListResponse {
  items: StudentRow[];
  total: number;
  page: number;
  size: number;
}

function AdminStudents() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "students", search, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      p.set("page", String(page));
      p.set("size", "20");
      return apiGet<ListResponse>(`/api/admin/students?${p}`);
    },
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "students", "detail", detailId],
    queryFn: () => apiGet<StudentDetail>(`/api/admin/students/${detailId}`),
    enabled: !!detailId,
  });

  const activeMut = useMutation({
    mutationFn: (args: { userId: string; isActive: boolean }) =>
      apiPatch(`/api/admin/students/${args.userId}/active`, { isActive: args.isActive }),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Шинэчиллээ" : "Updated");
      void qc.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Оюутны жагсаалт" : "Student list"}</h1>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <Label>{lang === "mn" ? "Хайх" : "Search"}</Label>
          <Input
            placeholder={lang === "mn" ? "Нэр, имэйл, паспорт..." : "Name, email, passport..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

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
                  <TableHead>{lang === "mn" ? "Имэйл" : "Email"}</TableHead>
                  <TableHead>{lang === "mn" ? "Паспорт" : "Passport"}</TableHead>
                  <TableHead>{lang === "mn" ? "Утас" : "Phone"}</TableHead>
                  <TableHead>{lang === "mn" ? "Идэвхтэй" : "Active"}</TableHead>
                  <TableHead className="text-right">{lang === "mn" ? "Үйлдэл" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.lastName} {s.firstName}
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell className="font-mono text-xs">{s.passportNumber}</TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={(v) => activeMut.mutate({ userId: s.id, isActive: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setDetailId(s.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {lang === "mn" ? "Оюутан алга" : "No students"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.total > data.size && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {lang === "mn" ? "Нийт" : "Total"}: {data.total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              {lang === "mn" ? "Өмнөх" : "Prev"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(page + 1) * data.size >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {lang === "mn" ? "Дараах" : "Next"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailQuery.data
                ? `${detailQuery.data.lastName} ${detailQuery.data.firstName}`
                : lang === "mn"
                  ? "Дэлгэрэнгүй"
                  : "Details"}
            </DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
          {detailQuery.data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{lang === "mn" ? "Имэйл" : "Email"}</div>
                  <div className="font-medium">{detailQuery.data.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{lang === "mn" ? "Паспорт" : "Passport"}</div>
                  <div className="font-medium">{detailQuery.data.passportNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{lang === "mn" ? "Утас" : "Phone"}</div>
                  <div className="font-medium">{detailQuery.data.phone ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{lang === "mn" ? "Хаяг" : "Address"}</div>
                  <div className="font-medium">{detailQuery.data.address ?? "—"}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{lang === "mn" ? "Бүртгэлүүд" : "Applications"}</h4>
                {detailQuery.data.applications.length === 0 ? (
                  <p className="text-muted-foreground text-xs">{lang === "mn" ? "Алга" : "None"}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang === "mn" ? "Дугаар" : "Number"}</TableHead>
                        <TableHead>{lang === "mn" ? "Төлөв" : "Status"}</TableHead>
                        <TableHead>{lang === "mn" ? "Төлбөр" : "Payment"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailQuery.data.applications.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">{a.applicationNumber}</TableCell>
                          <TableCell>
                            <StatusBadge status={a.status} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={a.paymentStatus} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
