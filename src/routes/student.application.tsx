import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiGet, apiPatch, apiPost, uploadPhoto } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/student/application")({
  head: () => ({ meta: [{ title: "EJU application | EjuSys" }] }),
  component: StudentApplicationPage,
});

const schema = z
  .object({
    photoUrl: z.string().min(1),
    nameAlphabet: z.string().min(2),
    nameKanji: z.string().optional(),
    sex: z.enum(["MALE", "FEMALE"]).optional(),
    dateOfBirth: z.string().min(1),
    nationality: z.string().min(2),
    countryCode: z.string().min(2),
    address: z.string().min(4),
    postalCode: z.string().optional(),
    addressCode: z.string().optional(),
    telephone: z.string().optional(),
    mobilePhone: z.string().min(4),
    schoolOrOccupation: z.string().min(2),
    subjectJapanese: z.boolean().default(false),
    subjectScience: z.boolean().default(false),
    subjectJapanAndWorld: z.boolean().default(false),
    subjectMathematics: z.boolean().default(false),
    scienceOption1: z.enum(["PHYSICS", "CHEMISTRY", "BIOLOGY"]).optional(),
    scienceOption2: z.enum(["PHYSICS", "CHEMISTRY", "BIOLOGY"]).optional(),
    mathCourse: z.enum(["COURSE1", "COURSE2"]).optional(),
    examLanguage: z.enum(["JAPANESE", "ENGLISH"]).optional(),
    jassoScholarshipApply: z.boolean().default(false),
    examSite: z
      .enum(["JAKARTA", "SURABAYA", "HANOI", "HOCHIMINH", "BANGKOK", "CHIANGMAI"])
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (
      !values.subjectJapanese &&
      !values.subjectScience &&
      !values.subjectJapanAndWorld &&
      !values.subjectMathematics
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectJapanese"],
        message: "At least one subject is required",
      });
    }
    if (values.subjectScience && !values.scienceOption1) {
      ctx.addIssue({
        code: "custom",
        path: ["scienceOption1"],
        message: "Science option is required",
      });
    }
    if (values.subjectMathematics && !values.mathCourse) {
      ctx.addIssue({ code: "custom", path: ["mathCourse"], message: "Math course is required" });
    }
  });

type FormValues = z.input<typeof schema>;

type ActiveExam = {
  id: string;
  name: string;
  year: number;
  session: string;
  examDate: string;
  registrationStart: string;
  registrationEnd: string;
  location: string;
};

type ApplicationResponse = Partial<FormValues> & {
  id: string;
  status: "pending" | "approved" | "rejected";
  applicationNumber: string;
  exam?: ActiveExam;
  rejectionReason?: string | null;
};

function StudentApplicationPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string>("");

  const examQuery = useQuery({
    queryKey: ["student", "activeExam"],
    queryFn: () => apiGet<ActiveExam | undefined>("/api/student/exam"),
  });
  const appQuery = useQuery({
    queryKey: ["student", "application"],
    queryFn: () => apiGet<ApplicationResponse | undefined>("/api/student/application"),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      photoUrl: "",
      nameAlphabet: "",
      nameKanji: "",
      sex: undefined,
      dateOfBirth: "",
      nationality: "",
      countryCode: "",
      address: "",
      postalCode: "",
      addressCode: "",
      telephone: "",
      mobilePhone: "",
      schoolOrOccupation: "",
      subjectJapanese: true,
      subjectScience: false,
      subjectJapanAndWorld: false,
      subjectMathematics: false,
      scienceOption1: undefined,
      scienceOption2: undefined,
      mathCourse: undefined,
      examLanguage: "JAPANESE",
      jassoScholarshipApply: false,
      examSite: undefined,
    },
  });

  useEffect(() => {
    const app = appQuery.data;
    if (!app) return;
    form.reset({
      photoUrl: app.photoUrl ?? "",
      nameAlphabet: app.nameAlphabet ?? "",
      nameKanji: app.nameKanji ?? "",
      sex: app.sex,
      dateOfBirth: app.dateOfBirth ?? "",
      nationality: app.nationality ?? "",
      countryCode: app.countryCode ?? "",
      address: app.address ?? "",
      postalCode: app.postalCode ?? "",
      addressCode: app.addressCode ?? "",
      telephone: app.telephone ?? "",
      mobilePhone: app.mobilePhone ?? "",
      schoolOrOccupation: app.schoolOrOccupation ?? "",
      subjectJapanese: !!app.subjectJapanese,
      subjectScience: !!app.subjectScience,
      subjectJapanAndWorld: !!app.subjectJapanAndWorld,
      subjectMathematics: !!app.subjectMathematics,
      scienceOption1: app.scienceOption1,
      scienceOption2: app.scienceOption2,
      mathCourse: app.mathCourse,
      examLanguage: app.examLanguage,
      jassoScholarshipApply: !!app.jassoScholarshipApply,
      examSite: app.examSite,
    });
    setPreview(app.photoUrl ?? "");
  }, [appQuery.data, form]);

  const uploadMut = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (path) => {
      form.setValue("photoUrl", path, { shouldValidate: true });
      setPreview(path);
      toast.success(lang === "mn" ? "Зураг амжилттай байршууллаа" : "Photo uploaded");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const saveMut = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = schema.parse(values);
      if (appQuery.data?.id)
        return apiPatch<ApplicationResponse>("/api/student/application", payload);
      return apiPost<ApplicationResponse>("/api/student/application", payload);
    },
    onSuccess: () => {
      toast.success(lang === "mn" ? "Бүртгэлийг хадгаллаа" : "Application saved");
      void qc.invalidateQueries({ queryKey: ["student", "application"] });
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const countryCode = form.watch("countryCode");
  const showExamSite = useMemo(
    () => ["ID", "VN", "TH"].includes((countryCode ?? "").toUpperCase()),
    [countryCode],
  );
  const isReadonly = appQuery.data?.status === "approved";

  if (examQuery.isLoading || appQuery.isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!examQuery.data && !appQuery.data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          {lang === "mn"
            ? "Идэвхтэй шалгалтын бүртгэл хаалттай байна."
            : "No active exam registration is available."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {lang === "mn" ? "EJU бүртгэлийн маягт" : "EJU application form"}
          </h1>
          {appQuery.data?.applicationNumber && (
            <p className="mt-1 text-sm text-muted-foreground">
              {appQuery.data.applicationNumber} ·{" "}
              <span className="uppercase">{appQuery.data.status}</span>
            </p>
          )}
        </div>
        {examQuery.data && (
          <Badge variant="secondary">
            {examQuery.data.year} · {examQuery.data.session} · {examQuery.data.examDate}
          </Badge>
        )}
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => {
          if (isReadonly) return;
          saveMut.mutate(values);
        })}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "1. Хувийн мэдээлэл" : "1. Personal information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>{lang === "mn" ? "Цээж зураг (jpg/png, 2MB)" : "Photo (jpg/png, 2MB)"}</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 hover:bg-muted/40">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{lang === "mn" ? "Зураг сонгох" : "Upload photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    disabled={isReadonly || uploadMut.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      uploadMut.mutate(file);
                    }}
                  />
                </label>
                {uploadMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {preview && <span className="text-xs text-muted-foreground">{preview}</span>}
              </div>
            </div>
            <Field label={lang === "mn" ? "Нэр (ALPHABET)" : "Name (ALPHABET)"}>
              <Input {...form.register("nameAlphabet")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Нэр (Kanji, optional)" : "Name (Kanji, optional)"}>
              <Input {...form.register("nameKanji")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Хүйс" : "Sex"}>
              <RadioGroup
                value={form.watch("sex")}
                onValueChange={(value) => form.setValue("sex", value as FormValues["sex"])}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="MALE" id="male" disabled={isReadonly} />
                  <Label htmlFor="male">{lang === "mn" ? "Эр" : "Male"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="FEMALE" id="female" disabled={isReadonly} />
                  <Label htmlFor="female">{lang === "mn" ? "Эм" : "Female"}</Label>
                </div>
              </RadioGroup>
            </Field>
            <Field label={lang === "mn" ? "Төрсөн огноо" : "Date of birth"}>
              <Input type="date" {...form.register("dateOfBirth")} disabled={isReadonly} />
            </Field>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "2. Хаяг ба холбоо барих" : "2. Contact and address"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label={lang === "mn" ? "Иргэншил" : "Nationality"}>
              <Input {...form.register("nationality")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Улсын код" : "Country code"}>
              <Input {...form.register("countryCode")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Хаяг" : "Address"}>
              <Textarea rows={3} {...form.register("address")} disabled={isReadonly} />
            </Field>
            <div className="grid gap-4">
              <Field label={lang === "mn" ? "Шуудангийн код" : "Postal code"}>
                <Input {...form.register("postalCode")} disabled={isReadonly} />
              </Field>
              <Field label={lang === "mn" ? "Address code" : "Address code"}>
                <Input {...form.register("addressCode")} disabled={isReadonly} />
              </Field>
            </div>
            <Field label={lang === "mn" ? "Утас" : "Telephone"}>
              <Input {...form.register("telephone")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Гар утас" : "Mobile phone"}>
              <Input {...form.register("mobilePhone")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Сургууль / Мэргэжил" : "School / Occupation"}>
              <Input {...form.register("schoolOrOccupation")} disabled={isReadonly} />
            </Field>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "3. Шалгалтын сонголт" : "3. Subject choices"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckField
              checked={Boolean(form.watch("subjectJapanese"))}
              onCheckedChange={(value) => form.setValue("subjectJapanese", !!value)}
              label={lang === "mn" ? "Япон хэл" : "Japanese as a Foreign Language"}
              disabled={isReadonly}
            />
            <CheckField
              checked={Boolean(form.watch("subjectScience"))}
              onCheckedChange={(value) => form.setValue("subjectScience", !!value)}
              label={lang === "mn" ? "Байгалийн ухаан" : "Science"}
              disabled={isReadonly}
            />
            {form.watch("subjectScience") && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <SelectField
                  label={lang === "mn" ? "Science 1" : "Science 1"}
                  value={form.watch("scienceOption1")}
                  onChange={(value) =>
                    form.setValue("scienceOption1", value as FormValues["scienceOption1"])
                  }
                  options={[
                    { value: "PHYSICS", label: lang === "mn" ? "Физик" : "Physics" },
                    { value: "CHEMISTRY", label: lang === "mn" ? "Хими" : "Chemistry" },
                    { value: "BIOLOGY", label: lang === "mn" ? "Биологи" : "Biology" },
                  ]}
                  disabled={isReadonly}
                />
                <SelectField
                  label={lang === "mn" ? "Science 2 (optional)" : "Science 2 (optional)"}
                  value={form.watch("scienceOption2")}
                  onChange={(value) =>
                    form.setValue("scienceOption2", value as FormValues["scienceOption2"])
                  }
                  options={[
                    { value: "PHYSICS", label: lang === "mn" ? "Физик" : "Physics" },
                    { value: "CHEMISTRY", label: lang === "mn" ? "Хими" : "Chemistry" },
                    { value: "BIOLOGY", label: lang === "mn" ? "Биологи" : "Biology" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
            <CheckField
              checked={Boolean(form.watch("subjectJapanAndWorld"))}
              onCheckedChange={(value) => form.setValue("subjectJapanAndWorld", !!value)}
              label={lang === "mn" ? "Япон ба дэлхий" : "Japan and the World"}
              disabled={isReadonly}
            />
            <CheckField
              checked={Boolean(form.watch("subjectMathematics"))}
              onCheckedChange={(value) => form.setValue("subjectMathematics", !!value)}
              label={lang === "mn" ? "Математик" : "Mathematics"}
              disabled={isReadonly}
            />
            {form.watch("subjectMathematics") && (
              <div className="pl-6">
                <SelectField
                  label={lang === "mn" ? "Математикийн курс" : "Math course"}
                  value={form.watch("mathCourse")}
                  onChange={(value) =>
                    form.setValue("mathCourse", value as FormValues["mathCourse"])
                  }
                  options={[
                    { value: "COURSE1", label: "Course 1" },
                    { value: "COURSE2", label: "Course 2" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "4. Нэмэлт мэдээлэл" : "4. Additional options"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SelectField
              label={lang === "mn" ? "Шалгалтын хэл" : "Exam language"}
              value={form.watch("examLanguage")}
              onChange={(value) =>
                form.setValue("examLanguage", value as FormValues["examLanguage"])
              }
              options={[
                { value: "JAPANESE", label: lang === "mn" ? "Япон" : "Japanese" },
                { value: "ENGLISH", label: lang === "mn" ? "Англи" : "English" },
              ]}
              disabled={isReadonly}
            />
            <div className="pt-8">
              <CheckField
                checked={Boolean(form.watch("jassoScholarshipApply"))}
                onCheckedChange={(value) => form.setValue("jassoScholarshipApply", !!value)}
                label={lang === "mn" ? "JASSO тэтгэлэгт хамрагдах" : "Apply for JASSO scholarship"}
                disabled={isReadonly}
              />
            </div>
            {showExamSite && (
              <div className="md:col-span-2">
                <SelectField
                  label={lang === "mn" ? "Шалгалтын байршил" : "Exam site"}
                  value={form.watch("examSite")}
                  onChange={(value) => form.setValue("examSite", value as FormValues["examSite"])}
                  options={[
                    { value: "JAKARTA", label: "Jakarta" },
                    { value: "SURABAYA", label: "Surabaya" },
                    { value: "HANOI", label: "Hanoi" },
                    { value: "HOCHIMINH", label: "Ho Chi Minh" },
                    { value: "BANGKOK", label: "Bangkok" },
                    { value: "CHIANGMAI", label: "Chiang Mai" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {appQuery.data?.rejectionReason && (
          <Card className="border-destructive/30 shadow-card">
            <CardContent className="py-4 text-sm text-destructive">
              {appQuery.data.rejectionReason}
            </CardContent>
          </Card>
        )}

        <div>
          <Button type="submit" disabled={saveMut.isPending || isReadonly}>
            {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lang === "mn" ? "Хадгалах" : "Save application"}
          </Button>
        </div>
      </form>
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

function CheckField({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        disabled={disabled}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
