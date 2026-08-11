"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gestor.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,_#d1e7dd_0%,_#f4f6f5_55%)] px-4">
      <Card className="w-full max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl text-emerald-950">
          Gestor de Jornada
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Controle pessoal de ponto, banco de horas e aulas do mestrado.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <p className="text-sm text-rose-700">{error}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Seed: admin@gestor.local / admin123
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
