import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send } from "lucide-react";

export const Route = createFileRoute("/student/requests")({
  head: () => ({ meta: [{ title: "Админд хүсэлт илгээх | EJU" }] }),
  component: StudentRequests,
});

interface SupportRequest {
  id: string;
  subject: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

function StudentRequests() {
  const { lang }: { lang: Lang } = useLang();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["student", "requests"],
    queryFn: () => apiGet<SupportRequest[]>("/api/student/requests"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<SupportRequest>("/api/student/requests", {
        subject,
        message,
      }),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Хүсэлт илгээгдлээ" : "Request sent");
      setSubject("");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["student", "requests"] });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <StudentPageHeader
        icon={MessageSquare}
        eyebrow={lang === "mn" ? "Тусламж" : "Support"}
        title={lang === "mn" ? "Админд хүсэлт илгээх" : "Send request to admin"}
        description={
          lang === "mn"
            ? "Асуух зүйл, засуулах шаардлагатай мэдээллээ админ руу илгээнэ."
            : "Send questions or information-change requests to the admin."
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <StudentPanel
          title={lang === "mn" ? "Шинэ хүсэлт" : "New request"}
          description={
            lang === "mn"
              ? "Гарчиг болон дэлгэрэнгүй тайлбараа бичээд илгээнэ үү."
              : "Write a subject and a clear message."
          }
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) createMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="subject">{lang === "mn" ? "Гарчиг" : "Subject"}</Label>
              <Input
                id="subject"
                maxLength={160}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={lang === "mn" ? "Жишээ: Мэдээлэл засуулах" : "Example: Update my information"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">{lang === "mn" ? "Хүсэлт" : "Message"}</Label>
              <Textarea
                id="message"
                className="min-h-40 resize-y"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  lang === "mn"
                    ? "Админд уншуулах хүсэлтээ тодорхой бичнэ үү."
                    : "Describe what you want the admin to read."
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {lang === "mn" ? "Илгээх" : "Send"}
            </Button>
          </form>
        </StudentPanel>

        <StudentPanel
          title={lang === "mn" ? "Миний илгээсэн хүсэлтүүд" : "My sent requests"}
        >
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <StudentEmptyState>
              {lang === "mn" ? "Одоогоор илгээсэн хүсэлт алга." : "No requests sent yet."}
            </StudentEmptyState>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} lang={lang} />
              ))}
            </div>
          )}
        </StudentPanel>
      </div>
    </div>
  );
}

function RequestCard({ request, lang }: { request: SupportRequest; lang: Lang }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-sm font-semibold text-foreground">{request.subject}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(request.createdAt, lang)}</p>
        </div>
        <Badge
          variant="outline"
          className={
            request.read
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }
        >
          {request.read
            ? lang === "mn"
              ? "Уншсан"
              : "Read"
            : lang === "mn"
              ? "Илгээсэн"
              : "Sent"}
        </Badge>
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
        {request.message}
      </p>
    </div>
  );
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
