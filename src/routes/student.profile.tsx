import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
      toast.success(lang === "mn" ? "Хадгалагдлаа" : "Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Профайл" : "Profile"}</h1>
      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Хувийн мэдээлэл" : "Personal information"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "mn" ? "Овог" : "Last name"}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "mn" ? "Нэр" : "First name"}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Имэйл" : "Email"}</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Паспорт дугаар" : "Passport number"}</Label>
              <Input value={form.passportNumber} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Утас" : "Phone"}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Хаяг" : "Address"}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "mn" ? "Хадгалах" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
