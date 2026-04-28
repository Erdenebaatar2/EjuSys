import { GraduationCap, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  side?: ReactNode;
}

export function AuthLayout({ children, title, subtitle, side }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--gradient-bg)]">
      <NetworkBackground />

      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/25 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[var(--primary-glow)]/30 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[150px]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col items-center justify-center px-12 lg:flex">
          {side ?? <BrandShowcase />}
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--primary-glow)] shadow-[var(--shadow-glow)]">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">EJU</span>
          </div>

          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-[var(--shadow-card)] backdrop-blur-2xl">
              <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandShowcase() {
  return (
    <div className="relative flex w-full max-w-lg flex-col items-center text-center">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5" />
        日本留学への第一歩
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/30 to-[var(--primary-glow)]/30 blur-3xl" />
        <div className="flex items-center gap-4 rounded-[2rem] bg-gradient-to-br from-primary to-[var(--primary-glow)] px-10 py-6 shadow-[var(--shadow-glow)]">
          <SakuraIcon className="h-14 w-14 text-white" />
          <span className="text-6xl font-black tracking-tight text-white">EJU</span>
        </div>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Examination for Japanese University
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        この試験は日本への私費留学を希望する人々の日本語力、
        <br />
        基礎学力を測定するための試験です。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Японы их дээд сургуульд элсэх шалгалтын бүртгэл
      </p>

      <div className="mt-10 grid w-full grid-cols-3 gap-3">
        {[
          { v: "20+", l: "Сургууль" },
          { v: "5,000+", l: "Оюутан" },
          { v: "98%", l: "Амжилт" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-white/50 bg-white/60 px-3 py-4 backdrop-blur-md"
          >
            <div className="text-xl font-bold text-primary">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SakuraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * 72 * Math.PI) / 180;
        const cx = 50 + Math.cos(angle - Math.PI / 2) * 22;
        const cy = 50 + Math.sin(angle - Math.PI / 2) * 22;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="14"
            ry="20"
            transform={`rotate(${i * 72} ${cx} ${cy})`}
            opacity="0.95"
          />
        );
      })}
      <circle cx="50" cy="50" r="6" fill="oklch(0.85 0.15 90)" />
    </svg>
  );
}

function NetworkBackground() {
  const cols = 9;
  const rows = 7;
  const nodes: { x: number; y: number; r: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 1000 + c * 137;
      const jx = (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 6;
      const jy = (((seed * 4817 + 12345) % 233280) / 233280 - 0.5) * 6;
      nodes.push({
        x: (c / (cols - 1)) * 100 + jx,
        y: (r / (rows - 1)) * 100 + jy,
        r: 0.3 + ((seed % 5) / 10),
      });
    }
  }

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; o: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 18) {
        lines.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          o: 1 - dist / 18,
        });
      }
    }
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow">
          <stop offset="0%" stopColor="oklch(0.55 0.22 255)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 255)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lines.map((l, i) => (
        <line
          key={`l-${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="oklch(0.55 0.22 255)"
          strokeWidth="0.07"
          opacity={l.o * 0.4}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={`n-${i}`}>
          <circle cx={n.x} cy={n.y} r={n.r * 4} fill="url(#nodeGlow)" opacity="0.5">
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur={`${4 + (i % 5)}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={n.x} cy={n.y} r={n.r} fill="oklch(0.5 0.22 255)" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
