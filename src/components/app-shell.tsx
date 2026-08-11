"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  BookOpen,
  History,
  Wallet,
  Settings,
  CalendarRange,
  Plus,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { Tooltip } from "@/components/ui";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/semana", label: "Semana", icon: CalendarRange },
  { href: "/ponto", label: "Ponto", icon: Clock },
  { href: "/aulas", label: "Aulas", icon: BookOpen },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/banco", label: "Banco", icon: Wallet },
  { href: "/configuracoes", label: "Config", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const { resolved, toggle } = useTheme();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-[color:var(--background)] text-[color:var(--text)] transition-colors duration-300">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--brand-soft) 80%, transparent), transparent 55%)",
        }}
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface-glass)] backdrop-blur-md transition-colors lg:flex">
        <div className="border-b border-[color:var(--border)] px-5 py-5">
          <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[color:var(--brand)]">
            Gestor de Jornada
          </p>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            {data?.user?.name ?? "Controle pessoal"}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)]"
                    : "text-[color:var(--text-secondary)] hover:bg-[color:var(--brand-soft)] hover:text-[color:var(--brand)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-[color:var(--border)] p-3">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]"
          >
            {resolved === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {resolved === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-muted)]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface-glass)] px-4 py-3 backdrop-blur-md transition-colors lg:px-8">
          <div className="lg:hidden">
            <p className="font-[family-name:var(--font-display)] text-lg text-[color:var(--brand)]">
              Gestor de Jornada
            </p>
          </div>
          <div className="hidden text-sm text-[color:var(--text-muted)] lg:block">
            Jornada · Banco de horas · Mestrado
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={resolved === "dark" ? "Modo claro" : "Modo escuro"}>
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)] lg:hidden"
                aria-label="Alternar tema"
              >
                {resolved === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </Tooltip>
            <Link
              href="/ponto"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-[color:var(--brand-foreground)] shadow-sm transition-colors hover:bg-[color:var(--brand-hover)]"
            >
              <Plus className="h-4 w-4" />
              Registrar ponto
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 pb-28 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--border)] bg-[color:var(--surface-glass)] px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {nav.slice(0, 5).map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] transition-colors",
                  active
                    ? "text-[color:var(--brand)]"
                    : "text-[color:var(--text-muted)]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Link
        href="/ponto"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand)] text-[color:var(--brand-foreground)] shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
        aria-label="Registrar ponto"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
