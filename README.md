# Gestor de Jornada

Aplicativo web pessoal para controle de jornada de trabalho, banco de horas e compensação considerando aulas do mestrado.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- NextAuth (credentials)
- Vitest (cálculos de domínio)

## Como rodar

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

**Login padrão (seed):** `admin@gestor.local` / `admin123`

## Testes

```bash
npm test
```

## Funcionalidades

- Registrar/editar/apagar batidas (4 horários)
- Cálculo em minutos internos (nunca decimal tipo 1.40)
- Aulas do mestrado (CRUD)
- Dashboard com cards, alertas e gráficos
- Planejamento semanal + sugestão de compensação
- Calendário mensal
- Histórico com filtros
- Banco de horas
- Configurações editáveis (meta, horários, limites)

## Estrutura

- `src/domain/` — regras puras e testáveis
- `src/app/api/` — REST handlers
- `src/app/` — telas
- `prisma/` — schema e seed
- `tests/domain/` — cenários de cálculo
