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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

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
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_#e8f0ea_0%,_#f4f6f5_45%,_#eef1f4_100%)] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-md lg:flex">
        <div className="border-b border-slate-100 px-5 py-5">
          <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-emerald-900">
            Gestor de Jornada
          </p>
          <p className="mt-1 text-xs text-slate-500">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-emerald-800 text-white"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="lg:hidden">
            <p className="font-[family-name:var(--font-display)] text-lg text-emerald-900">
              Gestor de Jornada
            </p>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">
            Jornada · Banco de horas · Mestrado
          </div>
          <Link
            href="/ponto"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Registrar ponto
          </Link>
        </header>

        <main className="px-4 py-6 pb-28 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
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
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]",
                  active ? "text-emerald-800" : "text-slate-500"
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
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800 text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-700 lg:hidden"
        aria-label="Registrar ponto"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
