import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LangContext";
import { statusLabel } from "@/lib/eju-format";

export function StatusBadge({ status }: { status: string }) {
  const { lang } = useLang();
  const label = statusLabel(status, lang);

  const cls =
    status === "approved"
      ? "bg-success/15 text-success border-success/30 hover:bg-success/15"
      : status === "rejected"
      ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
      : status === "paid"
      ? "bg-success/15 text-success border-success/30 hover:bg-success/15"
      : status === "unpaid"
      ? "bg-muted text-muted-foreground border-border hover:bg-muted"
      : "bg-warning/15 text-warning-foreground border-warning/30 hover:bg-warning/15";

  return <Badge variant="outline" className={cls}>{label}</Badge>;
}
