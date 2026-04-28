import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Нууц үг сэргээх | EJU" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "mn" ? "Имэйл илгээгдлээ" : "Reset email sent", {
      description: lang === "mn" ? "Имэйл хайрцгаа шалгана уу" : "Please check your inbox.",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero text-primary-foreground shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">EJU</span>
          </Link>
          <LangSwitcher />
        </div>
        <Card className="shadow-elegant border-border">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "Нууц үг сэргээх" : "Reset password"}</CardTitle>
            <CardDescription>
              {lang === "mn"
                ? "Бүртгэлтэй имэйлээ оруулна уу"
                : "Enter the email linked to your account."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{lang === "mn" ? "Имэйл" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lang === "mn" ? "Холбоос илгээх" : "Send reset link"}
              </Button>
              <Link to="/login" className="text-xs text-primary hover:underline">
                ← {lang === "mn" ? "Буцах" : "Back"}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
