"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, PageHeader, TextArea } from "@/components/ui";
import { calcularHorasTrabalhadas } from "@/domain/journey";
import { formatMinutesLong, todayDateOnly } from "@/domain/time";
import { Suspense } from "react";

function PunchForm() {
  const router = useRouter();
  const search = useSearchParams();
  const editId = search.get("id");

  const [date, setDate] = useState(todayDateOnly());
  const [entryTime, setEntryTime] = useState("08:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [exitTime, setExitTime] = useState("17:30");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (!editId) {
          setEntryTime(s.defaultEntry);
          setExitTime(s.defaultExit);
          const [eh, em] = s.defaultEntry.split(":").map(Number);
          const mid = eh * 60 + em + 240;
          const bh = Math.floor(mid / 60);
          const bm = mid % 60;
          setBreakStart(
            `${String(bh).padStart(2, "0")}:${String(bm).padStart(2, "0")}`
          );
          const endMid = mid + (s.defaultBreakMinutes ?? 60);
          setBreakEnd(
            `${String(Math.floor(endMid / 60)).padStart(2, "0")}:${String(endMid % 60).padStart(2, "0")}`
          );
        }
        setDefaultsLoaded(true);
      })
      .catch(() => setDefaultsLoaded(true));
  }, [editId]);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/punches/${editId}`)
      .then((r) => r.json())
      .then((e) => {
        if (e.error) return;
        setDate(e.date);
        setEntryTime(e.entryTime);
        setBreakStart(e.breakStart);
        setBreakEnd(e.breakEnd);
        setExitTime(e.exitTime);
        setNotes(e.notes ?? "");
      });
  }, [editId]);

  const preview = useMemo(() => {
    try {
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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
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
      return;
    }
    router.push("/semana");
    router.refresh();
  }

  async function onDelete() {
    if (!editId) return;
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    const res = await fetch(`/api/punches/${editId}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Falha ao apagar");
      return;
    }
    router.push("/historico");
  }

  if (!defaultsLoaded && !editId) {
    return <p className="text-slate-500">Carregando…</p>;
  }

  return (
    <div>
      <PageHeader
        title={editId ? "Editar ponto" : "Registrar ponto"}
        description="Informe as quatro batidas. O cálculo usa os dois períodos de trabalho."
      />

      <form onSubmit={onSave} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Entrada"
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              required
            />
            <Input
              label="Saída intervalo"
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              required
            />
            <Input
              label="Retorno intervalo"
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              required
            />
            <Input
              label="Saída"
              type="time"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              required
            />
          </div>
          <TextArea
            label="Observações"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            {editId ? (
              <Button type="button" variant="danger" onClick={onDelete}>
                Apagar
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-800">Prévia do cálculo</h2>
          {preview ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Período 1</p>
                <p className="font-medium">
                  {entryTime} → {breakStart} = {formatMinutesLong(preview.periodo1)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Período 2</p>
                <p className="font-medium">
                  {breakEnd} → {exitTime} = {formatMinutesLong(preview.periodo2)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
                <p className="text-xs uppercase">Total</p>
                <p className="text-2xl font-semibold">
                  {formatMinutesLong(preview.totalMinutos)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800">
              Ordem inválida das batidas. Esperado: Entrada &lt; Saída intervalo ≤
              Retorno &lt; Saída.
            </p>
          )}
        </Card>
      </form>
    </div>
  );
}

export default function PontoPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Carregando…</p>}>
      <PunchForm />
    </Suspense>
  );
}
