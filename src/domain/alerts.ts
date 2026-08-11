import { formatMinutesLong } from "./time";

export type AlertItem = {
  type: "info" | "warning" | "success" | "danger";
  message: string;
};

export function gerarAlertas(input: {
  metaMinutos: number;
  trabalhadoMinutos: number;
  faltaMinutos: number;
  saldoMinutos: number;
  bancoAtual: number;
  diasRestantes: number;
  maxDailyMinutes: number;
  viavel?: boolean;
  plannerAlerta?: string;
}): AlertItem[] {
  const alerts: AlertItem[] = [];
  const {
    metaMinutos,
    trabalhadoMinutos,
    faltaMinutos,
    saldoMinutos,
    bancoAtual,
    diasRestantes,
    maxDailyMinutes,
    viavel,
    plannerAlerta,
  } = input;

  if (trabalhadoMinutos >= metaMinutos) {
    alerts.push({
      type: "success",
      message: `Você já atingiu as ${formatMinutesLong(metaMinutos)} semanais.`,
    });
  } else if (saldoMinutos < 0) {
    alerts.push({
      type: "warning",
      message: `Você está ${formatMinutesLong(Math.abs(saldoMinutos))} abaixo da meta semanal.`,
    });
  }

  if (faltaMinutos > 0 && diasRestantes > 0) {
    const porDia = Math.ceil(faltaMinutos / diasRestantes);
    alerts.push({
      type: porDia > maxDailyMinutes ? "danger" : "info",
      message: `Restam ${diasRestantes} dia(s) útil(is) e você precisa trabalhar ${formatMinutesLong(porDia)} por dia para fechar as ${formatMinutesLong(metaMinutos)}.`,
    });
    if (porDia > maxDailyMinutes) {
      alerts.push({
        type: "danger",
        message:
          "Atenção: a compensação necessária está muito alta para o limite diário configurado.",
      });
    }
  }

  if (bancoAtual > 0) {
    alerts.push({
      type: "info",
      message: `Você possui ${formatMinutesLong(bancoAtual, true)} de saldo no banco de horas.`,
    });
  } else if (bancoAtual < 0) {
    alerts.push({
      type: "warning",
      message: `Seu banco de horas está negativo: ${formatMinutesLong(bancoAtual, true)}.`,
    });
  }

  if (viavel === false && plannerAlerta) {
    alerts.push({ type: "danger", message: plannerAlerta });
  } else if (plannerAlerta && viavel !== false) {
    alerts.push({ type: "warning", message: plannerAlerta });
  }

  return alerts;
}
