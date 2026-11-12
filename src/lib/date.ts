/**
 * Fuso horário operacional padrão do FitFlow (Brasil / Brasília - UTC-3).
 * Garante que em ambientes de nuvem (Vercel, AWS) rodando em UTC,
 * o horário, dia da semana e datas exibidos ao usuário não fiquem adiantados em 3 horas.
 */
export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

export const DOW_MAP = {
  Sun: "SUNDAY",
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
} as const;

export type DayOfWeekEnum = (typeof DOW_MAP)[keyof typeof DOW_MAP];

/**
 * Retorna o dia da semana atual de acordo com o fuso horário de Brasília.
 * Evita que após as 21:00 (quando no fuso UTC já virou meia-noite)
 * o sistema exiba o treino do dia seguinte como sendo hoje.
 */
export function getBrazilDayOfWeek(date: Date | string | number = new Date()): DayOfWeekEnum {
  const d = date instanceof Date ? date : new Date(date);
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "short",
  }).format(d) as keyof typeof DOW_MAP;

  return DOW_MAP[weekdayShort] ?? "MONDAY";
}

/**
 * Formata data no fuso de Brasília (ex: "11/11/2026").
 */
export function formatBrazilDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    ...options,
  });
}

/**
 * Formata data e hora no fuso de Brasília (ex: "qua., 11/11/2026, 21:05").
 */
export function formatBrazilDateTime(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Formata apenas hora:minuto no fuso de Brasília (ex: "21:05").
 */
export function formatBrazilTime(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Ordem cronológica da semana (Segunda a Domingo, seguido de Livre/Rotativo).
 */
export const DOW_SORT_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
  ANY: 8,
};

/**
 * Ordena dias de treino cronologicamente pela semana (Segunda a Domingo).
 */
export function sortDaysByWeekOrder<T extends { dayOfWeek: string; orderIndex?: number }>(
  days: T[]
): T[] {
  return [...days].sort((a, b) => {
    const orderA = DOW_SORT_ORDER[a.dayOfWeek] ?? 99;
    const orderB = DOW_SORT_ORDER[b.dayOfWeek] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
  });
}

/**
 * Retorna o cabeçalho completo formatado em português (ex: "Quarta-feira, 11 de novembro").
 */
export function formatBrazilTodayHeader(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Retorna o início do dia (00:00:00.000) no fuso de Brasília, como objeto Date em UTC.
 */
export function getStartOfBrazilDay(date: Date | string | number = new Date()): Date {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // Brasil não tem horário de verão desde 2019: offset fixo de -03:00.
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00-03:00`);
}
