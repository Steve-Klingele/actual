import type { AccountEntity } from '@actual-app/core/types/models';

// The Actuali (iOS) and Actua (Android) clients read and write this same synced
// preference, so the JSON shape must stay compatible with theirs:
//   {"statementDay":6,"dueOffsetDays":27,"dueDay":2,"limit":3130000}
// statementDay is required; without it those clients ignore the whole entry.
export const DEFAULT_DUE_OFFSET_DAYS = 15;
const MAX_DUE_OFFSET_DAYS = 60;

export type CreditCardConfig = {
  statementDay: number;
  dueOffsetDays: number;
  dueDay?: number;
  limit?: number;
};

export function creditCardPrefKey(accountId: AccountEntity['id']) {
  return `actuali:credit_card:${accountId}` as const;
}

export function isDayOfMonth(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 31;
}

function isDueOffset(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    Number(value) >= 1 &&
    Number(value) <= MAX_DUE_OFFSET_DAYS
  );
}

function parseObject(value: string | undefined): Record<string, unknown> {
  if (!value) {
    return {};
  }
  try {
    const json: unknown = JSON.parse(value);
    return typeof json === 'object' && json !== null && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function parseCreditCardConfig(
  value: string | undefined,
): CreditCardConfig | null {
  const { statementDay, dueOffsetDays, dueDay, limit } = parseObject(value);
  if (
    !isDayOfMonth(statementDay) ||
    (dueDay != null && !isDayOfMonth(dueDay))
  ) {
    return null;
  }
  return {
    statementDay,
    dueOffsetDays: isDueOffset(dueOffsetDays)
      ? dueOffsetDays
      : DEFAULT_DUE_OFFSET_DAYS,
    ...(isDayOfMonth(dueDay) && { dueDay }),
    ...(typeof limit === 'number' && limit > 0 && { limit }),
  };
}

// Writes onto the stored JSON so fields another client added survive the save.
export function serializeCreditCardConfig(
  config: CreditCardConfig,
  previous?: string,
): string {
  const { dueDay: _dueDay, limit: _limit, ...rest } = parseObject(previous);
  return JSON.stringify({
    ...rest,
    statementDay: config.statementDay,
    dueOffsetDays: config.dueDay
      ? dueOffsetForDay(config.statementDay, config.dueDay)
      : config.dueOffsetDays,
    ...(config.dueDay && { dueDay: config.dueDay }),
    ...(config.limit && config.limit > 0 && { limit: config.limit }),
  });
}

function dayInMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(year, month, Math.min(day, lastDay));
}

// Days from the latest statement close to its payment due date, the fallback
// offset Actua stores alongside a fixed due day.
export function dueOffsetForDay(
  statementDay: number,
  dueDay: number,
  today: Date = new Date(),
): number {
  const year = today.getFullYear();
  const month = today.getMonth();
  const thisClose = dayInMonth(year, month, statementDay);
  const todayUtc = Date.UTC(year, month, today.getDate());
  const closeMonth = thisClose <= todayUtc ? month : month - 1;
  const close = dayInMonth(year, closeMonth, statementDay);
  const due = dayInMonth(
    year,
    dueDay > statementDay ? closeMonth : closeMonth + 1,
    dueDay,
  );
  return Math.max(1, Math.round((due - close) / 86_400_000));
}
