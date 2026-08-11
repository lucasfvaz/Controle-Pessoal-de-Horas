"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import {
  PageTransition,
  ContentFade,
} from "@/components/motion";
import { useCountUp } from "@/hooks/use-count-up";
import {
  formatDateBR,
  formatMinutesLong,
  getWeekStart,
  todayDateOnly,
} from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  History,
  Pencil,
} from "lucide-react";

type Entry = {
  id: string;
  date: string;
  entryTime: string;
  breakStart: string;
  breakEnd: string;
  exitTime: string;
  workedMinutes: number;
  dayBalanceMinutes: number;
};

type Preset = "today" | "week" | "month" | "3months" | "custom";
type BalanceFilter = "all" | "positive" | "negative";
type SortKey = "date" | "workedMinutes" | "dayBalanceMinutes";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const t = todayDateOnly();
  if (preset === "today") return { from: t, to: t };
  if (preset === "week") {
    const ws = getWeekStart(t);
    const we = new Date(ws + "T00:00:00Z");
    we.setUTCDate(we.getUTCDate() + 6);
    return { from: ws, to: we.toISOString().slice(0, 10) };
  }
  if (preset === "month") return { from: `${t.slice(0, 8)}01`, to: t };
  if (preset === "3months") {
    const [y, m] = t.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 - 2, 1));
    return {
      from: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`,
      to: t,
    };
  }
  return { from: `${t.slice(0, 8)}01`, to: t };
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--brand-foreground)] shadow-sm"
          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
      )}
    >
      {children}
    </button>
  );
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" aria-busy>
      <Skeleton shape="rect" className="h-24" />
      <div className="hidden space-y-2 lg:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} shape="line" className="h-10" />
        ))}
      </div>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} shape="rect" className="h-28" />
        ))}
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  const router = useRouter();
  const initial = rangeForPreset("month");

  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [balance, setBalance] = useState<BalanceFilter>("all");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (balance !== "all") params.set("balance", balance);
      const data = await fetch(`/api/history?${params}`).then((r) => r.json());
      setEntries(Array.isArray(data) ? data : []);
      setPage(1);
      setMobileVisible(PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [from, to, balance]);

  useEffect(() => {
    load();
  }, [load]);

  function selectPreset(next: Preset) {
    setPreset(next);
    if (next === "custom") return;
    const range = rangeForPreset(next);
    setFrom(range.from);
    setTo(range.to);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [entries, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const mobileItems = sorted.slice(0, mobileVisible);

  const summary = useMemo(() => {
    const totalWorked = entries.reduce((s, e) => s + e.workedMinutes, 0);
    const totalBalance = entries.reduce((s, e) => s + e.dayBalanceMinutes, 0);
    return {
      count: entries.length,
      totalWorked,
      totalBalance,
    };
  }, [entries]);

  const countAnim = useCountUp(summary.count);
  const workedAnim = useCountUp(summary.totalWorked);
  const balanceAnim = useCountUp(summary.totalBalance);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Histórico"
        description="Consulte e filtre registros de ponto."
      />

      {/* Filters */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["today", "Hoje"],
              ["week", "Esta semana"],
              ["month", "Este mês"],
              ["3months", "Últimos 3 meses"],
              ["custom", "Personalizado"],
            ] as Array<[Preset, string]>
          ).map(([key, label]) => (
            <Chip
              key={key}
              active={preset === key}
              onClick={() => selectPreset(key)}
            >
              {label}
            </Chip>
          ))}
          <Badge color="slate" className="ml-auto">
            {summary.count} registro{summary.count === 1 ? "" : "s"}
          </Badge>
        </div>

        {preset === "custom" ? (
          <div className="grid gap-3 animate-slide-down sm:grid-cols-2">
            <Input
              label="De"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="Até"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        ) : null}

        <div className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1">
          {(
            [
              ["all", "Todos"],
              ["positive", "Positivo ↑"],
              ["negative", "Negativo ↓"],
            ] as Array<[BalanceFilter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setBalance(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                balance === key
                  ? "bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <Card variant="glass" className="animate-slide-up">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryItem label="Total de registros" value={String(countAnim)} />
          <SummaryItem
            label="Horas trabalhadas"
            value={formatMinutesLong(workedAnim)}
          />
          <SummaryItem
            label="Saldo acumulado"
            value={formatMinutesLong(balanceAnim, true)}
            tone={
              summary.totalBalance >= 0
                ? "text-[color:var(--status-success)]"
                : "text-[color:var(--status-danger)]"
            }
          />
        </div>
      </Card>

      {loading ? (
        <HistorySkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum registro no período selecionado"
          description="Ajuste os filtros ou registre um novo ponto."
          actionLabel="Registrar ponto"
          onAction={() => router.push("/ponto")}
        />
      ) : (
        <ContentFade>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden p-0 lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] text-xs uppercase tracking-wide text-[color:var(--text-muted)] backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => toggleSort("date")}
                      >
                        Data
                        <SortIcon active={sortKey === "date"} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Intervalo</th>
                    <th className="px-4 py-3">Retorno</th>
                    <th className="px-4 py-3">Saída</th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => toggleSort("workedMinutes")}
                      >
                        Trabalhado
                        <SortIcon
                          active={sortKey === "workedMinutes"}
                          dir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => toggleSort("dayBalanceMinutes")}
                      >
                        Saldo
                        <SortIcon
                          active={sortKey === "dayBalanceMinutes"}
                          dir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => (
                    <tr
                      key={e.id}
                      className="table-row-interactive border-b border-[color:var(--border)]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {formatDateBR(e.date)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{e.entryTime}</td>
                      <td className="px-4 py-3 tabular-nums">{e.breakStart}</td>
                      <td className="px-4 py-3 tabular-nums">{e.breakEnd}</td>
                      <td className="px-4 py-3 tabular-nums">{e.exitTime}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatMinutesLong(e.workedMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={e.dayBalanceMinutes >= 0 ? "emerald" : "rose"}
                          size="sm"
                        >
                          {formatMinutesLong(e.dayBalanceMinutes, true)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ponto?id=${e.id}`}
                          className="text-[color:var(--brand)] hover:underline"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border)] px-4 py-3">
              <p className="text-xs text-[color:var(--text-muted)]">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {mobileItems.map((e, i) => (
              <Card
                key={e.id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--text)]">
                      {formatDateBR(e.date)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-[color:var(--text-muted)]">
                      {e.entryTime} → {e.breakStart} → {e.breakEnd} → {e.exitTime}
                    </p>
                  </div>
                  <Link
                    href={`/ponto?id=${e.id}`}
                    aria-label="Editar ponto"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--brand)] transition-colors hover:bg-[color:var(--brand-soft)]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
                      Trabalhado
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatMinutesLong(e.workedMinutes)}
                    </p>
                  </div>
                  <Badge color={e.dayBalanceMinutes >= 0 ? "emerald" : "rose"}>
                    {formatMinutesLong(e.dayBalanceMinutes, true)}
                  </Badge>
                </div>
              </Card>
            ))}

            {mobileVisible < sorted.length ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setMobileVisible((v) => v + PAGE_SIZE)}
              >
                Carregar mais
              </Button>
            ) : null}
          </div>
        </ContentFade>
      )}
    </PageTransition>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums text-[color:var(--text)]",
          tone
        )}
      >
        {value}
      </p>
    </div>
  );
}
