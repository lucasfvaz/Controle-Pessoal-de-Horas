"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
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
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { Tooltip } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/semana": "Semana",
  "/ponto": "Registrar ponto",
  "/aulas": "Aulas",
  "/calendario": "Calendário",
  "/historico": "Histórico",
  "/banco": "Banco de horas",
  "/configuracoes": "Configurações",
};

const principalNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/semana", label: "Semana", icon: CalendarRange },
  { href: "/ponto", label: "Ponto", icon: Clock },
];

const gestaoNav: NavItem[] = [
  { href: "/aulas", label: "Aulas", icon: BookOpen },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/banco", label: "Banco", icon: Wallet },
];

const sistemaNav: NavItem[] = [
  { href: "/configuracoes", label: "Config", icon: Settings },
];

const moreNav: NavItem[] = [
  { href: "/aulas", label: "Aulas", icon: BookOpen },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/banco", label: "Banco", icon: Wallet },
  { href: "/configuracoes", label: "Config", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function currentTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  return match ? PAGE_TITLES[match] : "Dashboard";
}

function NavigationProgress({ pathname }: { pathname: string }) {
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setActive(true);
    setWidth(18);
    const t1 = window.setTimeout(() => setWidth(72), 80);
    const t2 = window.setTimeout(() => setWidth(100), 280);
    const t3 = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 520);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "h-full bg-[color:var(--brand)] transition-[width,opacity] duration-300 ease-out",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function MoreSheet({
  open,
  onClose,
  pathname,
  bankNegative,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  bankNegative: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const requestClose = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setDragY(0);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
      previouslyFocused.current?.focus();
    };
  }, [open, requestClose]);

  if (!open && !leaving) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className={cn(
          "absolute inset-0 bg-[color:var(--overlay)]",
          leaving ? "animate-fade-in opacity-0" : "animate-fade-in"
        )}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl border border-[color:var(--border)] bg-[color:var(--surface)] pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lg)] transition-transform duration-200",
          leaving ? "translate-y-full" : "animate-slide-up"
        )}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (touchStartY.current == null) return;
          const delta = e.touches[0].clientY - touchStartY.current;
          if (delta > 0) setDragY(delta);
        }}
        onTouchEnd={() => {
          if (dragY > 80) requestClose();
          else setDragY(0);
          touchStartY.current = null;
        }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-12 rounded-full bg-[color:var(--border-strong)]" />
        </div>
        <div className="px-5 pb-2 pt-3">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]"
          >
            Mais opções
          </h2>
          <p className="text-xs text-[color:var(--text-muted)]">
            Arraste para baixo ou toque fora para fechar
          </p>
        </div>
        <nav className="space-y-1 px-3 pb-4">
          {moreNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={requestClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                    : "text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)]"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.href === "/banco" && bankNegative ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--status-danger)]" />
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[color:var(--status-danger)] transition-colors hover:bg-[color:var(--status-danger-bg)]"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </nav>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  bankNegative,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  bankNegative: boolean;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-2",
        active
          ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)] shadow-sm"
          : "text-[color:var(--text-secondary)] hover:bg-[color:var(--brand-soft)] hover:text-[color:var(--brand)]"
      )}
    >
      <span className="relative transition-transform duration-200 group-hover:translate-x-0.5">
        <Icon className="h-4 w-4" />
        {item.href === "/banco" && bankNegative ? (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[color:var(--status-danger)] ring-2 ring-[color:var(--surface)]"
            aria-label="Banco negativo"
          />
        ) : null}
      </span>
      {!collapsed ? (
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {item.label}
        </span>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip content={item.label} side="right" delay={120}>
      {link}
    </Tooltip>
  );
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
  bankNegative,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  bankNegative: boolean;
}) {
  return (
    <div className="mb-4">
      {!collapsed ? (
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
          {label}
        </p>
      ) : (
        <div className="mx-auto mb-2 h-px w-6 bg-[color:var(--border)]" />
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            bankNegative={bankNegative}
          />
        ))}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const { resolved, toggle } = useTheme();
  const isLogin = pathname === "/login";

  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bankNegative, setBankNegative] = useState(false);
  const [contentKey, setContentKey] = useState(pathname);

  useEffect(() => {
    setContentKey(pathname);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("gj-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    fetch("/api/bank")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.bank?.saldoAtual != null) {
          setBankNegative(Number(d.bank.saldoAtual) < 0);
        }
      })
      .catch(() => undefined);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gj-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  if (isLogin) {
    return <>{children}</>;
  }

  const title = currentTitle(pathname);
  const moreActive = moreNav.some((i) => isActive(pathname, i.href));

  return (
    <div className="min-h-dvh bg-[color:var(--background)] text-[color:var(--text)] transition-colors duration-300">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--brand-soft) 80%, transparent), transparent 55%)",
        }}
      />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[color:var(--border)] bg-[color:var(--surface-glass)] backdrop-blur-md transition-[width,colors] duration-300 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-60"
        )}
      >
        <div
          className={cn(
            "border-b border-[color:var(--border)] px-4 py-5",
            collapsed && "px-2 text-center"
          )}
        >
          {!collapsed ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[color:var(--brand)]">
                Gestor de Jornada
              </p>
              <p className="mt-1 truncate text-xs text-[color:var(--text-muted)]">
                {data?.user?.name ?? "Controle pessoal"}
              </p>
            </>
          ) : (
            <p className="font-[family-name:var(--font-display)] text-lg text-[color:var(--brand)]">
              GJ
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <NavSection
            label="Principal"
            items={principalNav}
            pathname={pathname}
            collapsed={collapsed}
            bankNegative={bankNegative}
          />
          <NavSection
            label="Gestão"
            items={gestaoNav}
            pathname={pathname}
            collapsed={collapsed}
            bankNegative={bankNegative}
          />
          <NavSection
            label="Sistema"
            items={sistemaNav}
            pathname={pathname}
            collapsed={collapsed}
            bankNegative={bankNegative}
          />
        </nav>

        <div className="space-y-1 border-t border-[color:var(--border)] p-3">
          <Tooltip
            content={collapsed ? "Expandir menu" : "Recolher menu"}
            side="right"
            delay={120}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]",
                collapsed && "justify-center px-2"
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  Recolher
                </>
              )}
            </button>
          </Tooltip>

          <Tooltip
            content={resolved === "dark" ? "Modo claro" : "Modo escuro"}
            side="right"
            delay={120}
          >
            <button
              type="button"
              onClick={toggle}
              aria-label="Alternar tema"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]",
                collapsed && "justify-center px-2"
              )}
            >
              {resolved === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!collapsed
                ? resolved === "dark"
                  ? "Modo claro"
                  : "Modo escuro"
                : null}
            </button>
          </Tooltip>

          <Tooltip content="Sair" side="right" delay={120}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sair"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-muted)]",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed ? "Sair" : null}
            </button>
          </Tooltip>
        </div>
      </aside>

      <div
        className={cn(
          "transition-[padding] duration-300",
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-60"
        )}
      >
        <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--surface-glass)] backdrop-blur-md transition-colors">
          <NavigationProgress pathname={pathname} />
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="min-w-0">
              <div className="lg:hidden">
                <p className="font-[family-name:var(--font-display)] text-lg text-[color:var(--brand)]">
                  Gestor de Jornada
                </p>
              </div>
              <nav
                aria-label="Breadcrumb"
                className="hidden items-center gap-1.5 text-sm text-[color:var(--text-muted)] lg:flex"
              >
                <Link
                  href="/"
                  className="transition-colors hover:text-[color:var(--brand)]"
                >
                  Dashboard
                </Link>
                {pathname !== "/" ? (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    <span className="truncate font-medium text-[color:var(--text)]">
                      {title}
                    </span>
                  </>
                ) : null}
              </nav>
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
                className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-[color:var(--brand-foreground)] shadow-sm transition-colors hover:bg-[color:var(--brand-hover)]"
              >
                <Clock className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                Registrar ponto
              </Link>
            </div>
          </div>
        </header>

        <main
          key={contentKey}
          className="animate-slide-up px-4 py-6 pb-28 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--border)] bg-[color:var(--surface-glass)] px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur lg:hidden"
        aria-label="Navegação principal"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
          <MobileNavLink
            href="/"
            label="Dashboard"
            icon={LayoutDashboard}
            active={isActive(pathname, "/")}
          />
          <MobileNavLink
            href="/semana"
            label="Semana"
            icon={CalendarRange}
            active={isActive(pathname, "/semana")}
          />

          <Link
            href="/ponto"
            aria-label="Registrar ponto"
            aria-current={isActive(pathname, "/ponto") ? "page" : undefined}
            className="relative -mt-5 flex flex-col items-center"
          >
            <span
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand)] text-[color:var(--brand-foreground)] shadow-lg shadow-[color:var(--brand)]/25 transition-transform active:scale-95",
                isActive(pathname, "/ponto") && "ring-4 ring-[color:var(--brand-soft)]"
              )}
            >
              <span className="absolute inset-0 rounded-full animate-pulse-soft bg-[color:var(--brand)]/40" />
              <Plus className="relative h-6 w-6" />
            </span>
            <span
              className={cn(
                "mt-1 text-[10px] font-medium",
                isActive(pathname, "/ponto")
                  ? "text-[color:var(--brand)]"
                  : "text-[color:var(--text-muted)]"
              )}
            >
              Ponto
            </span>
          </Link>

          <MobileNavLink
            href="/calendario"
            label="Calendário"
            icon={CalendarDays}
            active={isActive(pathname, "/calendario")}
          />

          <button
            type="button"
            aria-label="Mais opções"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] transition-colors",
              moreActive || moreOpen
                ? "text-[color:var(--brand)]"
                : "text-[color:var(--text-muted)]"
            )}
          >
            <span className="relative">
              <MoreHorizontal className="h-5 w-5" />
              {bankNegative ? (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[color:var(--status-danger)]" />
              ) : null}
            </span>
            Mais
          </button>
        </div>
      </nav>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        pathname={pathname}
        bankNegative={bankNegative}
      />
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] transition-colors",
        active ? "text-[color:var(--brand)]" : "text-[color:var(--text-muted)]"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
