"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Skeleton,
  TextArea,
  useToast,
} from "@/components/ui";
import {
  PageTransition,
  Reveal,
  ContentFade,
} from "@/components/motion";
import { useCountUp } from "@/hooks/use-count-up";
import {
  calcularHorasTrabalhadas,
  calcularSaldoDia,
  metaDiariaReferencia,
} from "@/domain/journey";
import {
  addMinutesToHHMM,
  formatHHMM,
  formatMinutesLong,
  isValidHHMM,
  parseHHMM,
  parseWorkDays,
  todayDateOnly,
} from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";

type FieldKey = "entryTime" | "breakStart" | "breakEnd" | "exitTime";

function nowHHMM(): string {
  const d = new Date();
  return formatHHMM(d.getHours() * 60 + d.getMinutes());
}

function maskTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function normalizeHHMM(value: string): string | null {
  if (!isValidHHMM(value)) return null;
  return value;
}

function TimeField({
  label,
  value,
  onChange,
  error,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [flash, setFlash] = useState(false);

  function commit(next: string) {
    onChange(next);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }

  function adjust(delta: number) {
    try {
      commit(addMinutesToHHMM(isValidHHMM(value) ? value : "08:00", delta));
    } catch {
      commit(addMinutesToHHMM("08:00", delta));
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div
        className={cn(
          "rounded-xl border bg-[color:var(--surface)] p-2 transition-all duration-200",
          error
            ? "border-[color:var(--status-danger)]"
            : "border-[color:var(--border)]",
          flash && "ring-2 ring-[color:var(--ring)] scale-[1.01]"
        )}
      >
        <input
          inputMode="numeric"
          placeholder="HH:MM"
          value={value}
          onChange={(e) => commit(maskTimeInput(e.target.value))}
          onBlur={() => {
            const n = normalizeHHMM(value);
            if (n) commit(n);
          }}
          className="w-full bg-transparent px-2 py-1.5 text-center text-lg font-semibold tabular-nums text-[color:var(--text)] outline-none"
          aria-invalid={Boolean(error)}
          aria-label={label}
        />
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          <button
            type="button"
            onClick={() => commit(nowHHMM())}
            className="rounded-lg bg-[color:var(--brand-soft)] px-2 py-1 text-[10px] font-medium text-[color:var(--brand)] transition-colors hover:opacity-90"
          >
            Agora
          </button>
          <button
            type="button"
            onClick={() => adjust(-30)}
            className="inline-flex items-center gap-0.5 rounded-lg bg-[color:var(--surface-muted)] px-2 py-1 text-[10px] font-medium text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--border)]"
          >
            <Minus className="h-3 w-3" />
            30min
          </button>
          <button
            type="button"
            onClick={() => adjust(30)}
            className="inline-flex items-center gap-0.5 rounded-lg bg-[color:var(--surface-muted)] px-2 py-1 text-[10px] font-medium text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--border)]"
          >
            <Plus className="h-3 w-3" />
            30min
          </button>
        </div>
      </div>
      {error ? (
        <span className="text-xs text-[color:var(--status-danger)]">{error}</span>
      ) : null}
    </div>
  );
}

function TimelineDot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand)] ring-4 ring-[color:var(--brand-soft)]" />
      <span className="text-[9px] uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

function PontoSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy>
      <div className="space-y-2">
        <Skeleton shape="line" className="h-8 w-56" />
        <Skeleton shape="line" className="h-4 w-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card variant="glass" className="space-y-4">
          <Skeleton shape="rect" className="h-12" />
          <Skeleton shape="rect" className="h-28" />
          <Skeleton shape="rect" className="h-28" />
          <Skeleton shape="rect" className="h-24" />
        </Card>
        <Card className="space-y-4">
          <Skeleton shape="circle" className="mx-auto h-28 w-28" />
          <Skeleton shape="rect" className="h-16" />
          <Skeleton shape="rect" className="h-16" />
        </Card>
      </div>
    </div>
  );
}

function PunchForm() {
  const router = useRouter();
  const search = useSearchParams();
  const editId = search.get("id");
  const { toast } = useToast();

  const [date, setDate] = useState(todayDateOnly());
  const [entryTime, setEntryTime] = useState("08:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [exitTime, setExitTime] = useState("17:30");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(480);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [canUsePlanner, setCanUsePlanner] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      try {
        const settings = await fetch("/api/settings").then((r) => r.json());
        const goal = metaDiariaReferencia(
          settings.weeklyGoalMinutes ?? 2400,
          parseWorkDays(settings.workDays ?? "1,2,3,4,5").length
        );
        if (!cancelled) setDailyGoal(goal);

        if (editId) {
          const entry = await fetch(`/api/punches/${editId}`).then((r) =>
            r.json()
          );
          if (!cancelled && !entry.error) {
            setDate(entry.date);
            setEntryTime(entry.entryTime);
            setBreakStart(entry.breakStart);
            setBreakEnd(entry.breakEnd);
            setExitTime(entry.exitTime);
            setNotes(entry.notes ?? "");
          }
        } else if (!cancelled) {
          const today = todayDateOnly();
          setDate(today);
          setEntryTime(settings.defaultEntry);
          setExitTime(settings.defaultExit);
          const startMin = parseHHMM(settings.defaultEntry);
          const mid = startMin + 240;
          setBreakStart(formatHHMM(mid));
          setBreakEnd(
            formatHHMM(mid + (settings.defaultBreakMinutes ?? 60))
          );
          setCanUsePlanner(true);
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const preview = useMemo(() => {
    try {
      if (
        !isValidHHMM(entryTime) ||
        !isValidHHMM(breakStart) ||
        !isValidHHMM(breakEnd) ||
        !isValidHHMM(exitTime)
      ) {
        return null;
      }
      return calcularHorasTrabalhadas({
        entryTime,
        breakStart,
        breakEnd,
        exitTime,
      });
    } catch {
      return null;
    }
  }, [entryTime, breakStart, breakEnd, exitTime]);

  const dayBalance = preview
    ? calcularSaldoDia(preview.totalMinutos, dailyGoal)
    : null;

  const totalAnim = useCountUp(preview?.totalMinutos ?? 0);
  const balanceAnim = useCountUp(dayBalance ?? 0);

  const goalPct = preview
    ? Math.min(100, Math.round((preview.totalMinutos / Math.max(1, dailyGoal)) * 100))
    : 0;

  const periodMax = preview
    ? Math.max(preview.periodo1, preview.periodo2, 1)
    : 1;

  function validateFields(): boolean {
    const errors: Partial<Record<FieldKey, string>> = {};
    const fields: Array<[FieldKey, string]> = [
      ["entryTime", entryTime],
      ["breakStart", breakStart],
      ["breakEnd", breakEnd],
      ["exitTime", exitTime],
    ];
    for (const [key, val] of fields) {
      if (!isValidHHMM(val)) errors[key] = "Use o formato HH:MM";
    }
    if (Object.keys(errors).length === 0) {
      try {
        calcularHorasTrabalhadas({
          entryTime,
          breakStart,
          breakEnd,
          exitTime,
        });
      } catch {
        errors.entryTime = "Ordem inválida das batidas";
        errors.breakStart = "Verifique a sequência";
        errors.breakEnd = "Verifique a sequência";
        errors.exitTime = "Verifique a sequência";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function applyPlannerSuggestion() {
    setPlannerLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/planning?week=${date}`).then((r) =>
        r.json()
      );
      const sugestoes = res?.planning?.sugestoes ?? [];
      const todaySug = sugestoes.find(
        (s: { data: string }) => s.data === date
      ) ?? sugestoes[0];

      if (!todaySug?.blocos?.length) {
        toast({
          variant: "warning",
          message: "Nenhuma sugestão disponível para esta data.",
        });
        return;
      }

      const blocos = todaySug.blocos as Array<{ inicio: string; fim: string }>;
      if (blocos.length >= 2) {
        setEntryTime(blocos[0].inicio);
        setBreakStart(blocos[0].fim);
        setBreakEnd(blocos[1].inicio);
        setExitTime(blocos[blocos.length - 1].fim);
      } else {
        const b = blocos[0];
        setEntryTime(b.inicio);
        const mid =
          parseHHMM(b.inicio) +
          Math.floor((parseHHMM(b.fim) - parseHHMM(b.inicio)) / 2);
        setBreakStart(formatHHMM(mid));
        setBreakEnd(formatHHMM(mid + 60));
        setExitTime(b.fim);
      }
      toast({
        variant: "success",
        title: "Sugestão aplicada",
        message: "Horários preenchidos com o planejador.",
      });
    } catch {
      toast({ variant: "error", message: "Falha ao buscar sugestão." });
    } finally {
      setPlannerLoading(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateFields()) {
      setError("Corrija os horários antes de salvar.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      date,
      entryTime,
      breakStart,
      breakEnd,
      exitTime,
      notes: notes || null,
    };
    const res = await fetch(editId ? `/api/punches/${editId}` : "/api/punches", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "Não foi possível salvar. Verifique as batidas."
      );
      toast({ variant: "error", message: "Falha ao salvar o ponto." });
      return;
    }
    toast({
      variant: "success",
      title: "Ponto salvo",
      message: editId
        ? "Registro atualizado."
        : "Batidas registradas com sucesso.",
    });
    router.push("/semana");
    router.refresh();
  }

  async function confirmDelete() {
    if (!editId) return;
    setDeleting(true);
    const res = await fetch(`/api/punches/${editId}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmOpen(false);
    if (!res.ok) {
      setError("Falha ao apagar");
      toast({ variant: "error", message: "Não foi possível apagar." });
      return;
    }
    toast({ variant: "success", message: "Registro apagado." });
    router.push("/historico");
  }

  if (loading) {
    return (
      <PageTransition>
        <PontoSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ContentFade>
      <PageHeader
        title={editId ? "Editar ponto" : "Registrar ponto"}
        description="Informe as quatro batidas. O cálculo usa os dois períodos de trabalho."
        action={
          !editId && canUsePlanner ? (
            <Button
              type="button"
              variant="outline"
              loading={plannerLoading}
              onClick={applyPlannerSuggestion}
            >
              <Sparkles className="h-4 w-4" />
              Usar sugestão do planejador
            </Button>
          ) : null
        }
      />

      <form
        onSubmit={onSave}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <Card variant="glass" className="space-y-5 animate-slide-up">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Timeline row 1 */}
          <div className="relative">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-0.5 bg-[color:var(--border)] sm:block" />
            <div className="mb-2 hidden justify-between px-[10%] sm:flex">
              <TimelineDot label="Início" />
              <TimelineDot label="Intervalo" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TimeField
                label="Entrada"
                value={entryTime}
                onChange={setEntryTime}
                error={fieldErrors.entryTime}
                icon={LogIn}
              />
              <TimeField
                label="Saída intervalo"
                value={breakStart}
                onChange={setBreakStart}
                error={fieldErrors.breakStart}
                icon={Coffee}
              />
            </div>
          </div>

          {/* Timeline row 2 */}
          <div className="relative">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-0.5 bg-[color:var(--border)] sm:block" />
            <div className="mb-2 hidden justify-between px-[10%] sm:flex">
              <TimelineDot label="Retorno" />
              <TimelineDot label="Fim" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TimeField
                label="Retorno intervalo"
                value={breakEnd}
                onChange={setBreakEnd}
                error={fieldErrors.breakEnd}
                icon={Coffee}
              />
              <TimeField
                label="Saída"
                value={exitTime}
                onChange={setExitTime}
                error={fieldErrors.exitTime}
                icon={LogOut}
              />
            </div>
          </div>

          <TextArea
            label="Observações"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error ? (
            <p className="text-sm text-[color:var(--status-danger)]">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            {editId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setConfirmOpen(true)}
              >
                Apagar
              </Button>
            ) : null}
          </div>
        </Card>

        <Reveal>
          <Card className="h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[color:var(--text)]">
                Resumo visual
              </h2>
              <Clock className="h-4 w-4 text-[color:var(--text-muted)]" />
            </div>

            {preview ? (
              <div className="mt-5 space-y-5 transition-all duration-300">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <ProgressRing
                    value={preview.totalMinutos}
                    max={dailyGoal}
                    size={112}
                    strokeWidth={10}
                    label="meta dia"
                  />
                  <div className="w-full space-y-2">
                    <ProgressBar value={goalPct} showLabel />
                    <p className="text-xs text-[color:var(--text-muted)]">
                      Meta diária ref.: {formatMinutesLong(dailyGoal)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 transition-colors">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="uppercase text-[color:var(--text-muted)]">
                        Período 1
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatMinutesLong(preview.periodo1)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-[color:var(--text-secondary)]">
                      {entryTime} → {breakStart}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--brand)] transition-all duration-500"
                        style={{
                          width: `${(preview.periodo1 / periodMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 transition-colors">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="uppercase text-[color:var(--text-muted)]">
                        Período 2
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatMinutesLong(preview.periodo2)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-[color:var(--text-secondary)]">
                      {breakEnd} → {exitTime}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--brand-hover)] transition-all duration-500"
                        style={{
                          width: `${(preview.periodo2 / periodMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--brand-soft)] px-4 py-4">
                  <p className="text-xs uppercase text-[color:var(--text-muted)]">
                    Total trabalhado
                  </p>
                  <p
                    key={preview.totalMinutos}
                    className="mt-1 text-3xl font-semibold tabular-nums text-[color:var(--brand)] animate-fade-in"
                  >
                    {formatMinutesLong(totalAnim)}
                  </p>
                  {dayBalance != null ? (
                    <p
                      className={cn(
                        "mt-2 text-sm font-medium tabular-nums transition-colors",
                        dayBalance >= 0
                          ? "text-[color:var(--status-success)]"
                          : "text-[color:var(--status-danger)]"
                      )}
                    >
                      Saldo do dia: {formatMinutesLong(balanceAnim, true)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[color:var(--status-warning)]">
                Ordem inválida das batidas. Esperado: Entrada &lt; Saída intervalo ≤
                Retorno &lt; Saída.
              </p>
            )}
          </Card>
        </Reveal>
      </form>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Apagar registro?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={confirmDelete}
            >
              Apagar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-secondary)]">
          Esta ação não pode ser desfeita. O histórico de auditoria será
          mantido.
        </p>
      </Modal>
      </ContentFade>
    </PageTransition>
  );
}

export default function PontoPage() {
  return (
    <Suspense
      fallback={
        <PageTransition>
          <PontoSkeleton />
        </PageTransition>
      }
    >
      <PunchForm />
    </Suspense>
  );
}
