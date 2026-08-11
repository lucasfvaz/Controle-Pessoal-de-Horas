import { describe, expect, it } from "vitest";
import {
  parseHHMM,
  formatMinutes,
  formatMinutesLong,
  diffMinutes,
  getWeekStart,
  formatHHMM,
} from "../../src/domain/time";
import {
  calcularHorasTrabalhadas,
  calcularSaldoDia,
  calcularResumoSemana,
  metaDiariaReferencia,
} from "../../src/domain/journey";
import { calcularBancoHoras } from "../../src/domain/bank";
import {
  calcularPlanejamentoSemanal,
  subtractBlocks,
  distributeMinutes,
  classesForDate,
  availablePeriodsForDay,
} from "../../src/domain/planner";

const baseSettings = {
  weeklyGoalMinutes: 2400,
  workDays: "1,2,3,4,5",
  defaultEntry: "08:00",
  defaultExit: "17:30",
  defaultBreakMinutes: 60,
  allowCompensation: true,
  maxDailyMinutes: 600,
  suggestionWindowStart: "07:00",
  suggestionWindowEnd: "20:00",
};

describe("time", () => {
  it("converte 1h40 para 100 minutos", () => {
    expect(parseHHMM("01:40")).toBe(100);
    expect(formatMinutes(100)).toBe("1h40");
    expect(formatMinutesLong(100, true)).toBe("+1h40");
  });

  it("não trata 1.40 como horas", () => {
    expect(parseHHMM("17:30")).toBe(1050);
    expect(diffMinutes("08:00", "12:00")).toBe(240);
  });

  it("getWeekStart retorna segunda", () => {
    expect(getWeekStart("2026-08-11")).toBe("2026-08-10"); // terça → seg 10
  });
});

describe("journey — batidas", () => {
  it("cenário 7: intervalo diferente de 1h", () => {
    const r = calcularHorasTrabalhadas({
      entryTime: "08:00",
      breakStart: "12:00",
      breakEnd: "12:30",
      exitTime: "17:00",
    });
    expect(r.periodo1).toBe(240);
    expect(r.periodo2).toBe(270);
    expect(r.totalMinutos).toBe(510); // 8h30
  });

  it("exemplo do plano: 08-12 + 13-17:30 = 8h30", () => {
    const r = calcularHorasTrabalhadas({
      entryTime: "08:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      exitTime: "17:30",
    });
    expect(r.totalMinutos).toBe(510);
  });

  it("não usa primeira entrada até última saída", () => {
    // 08→18 com intervalo 12→13 = 9h, não 10h
    const r = calcularHorasTrabalhadas({
      entryTime: "08:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      exitTime: "18:00",
    });
    expect(r.totalMinutos).toBe(540);
    expect(diffMinutes("08:00", "18:00")).toBe(600);
  });

  it("rejeita ordem inválida", () => {
    expect(() =>
      calcularHorasTrabalhadas({
        entryTime: "09:00",
        breakStart: "08:00",
        breakEnd: "13:00",
        exitTime: "17:00",
      })
    ).toThrow();
  });
});

describe("cenários semanais", () => {
  it("1. semana normal de 40h", () => {
    const entries = ["10", "11", "12", "13", "14"].map((d) => ({
      date: `2026-08-${d}`,
      workedMinutes: 480,
    }));
    const r = calcularResumoSemana(entries, baseSettings, "2026-08-10");
    expect(r.trabalhadoMinutos).toBe(2400);
    expect(r.saldoMinutos).toBe(0);
    expect(r.faltaMinutos).toBe(0);
  });

  it("2. semana com horas extras", () => {
    const entries = [
      { date: "2026-08-10", workedMinutes: 510 },
      { date: "2026-08-11", workedMinutes: 510 },
      { date: "2026-08-12", workedMinutes: 510 },
      { date: "2026-08-13", workedMinutes: 510 },
      { date: "2026-08-14", workedMinutes: 510 },
    ];
    const r = calcularResumoSemana(entries, baseSettings, "2026-08-10");
    expect(r.trabalhadoMinutos).toBe(2550);
    expect(r.saldoMinutos).toBe(150); // +2h30
  });

  it("3. semana com horas faltantes", () => {
    const entries = [
      { date: "2026-08-10", workedMinutes: 480 },
      { date: "2026-08-11", workedMinutes: 300 },
      { date: "2026-08-12", workedMinutes: 480 },
    ];
    const r = calcularResumoSemana(entries, baseSettings, "2026-08-10");
    expect(r.trabalhadoMinutos).toBe(1260);
    expect(r.faltaMinutos).toBe(1140);
    expect(r.saldoMinutos).toBe(-1140);
  });
});

describe("aulas e planner", () => {
  it("5. aula em apenas um dia", () => {
    const aulas = classesForDate("2026-08-11", [
      {
        name: "AM",
        weekday: 2,
        startTime: "09:50",
        endTime: "11:30",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ]);
    expect(aulas).toHaveLength(1);
    expect(classesForDate("2026-08-10", [
      {
        name: "AM",
        weekday: 2,
        startTime: "09:50",
        endTime: "11:30",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ])).toHaveLength(0);
  });

  it("6. várias aulas no mesmo dia", () => {
    const classes = [
      {
        name: "AM",
        weekday: 2,
        startTime: "09:50",
        endTime: "11:30",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
      {
        name: "Metodologia",
        weekday: 2,
        startTime: "13:30",
        endTime: "17:00",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
      {
        name: "Seminários",
        weekday: 2,
        startTime: "19:00",
        endTime: "21:00",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ];
    const { workPeriods, aulas } = availablePeriodsForDay(
      "2026-08-11",
      baseSettings,
      classes
    );
    expect(aulas).toHaveLength(3);
    // Janela 07-20 menos aulas e intervalo — ainda há períodos livres
    expect(workPeriods.length).toBeGreaterThan(0);
    const total = workPeriods.reduce(
      (s, p) => s + (parseHHMM(p.fim) - parseHHMM(p.inicio)),
      0
    );
    expect(total).toBeLessThan(13 * 60);
  });

  it("4. semana com aulas — planejamento distribui", () => {
    const plan = calcularPlanejamentoSemanal({
      settings: baseSettings,
      entries: [
        { date: "2026-08-10", workedMinutes: 510 },
        { date: "2026-08-11", workedMinutes: 300 },
        { date: "2026-08-12", workedMinutes: 480 },
      ],
      classes: [
        {
          name: "AM",
          weekday: 4,
          startTime: "09:50",
          endTime: "11:30",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
      ],
      holidays: [],
      bankOpeningBalanceMinutes: 0,
      bankPreviousMinutes: 0,
      referenceDate: "2026-08-12",
      weekStart: "2026-08-10",
    });
    expect(plan.trabalhadoMinutos).toBe(1290);
    expect(plan.restanteMinutos).toBe(1110);
    expect(plan.diasDisponiveis).toEqual(["2026-08-13", "2026-08-14"]);
    expect(plan.sugestoes.length).toBeGreaterThan(0);
  });

  it("subtractBlocks remove aulas", () => {
    const free = subtractBlocks(
      [{ inicio: "07:00", fim: "20:00" }],
      [{ inicio: "09:50", fim: "11:30" }]
    );
    expect(free).toEqual([
      { inicio: "07:00", fim: "09:50" },
      { inicio: "11:30", fim: "20:00" },
    ]);
  });

  it("distribuição equilibrada", () => {
    const { allocations, feasible } = distributeMinutes(900, [600, 600]);
    expect(feasible).toBe(true);
    expect(allocations[0]).toBe(450);
    expect(allocations[1]).toBe(450);
  });
});

describe("banco de horas", () => {
  it("8. saldo positivo", () => {
    const bank = calcularBancoHoras({
      openingBalanceMinutes: 120,
      entries: [
        { date: "2026-08-03", workedMinutes: 510 },
        { date: "2026-08-04", workedMinutes: 510 },
        { date: "2026-08-05", workedMinutes: 510 },
        { date: "2026-08-06", workedMinutes: 510 },
        { date: "2026-08-07", workedMinutes: 510 },
      ],
      weeklyGoalMinutes: 2400,
      workDaysCount: 5,
      weekStart: "2026-08-10",
    });
    // semana anterior: 2550 - 2400 = +150; anterior = 120+150=270
    expect(bank.saldoAnterior).toBe(270);
    expect(bank.status).toBe("POSITIVO");
  });

  it("9. saldo negativo", () => {
    const bank = calcularBancoHoras({
      openingBalanceMinutes: 0,
      entries: [
        { date: "2026-08-03", workedMinutes: 400 },
        { date: "2026-08-04", workedMinutes: 400 },
        { date: "2026-08-05", workedMinutes: 400 },
        { date: "2026-08-06", workedMinutes: 400 },
        { date: "2026-08-07", workedMinutes: 400 },
      ],
      weeklyGoalMinutes: 2400,
      workDaysCount: 5,
      weekStart: "2026-08-10",
    });
    expect(bank.saldoAnterior).toBe(2000 - 2400); // -400
    expect(bank.status).toBe("NEGATIVO");
  });
});

describe("inviabilidade", () => {
  it("10. compensação inviável", () => {
    const plan = calcularPlanejamentoSemanal({
      settings: { ...baseSettings, maxDailyMinutes: 600 },
      entries: [{ date: "2026-08-10", workedMinutes: 120 }],
      classes: [],
      holidays: [],
      bankOpeningBalanceMinutes: 0,
      bankPreviousMinutes: 0,
      referenceDate: "2026-08-14",
      weekStart: "2026-08-10",
    });
    // Faltam 2280, só sexta disponível, max 600
    expect(plan.viavel).toBe(false);
    expect(plan.alerta).toBeTruthy();
    expect(plan.sugestoes.every((s) => s.minutos <= 600)).toBe(true);
  });
});

describe("meta diária referência", () => {
  it("não assume 8h obrigatório se workDays mudar", () => {
    expect(metaDiariaReferencia(2400, 5)).toBe(480);
    expect(metaDiariaReferencia(2400, 4)).toBe(600);
  });

  it("saldo do dia", () => {
    expect(calcularSaldoDia(510, 480)).toBe(30);
    expect(formatHHMM(1050)).toBe("17:30");
  });
});
