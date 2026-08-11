"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Clock3,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AlertBanner, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Planejamento automático",
    delay: "120ms",
  },
  {
    icon: Wallet,
    title: "Banco de horas em tempo real",
    delay: "220ms",
  },
  {
    icon: GraduationCap,
    title: "Integração com aulas",
    delay: "320ms",
  },
] as const;

function FloatingIconField({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
          floating
            ? "text-[color:var(--brand)]"
            : "text-[color:var(--text-muted)]"
        )}
      />
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={cn(
          "field-focusable peer w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] py-3.5 pl-11 pr-3 text-sm text-[color:var(--text)]",
          "placeholder:text-transparent focus:border-[color:var(--brand)]"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-11 origin-left transition-all duration-200",
          floating
            ? "top-1.5 -translate-y-0 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--brand)]"
            : "top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-muted)]"
        )}
      >
        {label}
      </label>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("admin@gestor.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou senha inválidos");
      setErrorKey((k) => k + 1);
      return;
    }
    router.push("/");
    router.refresh();
  }

  function fillDemoCredentials() {
    setEmail("admin@gestor.local");
    setPassword("admin123");
    setError("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[color:var(--background)] lg:flex-row">
      {/* Decorative panel */}
      <aside className="relative flex min-h-[30dvh] flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 px-6 py-8 text-white lg:min-h-dvh lg:w-1/2 lg:px-12 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl lg:h-96 lg:w-96"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-emerald-100/90 backdrop-blur-sm lg:mb-10">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Controle pessoal de jornada
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            Gestor de Jornada
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-50/75 sm:text-base lg:mt-5 lg:text-lg">
            Controle inteligente de jornada, banco de horas e mestrado
          </p>

          <ul className="mt-6 hidden space-y-3 lg:mt-10 lg:block">
            {FEATURES.map(({ icon: Icon, title, delay }) => (
              <li
                key={title}
                className="flex items-center gap-3 opacity-0 animate-slide-up"
                style={{ animationDelay: delay }}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-emerald-50/90">
                  {title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="relative z-10 mt-6 flex items-end justify-end gap-3 opacity-80 lg:mt-0"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/15 shadow-lg shadow-emerald-950/40 lg:h-20 lg:w-20">
            <Clock3 className="h-7 w-7 text-emerald-300 lg:h-10 lg:w-10" />
          </div>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 lg:mb-3 lg:h-14 lg:w-14">
            <BookOpen className="h-5 w-5 text-teal-200 lg:h-6 lg:w-6" />
          </div>
          <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-teal-400/10 lg:mb-8 lg:h-12 lg:w-12">
            <Wallet className="h-4 w-4 text-emerald-200 lg:h-5 lg:w-5" />
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2 lg:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_55%)]"
        />

        <div className="relative w-full max-w-md opacity-0 animate-slide-up">
          <div className="relative rounded-2xl p-[1px] shadow-[var(--shadow-lg)]">
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/50 via-[color:var(--border)] to-teal-500/40"
            />
            <div className="relative rounded-2xl bg-[color:var(--surface)] p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
                  Bem-vindo de volta
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[color:var(--text)] sm:text-3xl">
                  Entrar na conta
                </h2>
                <p className="mt-1.5 text-sm text-[color:var(--text-secondary)]">
                  Use seu email e senha para acessar o painel.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <FloatingIconField
                  id={emailId}
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />
                <FloatingIconField
                  id={passwordId}
                  label="Senha"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  required
                />

                {error ? (
                  <div key={errorKey} className="animate-shake">
                    <AlertBanner type="danger" message={error} />
                  </div>
                ) : null}

                <Button
                  type="submit"
                  loading={loading}
                  className={cn(
                    "w-full border-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20",
                    "hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-900/30",
                    "active:scale-[0.99]"
                  )}
                >
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-[color:var(--text-muted)]">
                Precisa testar?{" "}
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="font-medium text-[color:var(--brand)] underline-offset-2 transition hover:underline"
                >
                  Usar credenciais de demo
                </button>
              </p>
              <p className="mt-1.5 text-center text-[11px] text-[color:var(--text-muted)]">
                admin@gestor.local / admin123
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
