"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Toggle,
  useToast,
} from "@/components/ui";
import {
  PageTransition,
  RevealStagger,
  ContentFade,
} from "@/components/motion";
import {
  formatDateBR,
  formatMinutesLong,
  WEEKDAY_NAMES,
} from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  Bot,
  CalendarDays,
  ChevronDown,
  Clock,
  Coffee,
  Plus,
  Settings2,
  Wallet,
  X,
} from "lucide-react";

type Settings = {
  weeklyGoalMinutes: number;
  workDays: string;
  defaultEntry: string;
  defaultExit: string;
  defaultBreakMinutes: number;
  allowCompensation: boolean;
  maxDailyMinutes: number;
  suggestionWindowStart: string;
  suggestionWindowEnd: string;
  bankOpeningBalanceMinutes: number;
};

type Holiday = { id: string; date: string; name: string; type: string };

function minutesToHHMM(total: number): string {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmSignedToMinutes(value: string): number {
  const neg = value.startsWith("-");
  const raw = neg ? value.slice(1) : value;
  const [h, m] = raw.split(":").map(Number);
  const mins = (h || 0) * 60 + (m || 0);
  return neg ? -mins : mins;
}

function formatFriendlyMinutes(total: number) {
  const abs = Math.abs(Math.round(total));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = total < 0 ? "-" : "";
  return `${sign}${h}h ${String(m).padStart(2, "0")}min`;
}

function parseWorkDaysSet(workDays: string): Set<number> {
  return new Set(
    workDays
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => n >= 1 && n <= 7)
  );
}

function serializeWorkDays(days: Set<number>): string {
  return [...days].sort((a, b) => a - b).join(",");
}

const TYPE_META: Record<
  string,
  { label: string; color: "violet" | "emerald" | "amber" | "sky" }
> = {
  holiday: { label: "Feriado", color: "violet" },
  vacation: { label: "Férias", color: "emerald" },
  day_off: { label: "Folga", color: "amber" },
  leave: { label: "Licença", color: "sky" },
};

function AccordionSection({
  id,
  icon: Icon,
  title,
  description,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card interactive={false} className="overflow-hidden p-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`section-${id}`}
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[color:var(--surface-muted)]"
      >
        <span className="mt-0.5 rounded-xl bg-[color:var(--brand-soft)] p-2.5 text-[color:var(--brand)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[color:var(--text)]">{title}</p>
          <p className="mt-0.5 text-sm text-[color:var(--text-muted)]">
            {description}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        id={`section-${id}`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-[color:var(--border)] px-5 py-5",
              open && "animate-slide-down"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MinutesSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 15,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const hours = Math.floor(Math.abs(value) / 60);
  const mins = Math.abs(value) % 60;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-[color:var(--brand)]">
          {formatFriendlyMinutes(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--brand)]"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={Math.floor(max / 60)}
          value={hours}
          onChange={(e) => {
            const h = Math.max(0, Number(e.target.value) || 0);
            onChange(h * 60 + mins);
          }}
          className="w-20 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          aria-label={`${label} horas`}
        />
        <span className="text-xs text-[color:var(--text-muted)]">h</span>
        <input
          type="number"
          min={0}
          max={59}
          step={step >= 15 ? 15 : 1}
          value={mins}
          onChange={(e) => {
            const m = Math.min(59, Math.max(0, Number(e.target.value) || 0));
            onChange(hours * 60 + m);
          }}
          className="w-20 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          aria-label={`${label} minutos`}
        />
        <span className="text-xs text-[color:var(--text-muted)]">min</span>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" aria-busy>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} shape="rect" className="h-24" />
      ))}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<Settings | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    jornada: true,
    pausas: false,
    banco: false,
    planejador: false,
    feriados: false,
  });
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidayModal, setHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
    type: "holiday",
  });
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [deleteHoliday, setDeleteHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState(false);

  const loadSettings = useCallback(async () => {
    const s: Settings = await fetch("/api/settings").then((r) => r.json());
    setForm(s);
    setDirty(false);
  }, []);

  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const data = await fetch("/api/holidays").then((r) => r.json());
      setHolidays(Array.isArray(data) ? data : []);
    } finally {
      setHolidaysLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadHolidays();
  }, [loadSettings, loadHolidays]);

  const saveSettings = useCallback(
    async (next?: Settings, opts?: { quiet?: boolean }) => {
      const payload = next ?? form;
      if (!payload) return false;
      setSaving(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({
            variant: "error",
            message: "Não foi possível salvar. Verifique os campos.",
          });
          return false;
        }
        setForm(data);
        setDirty(false);
        if (!opts?.quiet) {
          toast({
            variant: "success",
            title: "Configurações salvas",
            message: `Meta semanal: ${formatMinutesLong(data.weeklyGoalMinutes)}.`,
          });
        }
        return true;
      } finally {
        setSaving(false);
      }
    },
    [form, toast]
  );

  function patchForm(partial: Partial<Settings>) {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, ...partial };
    });
    setDirty(true);
  }

  useEffect(() => {
    if (!autoSave || !form || !dirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void saveSettings(form, { quiet: true });
    }, 900);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [autoSave, form, dirty, saveSettings]);

  const workDaysSet = useMemo(
    () => (form ? parseWorkDaysSet(form.workDays) : new Set<number>()),
    [form]
  );

  function toggleWorkDay(day: number) {
    const next = new Set(workDaysSet);
    if (next.has(day)) {
      if (next.size <= 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    patchForm({ workDays: serializeWorkDays(next) });
  }

  const holidaysGrouped = useMemo(() => {
    const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
    const map = new Map<string, Holiday[]>();
    for (const h of sorted) {
      const key = h.date.slice(0, 7); // YYYY-MM
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, list]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "pt-BR",
        { month: "long", year: "numeric" }
      );
      return [label.charAt(0).toUpperCase() + label.slice(1), list] as const;
    });
  }, [holidays]);

  async function createHoliday(e: React.FormEvent) {
    e.preventDefault();
    setHolidaySaving(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayForm),
      });
      if (!res.ok) {
        toast({ variant: "error", message: "Falha ao adicionar feriado." });
        return;
      }
      toast({ variant: "success", message: "Feriado adicionado." });
      setHolidayModal(false);
      setHolidayForm({ date: "", name: "", type: "holiday" });
      loadHolidays();
    } finally {
      setHolidaySaving(false);
    }
  }

  async function confirmDeleteHoliday() {
    if (!deleteHoliday) return;
    setDeletingHoliday(true);
    try {
      const res = await fetch(`/api/holidays/${deleteHoliday.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ variant: "error", message: "Falha ao remover." });
        return;
      }
      toast({ variant: "success", message: "Removido com sucesso." });
      setDeleteHoliday(null);
      loadHolidays();
    } finally {
      setDeletingHoliday(false);
    }
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!form) {
    return (
      <PageTransition>
        <SettingsSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <ContentFade className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Defina jornada, horários padrão e limites de compensação. Nada fica fixo no código."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              label="Salvar automaticamente"
              checked={autoSave}
              onChange={setAutoSave}
            />
            <Button
              type="button"
              loading={saving}
              disabled={!dirty && !saving}
              onClick={() => saveSettings()}
            >
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        }
      />

      <RevealStagger className="space-y-3">
        <AccordionSection
          id="jornada"
          icon={Clock}
          title="⏱ Jornada"
          description="Meta semanal, dias úteis e horários padrão de entrada/saída."
          open={openSections.jornada}
          onToggle={() => toggleSection("jornada")}
        >
          <div className="space-y-5">
            <MinutesSlider
              label="Meta semanal"
              value={form.weeklyGoalMinutes}
              onChange={(v) => patchForm({ weeklyGoalMinutes: v })}
              min={60}
              max={60 * 60}
              step={15}
            />

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                Dias úteis
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const active = workDaysSet.has(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleWorkDay(d)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        active
                          ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--brand-foreground)]"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--brand)]"
                      )}
                    >
                      {WEEKDAY_NAMES[d]?.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Entrada padrão"
                type="time"
                value={form.defaultEntry}
                onChange={(e) => patchForm({ defaultEntry: e.target.value })}
              />
              <Input
                label="Saída padrão"
                type="time"
                value={form.defaultExit}
                onChange={(e) => patchForm({ defaultExit: e.target.value })}
              />
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="pausas"
          icon={Coffee}
          title="☕ Pausas e Limites"
          description="Intervalo padrão e máximo diário razoável para o planejador."
          open={openSections.pausas}
          onToggle={() => toggleSection("pausas")}
        >
          <div className="space-y-5">
            <MinutesSlider
              label="Intervalo padrão"
              value={form.defaultBreakMinutes}
              onChange={(v) => patchForm({ defaultBreakMinutes: v })}
              min={0}
              max={240}
              step={5}
            />
            <MinutesSlider
              label="Máximo diário"
              value={form.maxDailyMinutes}
              onChange={(v) => patchForm({ maxDailyMinutes: v })}
              min={60}
              max={16 * 60}
              step={15}
            />
            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
              <div
                className="h-full rounded-full bg-[color:var(--brand)] transition-all"
                style={{
                  width: `${Math.min(100, (form.maxDailyMinutes / (16 * 60)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="banco"
          icon={Wallet}
          title="💰 Banco de Horas"
          description="Compensação e saldo inicial do banco."
          open={openSections.banco}
          onToggle={() => toggleSection("banco")}
        >
          <div className="space-y-5">
            <Toggle
              label="Permitir compensação de horas"
              checked={form.allowCompensation}
              onChange={(checked) => patchForm({ allowCompensation: checked })}
            />
            <Input
              label="Saldo inicial do banco (HH:MM, use - para negativo)"
              value={minutesToHHMM(form.bankOpeningBalanceMinutes)}
              onChange={(e) =>
                patchForm({
                  bankOpeningBalanceMinutes: hhmmSignedToMinutes(e.target.value),
                })
              }
              placeholder="00:00"
            />
            <p className="text-xs text-[color:var(--text-muted)]">
              Atual: {formatFriendlyMinutes(form.bankOpeningBalanceMinutes)}
            </p>
          </div>
        </AccordionSection>

        <AccordionSection
          id="planejador"
          icon={Bot}
          title="🤖 Planejador"
          description="Janela horária usada nas sugestões de compensação."
          open={openSections.planejador}
          onToggle={() => toggleSection("planejador")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Janela — início"
              type="time"
              value={form.suggestionWindowStart}
              onChange={(e) =>
                patchForm({ suggestionWindowStart: e.target.value })
              }
            />
            <Input
              label="Janela — fim"
              type="time"
              value={form.suggestionWindowEnd}
              onChange={(e) =>
                patchForm({ suggestionWindowEnd: e.target.value })
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="feriados"
          icon={CalendarDays}
          title="🗓 Feriados e Folgas"
          description="Dias que removem capacidade disponível no planejador."
          open={openSections.feriados}
          onToggle={() => toggleSection("feriados")}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--text-secondary)]">
              {holidays.length} cadastrado{holidays.length === 1 ? "" : "s"}
            </p>
            <Button type="button" onClick={() => setHolidayModal(true)}>
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>

          {holidaysLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} shape="rect" className="h-14" />
              ))}
            </div>
          ) : holidays.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
              Nenhum feriado ou folga cadastrado.
            </p>
          ) : (
            <div className="space-y-5">
              {holidaysGrouped.map(([month, list]) => (
                <div key={month}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    {month}
                  </p>
                  <div className="space-y-2">
                    {list.map((h) => {
                      const meta = TYPE_META[h.type] ?? TYPE_META.holiday;
                      return (
                        <div
                          key={h.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge color={meta.color} size="sm">
                                {meta.label}
                              </Badge>
                              <span className="text-sm font-medium text-[color:var(--text)]">
                                {h.name}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                              {formatDateBR(h.date)}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remover ${h.name}`}
                            onClick={() => setDeleteHoliday(h)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--status-danger-bg)] hover:text-[color:var(--status-danger)]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>
      </RevealStagger>

      {dirty && !autoSave ? (
        <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-6">
          <Button type="button" loading={saving} onClick={() => saveSettings()}>
            <Settings2 className="h-4 w-4" />
            Salvar alterações
          </Button>
        </div>
      ) : null}

      <Modal
        open={holidayModal}
        onClose={() => setHolidayModal(false)}
        title="Novo feriado / folga"
      >
        <form onSubmit={createHoliday} className="space-y-3">
          <Input
            label="Data"
            type="date"
            value={holidayForm.date}
            onChange={(e) =>
              setHolidayForm({ ...holidayForm, date: e.target.value })
            }
            required
          />
          <Input
            label="Nome"
            value={holidayForm.name}
            onChange={(e) =>
              setHolidayForm({ ...holidayForm, name: e.target.value })
            }
            required
          />
          <Select
            label="Tipo"
            value={holidayForm.type}
            onChange={(e) =>
              setHolidayForm({ ...holidayForm, type: e.target.value })
            }
          >
            <option value="holiday">Feriado</option>
            <option value="vacation">Férias</option>
            <option value="day_off">Folga</option>
            <option value="leave">Afastamento / Licença</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setHolidayModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={holidaySaving}>
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteHoliday)}
        onClose={() => setDeleteHoliday(null)}
        title="Remover dia?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteHoliday(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deletingHoliday}
              onClick={confirmDeleteHoliday}
            >
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-secondary)]">
          Remover{" "}
          <strong className="text-[color:var(--text)]">
            {deleteHoliday?.name}
          </strong>
          {deleteHoliday ? ` (${formatDateBR(deleteHoliday.date)})` : ""}?
        </p>
      </Modal>
      </ContentFade>
    </PageTransition>
  );
}
