import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  ImageUp,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "Профайл | EJU" }] }),
  component: ProfilePage,
});

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passportNumber: string;
  phone: string;
  address: string;
  profilePhotoPath?: string | null;
}

function ProfilePage() {
  const { lang } = useLang();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiGet<ProfileData>("/api/student/profile"),
  });

  function showLockedMessage() {
    toast.info(
      lang === "mn"
        ? "Хувийн мэдээллийг бүртгэл үүссэний дараа өөрчлөх боломжгүй. Мэдээлэл алдаатай бол админтай холбогдоно уу."
        : "Personal information cannot be changed after registration. Please contact an admin if anything is incorrect.",
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fullName = `${profile.lastName ?? ""} ${profile.firstName ?? ""}`.trim();
  const initials = initialsFor(profile);
  const avatarSrc = mediaUrl(profile.profilePhotoPath);
  const contactComplete = Boolean(profile.phone && profile.address);
  const documentComplete = Boolean(profile.passportNumber);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={UserRound}
        eyebrow={lang === "mn" ? "Оюутны профайл" : "Student profile"}
        title={lang === "mn" ? "Профайл" : "Profile"}
        description={
          lang === "mn"
            ? "Account үүсгэх үед оруулсан үндсэн мэдээлэл. Эдгээр талбарууд read-only бөгөөд шалгалтын бүртгэлд автоматаар ашиглагдана."
            : "Core information captured during account registration. These fields are read-only and reused automatically for exam applications."
        }
        actions={
          <Button type="button" variant="outline" onClick={showLockedMessage}>
            <Lock className="h-4 w-4" />
            {lang === "mn" ? "Мэдээлэл locked" : "Information locked"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudentMetricCard
          icon={CheckCircle2}
          label={lang === "mn" ? "Дансны төлөв" : "Account status"}
          value={lang === "mn" ? "Идэвхтэй" : "Active"}
          helper={lang === "mn" ? "Оюутны эрх нээлттэй" : "Student access enabled"}
          tone="emerald"
        />
        <StudentMetricCard
          icon={Phone}
          label={lang === "mn" ? "Холбоо барих" : "Contact"}
          value={
            contactComplete
              ? lang === "mn"
                ? "Бүрэн"
                : "Complete"
              : lang === "mn"
                ? "Дутуу"
                : "Missing"
          }
          helper={lang === "mn" ? "Утас болон хаяг" : "Phone and address"}
          tone={contactComplete ? "teal" : "amber"}
        />
        <StudentMetricCard
          icon={CreditCard}
          label={lang === "mn" ? "Бичиг баримт" : "Document"}
          value={documentComplete ? profile.passportNumber : "-"}
          helper={lang === "mn" ? "Шалгалтын form-д ашиглагдана" : "Used on applicant forms"}
          tone={documentComplete ? "blue" : "amber"}
        />
        <StudentMetricCard
          icon={ImageUp}
          label={lang === "mn" ? "Цээж зураг" : "Photo"}
          value={
            profile.profilePhotoPath
              ? lang === "mn"
                ? "Оруулсан"
                : "Added"
              : lang === "mn"
                ? "Шалгалтад оруулна"
                : "Upload per exam"
          }
          helper={
            lang === "mn"
              ? "Шалгалтад бүртгүүлэх үед зураг заавал орно"
              : "A photo is required during exam registration"
          }
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <StudentPanel contentClassName="p-0">
          <div className="flex flex-col items-center p-6 text-center">
            <AvatarBox src={avatarSrc} initials={initials} />
            <h2 className="mt-4 max-w-full truncate text-xl font-semibold text-foreground">
              {fullName || "-"}
            </h2>
            <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
            <Badge variant="secondary" className="mt-3">
              {lang === "mn" ? "Оюутан" : "Student"}
            </Badge>
          </div>

          <div className="border-t p-5">
            <div className="space-y-3">
              <ReadOnlyField
                icon={Mail}
                label={lang === "mn" ? "Имэйл" : "Email"}
                value={profile.email}
              />
              <ReadOnlyField
                icon={CreditCard}
                label={lang === "mn" ? "Бичиг баримтын дугаар" : "Document number"}
                value={profile.passportNumber}
                mono
              />
            </div>
          </div>
        </StudentPanel>

        <div className="space-y-6">
          <StudentPanel
            title={lang === "mn" ? "Хувийн мэдээлэл" : "Personal information"}
            description={
              lang === "mn"
                ? "Доорх мэдээлэл бүртгэл үүссэний дараа өөрчлөгдөхгүй. Алдаа байвал админтай холбогдоно уу."
                : "These fields cannot be changed after account creation. Contact an admin if anything is incorrect."
            }
            actions={
              <Button type="button" variant="outline" size="sm" onClick={showLockedMessage}>
                <Lock className="h-4 w-4" />
                {lang === "mn" ? "Read-only" : "Read-only"}
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnlyField
                label={lang === "mn" ? "Овог" : "Last name"}
                value={profile.lastName}
              />
              <ReadOnlyField
                label={lang === "mn" ? "Нэр" : "First name"}
                value={profile.firstName}
              />
              <ReadOnlyField
                icon={Mail}
                label={lang === "mn" ? "Имэйл" : "Email"}
                value={profile.email}
              />
              <ReadOnlyField
                icon={Phone}
                label={lang === "mn" ? "Утас" : "Phone"}
                value={profile.phone}
              />
              <ReadOnlyField
                className="sm:col-span-2"
                icon={MapPin}
                label={lang === "mn" ? "Оршин суугаа хаяг" : "Residential address"}
                value={profile.address}
              />
              <ReadOnlyField
                className="sm:col-span-2"
                icon={CreditCard}
                label={
                  lang === "mn" ? "Паспорт / бичиг баримтын дугаар" : "Passport / document number"
                }
                value={profile.passportNumber}
                mono
              />
            </div>
          </StudentPanel>

          <StudentPanel
            title={lang === "mn" ? "Санамж" : "Notice"}
            description={
              lang === "mn"
                ? "Шалгалтад бүртгүүлэх үед энэ мэдээллийг дахин бөглүүлэхгүй. Цээж зураг болон хичээл сонголтыг тухайн бүртгэл дээр тусад нь хадгална."
                : "During exam registration, this information is not collected again. Photo and subject choices are saved per application."
            }
          >
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              {lang === "mn"
                ? "Хувийн мэдээлэл албан ёсны бичиг баримттай зөрүүтэй бол шалгалтын бүртгэл дээр буруу мэдээлэл гарах тул админтай холбогдож засуулах шаардлагатай."
                : "If personal information does not match your official document, contact an admin so the applicant form can be corrected before use."}
            </div>
          </StudentPanel>
        </div>
      </div>
    </div>
  );
}

function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const normalized = path.startsWith("/uploads/")
    ? path
    : path.startsWith("uploads/")
      ? `/${path}`
      : `/uploads/${path}`;
  return `${mediaBaseUrl()}${normalized}`;
}

function mediaBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.port && window.location.port !== "8080") {
    return "http://localhost:8080";
  }
  return "";
}

function initialsFor(profile: Pick<ProfileData, "firstName" | "lastName">): string {
  const last = profile.lastName?.trim()[0] ?? "";
  const first = profile.firstName?.trim()[0] ?? "";
  return `${last}${first}`.toUpperCase() || "?";
}

function AvatarBox({ src, initials }: { src: string; initials: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-primary text-3xl font-bold text-primary-foreground shadow-elegant">
      {src && !failed ? (
        <img
          src={src}
          alt="Profile"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
      <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-tl-lg bg-background/95 text-primary">
        <Camera className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
  mono = false,
  className,
}: {
  label: string;
  value?: string | null;
  icon?: ComponentType<{ className?: string }>;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 p-3", className)}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div
        className={cn(
          "min-h-5 break-words text-sm font-medium text-foreground",
          mono && "font-mono",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}
