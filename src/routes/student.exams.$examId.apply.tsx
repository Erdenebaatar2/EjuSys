import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet, apiPost, uploadFile } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Upload, FileCheck2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { validateSubjectCombination, validateFile, type SubjectCode } from "@/lib/eju-validation";
import { categoryLabel, subjectLabel } from "@/lib/eju-format";

export const Route = createFileRoute("/student/exams/$examId/apply")({
  head: () => ({ meta: [{ title: "Бүртгэл | EJU" }] }),
  component: ApplyPage,
});

interface Subject {
  id: string;
  code: string;
  nameMn: string;
  nameJa: string;
  category: string;
}

interface ApplyExamRecord {
  id: string;
  name: string;
}

interface ProfileContactRecord {
  phone: string;
  address: string;
}

function ApplyPage() {
  const { examId } = Route.useParams();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ApplyExamRecord | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [targetUniversity, setTargetUniversity] = useState("");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    void (async () => {
      const [examData, subjectsData, profileData] = await Promise.allSettled([
        apiGet<ApplyExamRecord>(`/api/student/exams/${examId}`),
        apiGet<Subject[]>("/api/student/subjects"),
        apiGet<ProfileContactRecord>("/api/student/profile"),
      ]);
      if (examData.status === "fulfilled") setExam(examData.value);
      if (subjectsData.status === "fulfilled") setSubjects(subjectsData.value ?? []);
      if (profileData.status === "fulfilled" && profileData.value) {
        setPhone(profileData.value.phone ?? "");
        setAddress(profileData.value.address ?? "");
      }
      setLoading(false);
    })();
  }, [examId]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleFile(type: "passport" | "photo", f: File | null) {
    if (!f) {
      if (type === "passport") setPassportFile(null);
      else setPhotoFile(null);
      return;
    }
    const v = validateFile(f, type);
    if (!v.valid) {
      toast.error(lang === "mn" ? v.messageMn : v.messageJa);
      return;
    }
    if (type === "passport") setPassportFile(f);
    else setPhotoFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exam) return;

    const selectedSubjects = subjects.filter((s) => selected.has(s.id));
    const codes = selectedSubjects.map((s) => s.code as SubjectCode);
    const v = validateSubjectCombination(codes);
    if (!v.valid) {
      toast.error(lang === "mn" ? v.messageMn : v.messageJa);
      return;
    }

    if (!passportFile) {
      toast.error(lang === "mn" ? "Паспортын скан заавал" : "Passport scan is required");
      return;
    }
    if (!photoFile) {
      toast.error(lang === "mn" ? "Цээж зураг заавал" : "Profile photo is required");
      return;
    }

    setSubmitting(true);
    try {
      const [passportPath, photoPath] = await Promise.all([
        uploadFile("passport", passportFile),
        uploadFile("photo", photoFile),
      ]);

      const app = await apiPost<{ id: string; applicationNumber: string }>(
        "/api/student/applications",
        {
          examId,
          phone: phone || null,
          address: address || null,
          targetUniversity: targetUniversity || null,
          passportScanPath: passportPath,
          photoPath: photoPath,
          subjectIds: Array.from(selected),
        },
      );

      toast.success(
        lang === "mn"
          ? `Бүртгэл амжилттай! ${app.applicationNumber}`
          : `Application submitted! ${app.applicationNumber}`,
      );
      void navigate({ to: "/student/applications/$id", params: { id: app.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!exam) {
    return (
      <p className="text-muted-foreground">
        {lang === "mn" ? "Шалгалт олдсонгүй" : "Exam not found"}
      </p>
    );
  }

  const grouped = subjects.reduce<Record<string, Subject[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/exams/$examId" params={{ examId }}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {lang === "mn" ? "Буцах" : "Back"}
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">
          {lang === "mn" ? "Шалгалтад бүртгүүлэх" : "Apply for exam"}
        </h1>
        <p className="mt-1 text-muted-foreground">{exam.name}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "1. Хичээл сонгох" : "1. Select subjects"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs">
                {lang === "mn"
                  ? "JASSO дүрэм: J1+J2, K1+K2-г хамт сонгох боломжгүй. Шинжлэх ухаан + Ерөнхий хичээл хамт сонгох боломжгүй."
                  : "JASSO rules: J1 and J2 cannot be selected together, K1 and K2 cannot be selected together, and Science cannot be combined with General subjects."}
              </AlertDescription>
            </Alert>

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-sm font-semibold mb-2 text-primary">
                  {categoryLabel(cat, lang)}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {items.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                        selected.has(s.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight">
                          {lang === "mn" ? s.nameMn : subjectLabel(s.code, lang)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.code} · {lang === "mn" ? subjectLabel(s.code, "en") : s.nameMn}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "2. Холбоо барих мэдээлэл" : "2. Contact information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Утас" : "Phone"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Хаяг" : "Address"}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>
                {lang === "mn"
                  ? "Очих их сургууль (заавал биш)"
                  : "Target university (optional)"}
              </Label>
              <Input
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "3. Баримт бичиг" : "3. Documents"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileInput
              label={
                lang === "mn"
                  ? "Паспортын скан (PDF/JPEG/PNG, ≤5MB)"
                  : "Passport scan (PDF/JPEG/PNG, up to 5MB)"
              }
              accept="application/pdf,image/jpeg,image/png"
              file={passportFile}
              onChange={(f) => handleFile("passport", f)}
            />
            <FileInput
              label={
                lang === "mn"
                  ? "Цээж зураг (JPEG/PNG, ≤2MB)"
                  : "Profile photo (JPEG/PNG, up to 2MB)"
              }
              accept="image/jpeg,image/png"
              file={photoFile}
              onChange={(f) => handleFile("photo", f)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lang === "mn" ? "Бүртгэл илгээх" : "Submit application"}
          </Button>
          <Button asChild type="button" variant="outline" size="lg">
            <Link to="/student/exams/$examId" params={{ examId }}>
              {lang === "mn" ? "Цуцлах" : "Cancel"}
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function FileInput({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="flex items-center gap-3 rounded-md border border-dashed border-border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors">
        {file ? (
          <FileCheck2 className="h-5 w-5 text-success" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="text-sm flex-1 truncate">
          {file ? (
            <span className="font-medium">{file.name}</span>
          ) : (
            <span className="text-muted-foreground">{label}</span>
          )}
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
