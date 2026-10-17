import {
  creditCardPrefKey,
  dueOffsetForDay,
  parseCreditCardConfig,
  serializeCreditCardConfig,
} from './creditCard';

describe('credit card preference', () => {
  test('uses the key the mobile clients read', () => {
    expect(creditCardPrefKey('abc')).toBe('actuali:credit_card:abc');
  });

  test('parses the JSON Actua writes', () => {
    expect(
      parseCreditCardConfig(
        '{"statementDay":6,"dueOffsetDays":27,"dueDay":2,"limit":3130000}',
      ),
    ).toEqual({
      statementDay: 6,
      dueOffsetDays: 27,
      dueDay: 2,
      limit: 3130000,
    });
  });

  test('ignores entries the mobile clients would skip', () => {
    expect(parseCreditCardConfig(undefined)).toBeNull();
    expect(parseCreditCardConfig('not json')).toBeNull();
    expect(parseCreditCardConfig('{"limit":500000}')).toBeNull();
    expect(parseCreditCardConfig('{"statementDay":32}')).toBeNull();
    expect(parseCreditCardConfig('{"statementDay":6,"dueDay":0}')).toBeNull();
  });

  test('defaults a missing or invalid due offset and drops a non-positive limit', () => {
    expect(
      parseCreditCardConfig('{"statementDay":6,"dueOffsetDays":0,"limit":0}'),
    ).toEqual({ statementDay: 6, dueOffsetDays: 15 });
  });

  test('keeps fields it does not know and drops cleared ones', () => {
    const json = serializeCreditCardConfig(
      { statementDay: 20, dueOffsetDays: 15 },
      '{"statementDay":6,"dueDay":2,"limit":100,"apr":24.99}',
    );
    expect(JSON.parse(json)).toEqual({
      apr: 24.99,
      statementDay: 20,
      dueOffsetDays: 15,
    });
  });

  test('stores the offset to a fixed due day alongside it', () => {
    const json = serializeCreditCardConfig({
      statementDay: 6,
      dueOffsetDays: 15,
      dueDay: 2,
      limit: 3130000,
    });
    expect(JSON.parse(json)).toMatchObject({ dueDay: 2, limit: 3130000 });
    expect(JSON.parse(json).dueOffsetDays).toBeGreaterThan(20);
  });
});

describe('dueOffsetForDay', () => {
  test('counts from the latest close to the next month due day', () => {
    // Latest close 2026-10-06, due 2026-11-02
    expect(dueOffsetForDay(6, 2, new Date(2026, 9, 17))).toBe(27);
  });

  test('uses the previous close before this month closes', () => {
    // Latest close 2026-09-06, due 2026-10-02
    expect(dueOffsetForDay(6, 2, new Date(2026, 9, 3))).toBe(26);
  });

  test('keeps a due day later than the close in the same month', () => {
    // Close 2026-10-05, due 2026-10-28
    expect(dueOffsetForDay(5, 28, new Date(2026, 9, 17))).toBe(23);
  });

  test('clamps to short months', () => {
    // Close 2026-01-31, due 2026-02-28
    expect(dueOffsetForDay(31, 28, new Date(2026, 1, 10))).toBe(28);
  });
});
