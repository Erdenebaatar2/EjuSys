import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

function ProfilePage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", address: "", email: "", passport_number: "" });

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          email: data.email ?? "",
          passport_number: data.passport_number ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      address: form.address || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "mn" ? "Хадгалагдлаа" : "保存しました");
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Профайл" : "プロフィール"}</h1>
      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Хувийн мэдээлэл" : "個人情報"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "mn" ? "Овог" : "姓"}</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "mn" ? "Нэр" : "名"}</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Имэйл" : "メール"}</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Паспорт дугаар" : "パスポート番号"}</Label>
              <Input value={form.passport_number} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Утас" : "電話"}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mn" ? "Хаяг" : "住所"}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "mn" ? "Хадгалах" : "保存"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
