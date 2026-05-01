import { GraduationCap, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import authBg from "@/assets/picture2.jpg";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  side?: ReactNode;
}

export function AuthLayout({ children, title, subtitle, side }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <img
        src={authBg}
        alt="Mount Fuji with cherry blossoms"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Soft overlay so form stays readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/70 backdrop-blur-[2px]" />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[var(--primary-glow)]/25 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[150px]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT — brand showcase */}
        <div className="relative hidden flex-col items-center justify-center px-12 lg:flex">
          {side ?? <BrandShowcase />}
        </div>

        {/* RIGHT — form */}
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
          { v: "", l: "Сургууль" },
          { v: "", l: "Оюутан" },
          { v: "", l: "Амжилт" },
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
