import {
  applyWindow,
  buildMonthlyWindows,
  hasWindowMarkers,
} from './window-hogql.rules';

describe('buildMonthlyWindows', () => {
  test("découpe mois par mois jusqu'à maintenant", () => {
    const result = buildMonthlyWindows({
      dateFrom: '2025-01-01',
      now: new Date('2025-03-15T12:00:00Z'),
    });

    expect(result).toEqual({
      ok: true,
      windows: [
        { start: '2025-01-01 00:00:00', end: '2025-02-01 00:00:00' },
        { start: '2025-02-01 00:00:00', end: '2025-03-01 00:00:00' },
        { start: '2025-03-01 00:00:00', end: '2025-03-15 12:00:00' },
      ],
    });
  });

  test('borne la dernière fenêtre par date_to', () => {
    const result = buildMonthlyWindows({
      dateFrom: '2025-01-31',
      dateTo: '2025-03-10',
    });

    expect(result).toEqual({
      ok: true,
      windows: [
        { start: '2025-01-31 00:00:00', end: '2025-02-28 00:00:00' },
        { start: '2025-02-28 00:00:00', end: '2025-03-10 00:00:00' },
      ],
    });
  });

  test('refuse une plage vide', () => {
    expect(
      buildMonthlyWindows({ dateFrom: '2025-02-01', dateTo: '2025-01-01' })
    ).toMatchObject({ ok: false, reason: expect.stringContaining('vide') });
  });

  test('refuse plus de 24 mois', () => {
    expect(
      buildMonthlyWindows({ dateFrom: '2020-01-01', dateTo: '2025-01-01' })
    ).toMatchObject({ ok: false, reason: expect.stringContaining('24') });
  });

  test('refuse une date illisible', () => {
    expect(buildMonthlyWindows({ dateFrom: 'hier' })).toMatchObject({
      ok: false,
    });
  });
});

describe('marqueurs {start} / {end}', () => {
  test('détecte et remplace les deux marqueurs', () => {
    const hogql =
      "select 1 from events where timestamp >= toDateTime('{start}', 'UTC') and timestamp < toDateTime('{end}', 'UTC')";
    expect(hasWindowMarkers(hogql)).toBe(true);
    expect(
      applyWindow(hogql, {
        start: '2025-01-01 00:00:00',
        end: '2025-02-01 00:00:00',
      })
    ).toBe(
      "select 1 from events where timestamp >= toDateTime('2025-01-01 00:00:00', 'UTC') and timestamp < toDateTime('2025-02-01 00:00:00', 'UTC')"
    );
  });

  test('un seul marqueur ne suffit pas', () => {
    expect(hasWindowMarkers("select '{start}'")).toBe(false);
  });
});
