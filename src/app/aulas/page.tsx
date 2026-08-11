"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  TextArea,
  Tooltip,
  useToast,
} from "@/components/ui";
import {
  formatDateBR,
  parseHHMM,
  todayDateOnly,
  WEEKDAY_NAMES,
} from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Clock,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

type ClassItem = {
  id: string;
  name: string;
  weekday: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
};

const emptyForm = {
  name: "",
  weekday: 2,
  startTime: "09:50",
  endTime: "11:30",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  notes: "",
};

const WEEKDAYS_ORDER = [1, 2, 3, 4, 5, 6, 7];
const GRID_START = 7 * 60;
const GRID_END = 22 * 60;
const GRID_SPAN = GRID_END - GRID_START;
const HOUR_ROWS = Array.from({ length: 16 }, (_, i) => 7 + i);

const BLOCK_COLORS = [
  "bg-emerald-500/80",
  "bg-sky-500/80",
  "bg-violet-500/80",
  "bg-amber-500/80",
  "bg-rose-500/80",
  "bg-teal-500/80",
];

function isActive(item: ClassItem, today: string) {
  return item.startDate <= today && today <= item.endDate;
}

function weekdayLabel(day: number) {
  const name = WEEKDAY_NAMES[day] ?? `Dia ${day}`;
  if (name === "Sábado" || name === "Domingo") return name;
  return `${name}-feira`;
}

function ClassForm({
  form,
  setForm,
  error,
  onSubmit,
  onCancel,
  editId,
  saving,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editId: string | null;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Disciplina"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Select
        label="Dia da semana"
        value={form.weekday}
        onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
      >
        {WEEKDAYS_ORDER.map((d) => (
          <option key={d} value={d}>
            {weekdayLabel(d)}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Início"
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          required
        />
        <Input
          label="Fim"
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Data inicial"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          required
        />
        <Input
          label="Data final"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          required
        />
      </div>
      <TextArea
        label="Observação"
        rows={2}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      {error ? (
        <p className="text-sm text-[color:var(--status-danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {editId ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

function WeeklyGrid({ items }: { items: ClassItem[] }) {
  return (
    <Card className="overflow-x-auto">
      <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)]">
        Grade horária semanal
      </h2>
      <div className="min-w-[640px]">
        <div className="mb-1 grid grid-cols-[48px_repeat(7,1fr)] gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
          <div />
          {WEEKDAYS_ORDER.map((d) => (
            <div key={d}>{WEEKDAY_NAMES[d]?.slice(0, 3)}</div>
          ))}
        </div>
        <div className="relative grid grid-cols-[48px_repeat(7,1fr)] gap-1">
          <div className="relative" style={{ height: 480 }}>
            {HOUR_ROWS.map((h) => (
              <div
                key={h}
                className="absolute right-1 text-[10px] tabular-nums text-[color:var(--text-muted)]"
                style={{ top: ((h * 60 - GRID_START) / GRID_SPAN) * 480 - 6 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {WEEKDAYS_ORDER.map((day) => (
            <div
              key={day}
              className="relative rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)]"
              style={{ height: 480 }}
            >
              {HOUR_ROWS.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-[color:var(--border)]/60"
                  style={{ top: ((h * 60 - GRID_START) / GRID_SPAN) * 480 }}
                />
              ))}
              {items
                .filter((item) => item.weekday === day)
                .map((item, idx) => {
                  let top = 0;
                  let height = 20;
                  try {
                    const start = parseHHMM(item.startTime);
                    const end = parseHHMM(item.endTime);
                    top = ((start - GRID_START) / GRID_SPAN) * 480;
                    height = Math.max(18, ((end - start) / GRID_SPAN) * 480);
                  } catch {
                    /* ignore */
                  }
                  return (
                    <Tooltip key={item.id} content={`${item.name} · ${item.startTime}–${item.endTime}`}>
                      <div
                        className={cn(
                          "absolute inset-x-1 overflow-hidden rounded-md px-1 py-0.5 text-[9px] font-medium text-white shadow-sm",
                          BLOCK_COLORS[idx % BLOCK_COLORS.length]
                        )}
                        style={{ top, height }}
                      >
                        <span className="line-clamp-2">{item.name}</span>
                      </div>
                    </Tooltip>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ClassCard({
  item,
  today,
  onEdit,
  onDelete,
}: {
  item: ClassItem;
  today: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = isActive(item, today);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-[color:var(--text)]">
            {item.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge color="emerald">{weekdayLabel(item.weekday)}</Badge>
            <Badge color={active ? "sky" : "slate"} size="sm">
              {active ? "Ativa" : "Expirada/futura"}
            </Badge>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]">
            <Clock className="h-4 w-4 text-[color:var(--brand)]" />
            {item.startTime} – {item.endTime}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--text-muted)]">
            <Calendar className="h-4 w-4" />
            {formatDateBR(item.startDate)} – {formatDateBR(item.endDate)}
          </p>
          {item.notes ? (
            <div className="mt-2">
              <p
                className={cn(
                  "text-sm text-[color:var(--text-secondary)]",
                  !notesOpen && "line-clamp-2"
                )}
              >
                {item.notes}
              </p>
              {item.notes.length > 80 ? (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-[color:var(--brand)] hover:underline"
                  onClick={() => setNotesOpen((v) => !v)}
                >
                  {notesOpen ? "ver menos" : "ver mais"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Ações"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] py-1 shadow-[var(--shadow-lg)] animate-scale-in">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--status-danger)] hover:bg-[color:var(--status-danger-bg)]"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function AulasPage() {
  const { toast } = useToast();
  const today = todayDateOnly();
  const [items, setItems] = useState<ClassItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetch("/api/classes").then((r) => r.json());
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, ClassItem[]>();
    for (const item of items) {
      const list = map.get(item.weekday) ?? [];
      list.push(item);
      map.set(item.weekday, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return WEEKDAYS_ORDER.filter((d) => map.has(d)).map((d) => ({
      day: d,
      items: map.get(d)!,
    }));
  }, [items]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEdit(item: ClassItem) {
    setEditId(item.id);
    setForm({
      name: item.name,
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      startDate: item.startDate,
      endDate: item.endDate,
      notes: item.notes ?? "",
    });
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setError("");
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Nome obrigatório";
    if (form.startTime >= form.endTime) {
      return "Horário final deve ser após o inicial";
    }
    if (form.startDate > form.endDate) {
      return "Data final deve ser ≥ data inicial";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      weekday: Number(form.weekday),
      notes: form.notes || null,
    };
    const res = await fetch(editId ? `/api/classes/${editId}` : "/api/classes", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    toast({
      variant: "success",
      title: editId ? "Disciplina atualizada" : "Disciplina criada",
      message: form.name,
    });
    closeForm();
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/classes/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      toast({ variant: "error", message: "Falha ao excluir disciplina." });
      return;
    }
    toast({
      variant: "success",
      message: `"${deleteTarget.name}" excluída.`,
    });
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aulas"
        description="Cadastre disciplinas do mestrado. Elas não contam como horas trabalhadas, mas ocupam a agenda no planejamento."
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova Disciplina
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4 animate-fade-in" aria-busy>
          <Skeleton shape="rect" className="h-64" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} shape="rect" className="h-36" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina cadastrada"
          description="Adicione suas aulas do mestrado para que o planejador inteligente evite conflitos de horário."
          actionLabel="Nova Disciplina"
          onAction={openCreate}
        />
      ) : (
        <>
          <WeeklyGrid items={items} />

          <div className="space-y-8">
            {grouped.map((group) => (
              <section key={group.day}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    {weekdayLabel(group.day)}
                  </h2>
                  <div className="h-px flex-1 bg-[color:var(--border)]" />
                  <Badge color="slate" size="sm">
                    {group.items.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <ClassCard
                      key={item.id}
                      item={item}
                      today={today}
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editId ? "Editar disciplina" : "Nova disciplina"}
      >
        <ClassForm
          form={form}
          setForm={setForm}
          error={error}
          onSubmit={onSubmit}
          onCancel={closeForm}
          editId={editId}
          saving={saving}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir disciplina?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-secondary)]">
          Tem certeza que deseja excluir{" "}
          <strong className="text-[color:var(--text)]">
            {deleteTarget?.name}
          </strong>
          ? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
