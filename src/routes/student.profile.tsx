import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, uploadPhoto } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  Edit3,
  ImageUp,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
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

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  profilePhotoPath: string;
}

function ProfilePage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(() => emptyEditForm());
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [savedPhotoPreviewUrl, setSavedPhotoPreviewUrl] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiGet<ProfileData>("/api/student/profile"),
  });

  const saveMut = useMutation({
    mutationFn: (payload: EditForm) =>
      apiPut<ProfileData>("/api/student/profile", {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone || null,
        address: payload.address || null,
        profilePhotoPath: payload.profilePhotoPath || null,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["student", "profile"], updated);
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
      if (photoPreviewUrl) setSavedPhotoPreviewUrl(photoPreviewUrl);
      setEditOpen(false);
      toast.success(lang === "mn" ? "Профайл хадгалагдлаа" : "Profile saved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const uploadMut = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (path) => {
      setEditForm((current) => ({ ...current, profilePhotoPath: path }));
      toast.success(lang === "mn" ? "Зураг амжилттай орлоо" : "Photo uploaded");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  useEffect(() => {
    return () => {
      if (photoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
      if (savedPhotoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(savedPhotoPreviewUrl);
    };
  }, [photoPreviewUrl, savedPhotoPreviewUrl]);

  function openEditor() {
    if (!profile) return;
    setEditForm({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      profilePhotoPath: profile.profilePhotoPath ?? "",
    });
    setPhotoPreviewUrl("");
    setEditOpen(true);
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    saveMut.mutate(editForm);
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
  const avatarSrc = savedPhotoPreviewUrl || mediaUrl(profile.profilePhotoPath);
  const editAvatarSrc = photoPreviewUrl || mediaUrl(editForm.profilePhotoPath);
  const contactComplete = Boolean(profile.phone && profile.address);
  const photoComplete = Boolean(profile.profilePhotoPath || savedPhotoPreviewUrl);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={UserRound}
        eyebrow={lang === "mn" ? "Оюутны профайл" : "Student profile"}
        title={lang === "mn" ? "Профайл" : "Profile"}
        description={
          lang === "mn"
            ? "Нэр, холбоо барих мэдээлэл, цээж зураг болон паспортын мэдээллээ хянах хэсэг."
            : "Review your name, contact details, profile photo, and passport information."
        }
        actions={
          <Button type="button" onClick={openEditor}>
            <Edit3 className="h-4 w-4" />
            {lang === "mn" ? "Профайл засах" : "Edit profile"}
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
          icon={ImageUp}
          label={lang === "mn" ? "Цээж зураг" : "Photo"}
          value={
            photoComplete
              ? lang === "mn"
                ? "Оруулсан"
                : "Added"
              : lang === "mn"
                ? "Дутуу"
                : "Missing"
          }
          helper={lang === "mn" ? "Бүртгэлд ашиглагдана" : "Used for applications"}
          tone={photoComplete ? "blue" : "amber"}
        />
        <StudentMetricCard
          icon={CreditCard}
          label={lang === "mn" ? "Паспорт" : "Passport"}
          value={profile.passportNumber || "-"}
          helper={lang === "mn" ? "Бүртгүүлэхэд оруулсан дугаар" : "Entered at registration"}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <StudentPanel contentClassName="p-0">
          <div className="flex flex-col items-center p-6 text-center">
            <AvatarBox src={avatarSrc} initials={initials} size="lg" />
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
                label={lang === "mn" ? "Паспорт дугаар" : "Passport number"}
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
                ? "Админ тал дээр харагдах үндсэн мэдээлэл."
                : "Core information visible to administrators."
            }
            actions={
              <Button type="button" variant="outline" size="sm" onClick={openEditor}>
                <Edit3 className="h-4 w-4" />
                {lang === "mn" ? "Засах" : "Edit"}
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
                className="sm:col-span-2"
                icon={Phone}
                label={lang === "mn" ? "Утас" : "Phone"}
                value={profile.phone}
              />
              <ReadOnlyField
                className="sm:col-span-2"
                icon={MapPin}
                label={lang === "mn" ? "Хаяг" : "Address"}
                value={profile.address}
              />
            </div>
          </StudentPanel>

          <StudentPanel
            title={lang === "mn" ? "Өөрчлөх боломжгүй мэдээлэл" : "Read-only information"}
            description={
              lang === "mn"
                ? "Имэйл болон паспортын дугаар нь бүртгэлийн аюулгүй байдлын мэдээлэл."
                : "Email and passport number are protected account details."
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnlyField
                icon={Mail}
                label={lang === "mn" ? "Имэйл" : "Email"}
                value={profile.email}
              />
              <ReadOnlyField
                icon={Lock}
                label={lang === "mn" ? "Паспорт дугаар" : "Passport number"}
                value={profile.passportNumber}
                mono
              />
            </div>
          </StudentPanel>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={onSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{lang === "mn" ? "Профайл засах" : "Edit profile"}</DialogTitle>
              <DialogDescription>
                {lang === "mn"
                  ? "Зураг, нэр, утас болон хаягаа шинэчилнэ."
                  : "Update your photo, name, phone, and address."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4">
              <AvatarBox src={editAvatarSrc} initials={initialsFor(editForm)} size="md" editable />
              <div>
                <Label
                  htmlFor="profile-photo"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  {uploadMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {lang === "mn" ? "Зураг оруулах" : "Upload photo"}
                </Label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  disabled={uploadMut.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      const preview = URL.createObjectURL(file);
                      setPhotoPreviewUrl((previous) => {
                        if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
                        return preview;
                      });
                      uploadMut.mutate(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">JPG/PNG, 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <EditField label={lang === "mn" ? "Овог" : "Last name"}>
                <Input
                  value={editForm.lastName}
                  onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })}
                  required
                />
              </EditField>
              <EditField label={lang === "mn" ? "Нэр" : "First name"}>
                <Input
                  value={editForm.firstName}
                  onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })}
                  required
                />
              </EditField>
            </div>

            <EditField label={lang === "mn" ? "Утас" : "Phone"} icon={Phone}>
              <Input
                value={editForm.phone}
                onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
                placeholder="+976 ..."
              />
            </EditField>

            <EditField label={lang === "mn" ? "Хаяг" : "Address"} icon={MapPin}>
              <Input
                value={editForm.address}
                onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
              />
            </EditField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {lang === "mn" ? "Болих" : "Cancel"}
              </Button>
              <Button type="submit" disabled={saveMut.isPending || uploadMut.isPending}>
                {saveMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {lang === "mn" ? "Хадгалах" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function emptyEditForm(): EditForm {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    profilePhotoPath: "",
  };
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

function initialsFor(profile: Pick<ProfileData, "firstName" | "lastName"> | EditForm): string {
  const last = profile.lastName?.trim()[0] ?? "";
  const first = profile.firstName?.trim()[0] ?? "";
  return `${last}${first}`.toUpperCase() || "?";
}

function AvatarBox({
  src,
  initials,
  size,
  editable = false,
}: {
  src: string;
  initials: string;
  size: "md" | "lg";
  editable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "lg" ? "h-24 w-24 text-3xl" : "h-16 w-16 text-xl";

  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-primary font-bold text-primary-foreground shadow-elegant",
        sizeClass,
      )}
    >
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
      {editable ? (
        <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-tl-lg bg-background/95 text-primary">
          <Camera className="h-3.5 w-3.5" />
        </div>
      ) : null}
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

function EditField({
  label,
  children,
  icon: Icon,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </Label>
      {children}
    </div>
  );
}
