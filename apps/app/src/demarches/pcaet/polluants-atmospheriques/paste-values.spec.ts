import { describe, expect, it } from 'vitest';
import {
  analyzePasteCell,
  parseFrenchNumber,
  splitPaste,
  TargetCell,
  toAbsolute,
  mapPasteToValues,
} from './paste-values';

describe('parseFrenchNumber', () => {
  it('treats an empty or blank string as empty', () => {
    expect(parseFrenchNumber('')).toEqual({ status: 'empty' });
    expect(parseFrenchNumber('   ')).toEqual({ status: 'empty' });
  });

  it('parses a comma decimal', () => {
    expect(parseFrenchNumber('12,5')).toEqual({ status: 'ok', value: 12.5 });
  });

  it('strips thousands separators (plain and non-breaking space)', () => {
    expect(parseFrenchNumber('1 234')).toEqual({ status: 'ok', value: 1234 });
    expect(parseFrenchNumber('1 234,5')).toEqual({
      status: 'ok',
      value: 1234.5,
    });
    expect(parseFrenchNumber('1 234')).toEqual({
      status: 'ok',
      value: 1234,
    });
  });

  it('parses an integer and a negative number', () => {
    expect(parseFrenchNumber('1000')).toEqual({ status: 'ok', value: 1000 });
    expect(parseFrenchNumber('-40')).toEqual({ status: 'ok', value: -40 });
  });

  it('flags a non-numeric value', () => {
    expect(parseFrenchNumber('abc')).toEqual({ status: 'invalid' });
    expect(parseFrenchNumber('12,5,5')).toEqual({ status: 'invalid' });
  });
});

describe('analyzePasteCell', () => {
  it('treats an empty string as empty', () => {
    expect(analyzePasteCell('   ')).toEqual({ status: 'empty' });
  });

  it('classifies a value without percent sign as absolute', () => {
    expect(analyzePasteCell('1 234,5')).toEqual({
      status: 'absolute',
      value: 1234.5,
    });
  });

  it('classifies a value with percent sign as relative', () => {
    expect(analyzePasteCell('-40%')).toEqual({
      status: 'relative',
      percentage: -40,
    });
    expect(analyzePasteCell('-40 %')).toEqual({
      status: 'relative',
      percentage: -40,
    });
  });

  it('flags invalid when the percent sign is alone or the number is unreadable', () => {
    expect(analyzePasteCell('%')).toEqual({ status: 'invalid' });
    expect(analyzePasteCell('abc%')).toEqual({ status: 'invalid' });
  });
});

describe('toAbsolute', () => {
  it('returns the absolute value as is', () => {
    expect(toAbsolute({ type: 'absolute', value: 1234 }, null)).toEqual({
      ok: true,
      value: 1234,
    });
  });

  it('converts a relative evolution against the reference', () => {
    expect(toAbsolute({ type: 'relative', percentage: -40 }, 1000)).toEqual({
      ok: true,
      value: 600,
    });
  });

  it('fails on a relative value without reference', () => {
    expect(toAbsolute({ type: 'relative', percentage: -40 }, null)).toEqual({
      ok: false,
    });
  });
});

describe('splitPaste', () => {
  it('splits a block into rows then cells', () => {
    expect(splitPaste('1\t2\n3\t4')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('normalizes CRLF line endings and drops the trailing empty line', () => {
    expect(splitPaste('1\t2\r\n3\t4\r\n')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});

describe('mapPasteToValues', () => {
  const targetGrid: (TargetCell | null)[][] = [
    [
      { indicateurId: 10, year: 2015, field: 'resultat' },
      { indicateurId: 10, year: 2030, field: 'objectif' },
    ],
    [
      { indicateurId: 20, year: 2015, field: 'resultat' },
      { indicateurId: 20, year: 2030, field: 'objectif' },
    ],
  ];

  it('maps a block positionally from the anchor', () => {
    const result = mapPasteToValues({
      paste: '100\t50\n200\t80',
      targetGrid,
      anchor: { row: 0, column: 0 },
    });

    expect(result).toEqual({
      entries: [
        {
          indicateurId: 10,
          year: 2015,
          field: 'resultat',
          value: { type: 'absolute', value: 100 },
        },
        {
          indicateurId: 10,
          year: 2030,
          field: 'objectif',
          value: { type: 'absolute', value: 50 },
        },
        {
          indicateurId: 20,
          year: 2015,
          field: 'resultat',
          value: { type: 'absolute', value: 200 },
        },
        {
          indicateurId: 20,
          year: 2030,
          field: 'objectif',
          value: { type: 'absolute', value: 80 },
        },
      ],
      errors: [],
    });
  });

  it('classifies cells with a percent sign as relative', () => {
    const result = mapPasteToValues({
      paste: '100\t-40%',
      targetGrid,
      anchor: { row: 0, column: 0 },
    });

    expect(result).toEqual({
      entries: [
        {
          indicateurId: 10,
          year: 2015,
          field: 'resultat',
          value: { type: 'absolute', value: 100 },
        },
        {
          indicateurId: 10,
          year: 2030,
          field: 'objectif',
          value: { type: 'relative', percentage: -40 },
        },
      ],
      errors: [],
    });
  });

  it('offsets the mapping by the anchor', () => {
    const result = mapPasteToValues({
      paste: '80',
      targetGrid,
      anchor: { row: 1, column: 1 },
    });

    expect(result).toEqual({
      entries: [
        {
          indicateurId: 20,
          year: 2030,
          field: 'objectif',
          value: { type: 'absolute', value: 80 },
        },
      ],
      errors: [],
    });
  });

  it('silently skips empty cells of the block', () => {
    const result = mapPasteToValues({
      paste: '100\t\n\t80',
      targetGrid,
      anchor: { row: 0, column: 0 },
    });

    expect(result).toEqual({
      entries: [
        {
          indicateurId: 10,
          year: 2015,
          field: 'resultat',
          value: { type: 'absolute', value: 100 },
        },
        {
          indicateurId: 20,
          year: 2030,
          field: 'objectif',
          value: { type: 'absolute', value: 80 },
        },
      ],
      errors: [],
    });
  });

  it('reports non-empty cells that fall outside the grid', () => {
    const result = mapPasteToValues({
      paste: '100\t50\t999',
      targetGrid,
      anchor: { row: 0, column: 0 },
    });

    expect(result.entries).toEqual([
      {
        indicateurId: 10,
        year: 2015,
        field: 'resultat',
        value: { type: 'absolute', value: 100 },
      },
      {
        indicateurId: 10,
        year: 2030,
        field: 'objectif',
        value: { type: 'absolute', value: 50 },
      },
    ]);
    expect(result.errors).toEqual([
      { row: 0, column: 2, rawValue: '999', reason: 'out_of_grid' },
    ]);
  });

  it('reports non-numeric cells within the grid', () => {
    const result = mapPasteToValues({
      paste: 'abc\t50',
      targetGrid,
      anchor: { row: 0, column: 0 },
    });

    expect(result.entries).toEqual([
      {
        indicateurId: 10,
        year: 2030,
        field: 'objectif',
        value: { type: 'absolute', value: 50 },
      },
    ]);
    expect(result.errors).toEqual([
      { row: 0, column: 0, rawValue: 'abc', reason: 'not_numeric' },
    ]);
  });
});
