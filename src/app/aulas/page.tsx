"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, PageHeader, Select, TextArea } from "@/components/ui";
import { WEEKDAY_NAMES } from "@/domain/time";

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

export default function AulasPage() {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const data = await fetch("/api/classes").then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setForm(emptyForm);
    setEditId(null);
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Apagar esta aula?")) return;
    await fetch(`/api/classes/${id}`, { method: "DELETE" });
    load();
  }

  function onEdit(item: ClassItem) {
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
  }

  return (
    <div>
      <PageHeader
        title="Aulas"
        description="Cadastre disciplinas do mestrado. Elas não contam como horas trabalhadas, mas ocupam a agenda no planejamento."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="mb-4 text-sm font-semibold">
            {editId ? "Editar aula" : "Nova aula"}
          </h2>
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
              onChange={(e) =>
                setForm({ ...form, weekday: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {WEEKDAY_NAMES[d]}
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
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit">{editId ? "Atualizar" : "Cadastrar"}</Button>
              {editId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <div className="space-y-3">
          {items.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Nenhuma aula cadastrada.</p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-950">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    {WEEKDAY_NAMES[item.weekday]} · {item.startTime} → {item.endTime}
                  </p>
                  <p className="text-xs text-slate-500">
                    Vigência: {item.startDate} a {item.endDate}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => onEdit(item)}>
                    Editar
                  </Button>
                  <Button type="button" variant="danger" onClick={() => onDelete(item.id)}>
                    Apagar
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
