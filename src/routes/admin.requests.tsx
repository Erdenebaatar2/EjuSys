import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, MailOpen, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "Админ - Хүсэлтүүд | EJU" }] }),
  component: AdminRequests,
});

interface AdminSupportRequest {
  id: string;
  userId: string;
  subject: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  student?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

function AdminRequests() {
  const { lang }: { lang: Lang } = useLang();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminSupportRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin", "requests"],
    queryFn: () => apiGet<AdminSupportRequest[]>("/api/admin/requests"),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => apiPatch<AdminSupportRequest>(`/api/admin/requests/${id}/read`),
    onSuccess: (updated) => {
      setSelected(updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
    },
  });

  const unreadCount = requests.filter((request) => !request.read).length;

  function openRequest(request: AdminSupportRequest) {
    setSelected(request);
    if (!request.read) {
      readMutation.mutate(request.id);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={MessageSquare}
        eyebrow={lang === "mn" ? "Оюутны хүсэлт" : "Student requests"}
        title={lang === "mn" ? "Хүсэлтүүд" : "Requests"}
        description={
          lang === "mn"
            ? "Оюутнуудаас ирсэн хүсэлт, асуултуудыг эндээс уншина."
            : "Read requests and questions submitted by students."
        }
        actions={
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {lang === "mn" ? `Уншаагүй ${unreadCount}` : `${unreadCount} unread`}
          </Badge>
        }
      />

      <AdminPanel
        title={lang === "mn" ? "Ирсэн хүсэлтүүд" : "Incoming requests"}
        description={
          lang === "mn" ? `Нийт ${requests.length} хүсэлт` : `${requests.length} total requests`
        }
      >
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <AdminEmptyState>
            {lang === "mn" ? "Одоогоор ирсэн хүсэлт алга." : "No requests yet."}
          </AdminEmptyState>
        ) : (
          <div className="divide-y rounded-lg border">
            {requests.map((request) => (
              <button
                key={request.id}
                type="button"
                className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-primary/5"
                onClick={() => openRequest(request)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-sm font-semibold text-foreground">
                      {request.subject}
                    </h2>
                    <RequestBadge request={request} lang={lang} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {studentName(request)} · {request.student?.email ?? "-"} ·{" "}
                    {formatDateTime(request.createdAt, lang)}
                  </p>
                  <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
                    {request.message}
                  </p>
                </div>
                <Eye className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </AdminPanel>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${studentName(selected)} · ${selected.student?.email ?? "-"} · ${formatDateTime(
                    selected.createdAt,
                    lang,
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <RequestBadge request={selected} lang={lang} />
                {readMutation.isPending && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {lang === "mn" ? "Уншсан болгож байна" : "Marking as read"}
                  </span>
                )}
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="whitespace-pre-line break-words text-sm leading-6 text-foreground">
                  {selected.message}
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label={lang === "mn" ? "Оюутан" : "Student"} value={studentName(selected)} />
                <Info label={lang === "mn" ? "Имэйл" : "Email"} value={selected.student?.email} />
                <Info label={lang === "mn" ? "Утас" : "Phone"} value={selected.student?.phone} />
                <Info
                  label={lang === "mn" ? "Уншсан огноо" : "Read at"}
                  value={selected.readAt ? formatDateTime(selected.readAt, lang) : "-"}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestBadge({ request, lang }: { request: AdminSupportRequest; lang: Lang }) {
  return (
    <Badge
      variant="outline"
      className={
        request.read
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }
    >
      {request.read ? (
        <>
          <MailOpen className="h-3.5 w-3.5" />
          {lang === "mn" ? "Уншсан" : "Read"}
        </>
      ) : lang === "mn" ? (
        "Шинэ"
      ) : (
        "New"
      )}
    </Badge>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words font-medium">{value || "-"}</div>
    </div>
  );
}

function studentName(request: AdminSupportRequest) {
  if (!request.student) return "-";
  return `${request.student.lastName ?? ""} ${request.student.firstName ?? ""}`.trim() || "-";
}

function formatDateTime(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
