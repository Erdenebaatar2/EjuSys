import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Шинэ нууц үг | EJU" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(lang === "mn" ? "Нууц үг тохирохгүй байна" : "パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      toast.error(lang === "mn" ? "Хамгийн багадаа 8 тэмдэгт" : "8文字以上必要です");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "mn" ? "Нууц үг шинэчлэгдлээ" : "パスワードを更新しました");
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-elegant border-border">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Шинэ нууц үг" : "新しいパスワード"}</CardTitle>
          <CardDescription>
            {lang === "mn" ? "Шинэ нууц үгээ оруулна уу" : "新しいパスワードを入力"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">{lang === "mn" ? "Шинэ нууц үг" : "新しいパスワード"}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">{lang === "mn" ? "Давтах" : "確認"}</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "mn" ? "Шинэчлэх" : "更新"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
