import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, Lock, Phone, MapPin, CreditCard, Save } from "lucide-react";
import { toast } from "sonner";

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
}

function ProfilePage() {
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    email: "",
    passportNumber: "",
  });

  useEffect(() => {
    void apiGet<ProfileData>("/api/student/profile")
      .then((data) => {
        if (data) {
          setForm({
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            email: data.email ?? "",
            passportNumber: data.passportNumber ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPut("/api/student/profile", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        address: form.address || null,
      });
      toast.success(lang === "mn" ? "Хадгалагдлаа" : "Saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = `${form.lastName?.[0] ?? ""}${form.firstName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {lang === "mn" ? "Профайл" : "Profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "mn"
            ? "Хувийн мэдээллээ удирдах"
            : "Manage your personal information"}
        </p>
      </div>

      {/* Avatar card */}
      <Card className="shadow-card overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-[oklch(0.20_0.08_264)] to-[oklch(0.38_0.16_276)]" />
        <CardContent className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-elegant border-4 border-background">
              {initials}
            </div>
            <div className="pb-1">
              <p className="font-semibold text-foreground">
                {form.lastName} {form.firstName}
              </p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={onSave} className="space-y-4">
        {/* Editable info */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {lang === "mn" ? "Хувийн мэдээлэл" : "Personal information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {lang === "mn" ? "Овог" : "Last name"}
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {lang === "mn" ? "Нэр" : "First name"}
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {lang === "mn" ? "Утас" : "Phone"}
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10"
                placeholder="+976 ..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {lang === "mn" ? "Хаяг" : "Address"}
              </Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Read-only info */}
        <Card className="shadow-card bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {lang === "mn" ? "Өөрчлөх боломжгүй мэдээлэл" : "Read-only information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {lang === "mn" ? "Имэйл" : "Email"}
              </Label>
              <Input value={form.email} disabled className="h-10 bg-muted/50 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                {lang === "mn" ? "Паспорт дугаар" : "Passport number"}
              </Label>
              <Input
                value={form.passportNumber}
                disabled
                className="h-10 bg-muted/50 cursor-not-allowed font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="shadow-soft">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {lang === "mn" ? "Хадгалах" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
