import { describe, expect, test } from 'vitest';
import { upsertPlanWithoutFileSchema } from './upsert-plan.form';

const baseValues = {
  nom: 'Mon plan',
  typeId: null,
  referents: null,
  pilotes: null,
  file: undefined,
};

describe('upsertPlanWithoutFileSchema — validation croisée des dates', () => {
  test('accepte deux dates absentes', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: null,
      dateFin: null,
    });
    expect(result.success).toBe(true);
  });

  test('accepte une seule date renseignée (début)', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: '2025-01-01',
      dateFin: null,
    });
    expect(result.success).toBe(true);
  });

  test('accepte une seule date renseignée (fin)', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: null,
      dateFin: '2025-01-01',
    });
    expect(result.success).toBe(true);
  });

  test('accepte dateFin égale à dateDebut', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: '2025-01-01',
      dateFin: '2025-01-01',
    });
    expect(result.success).toBe(true);
  });

  test('accepte dateFin postérieure à dateDebut', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: '2025-01-01',
      dateFin: '2026-01-01',
    });
    expect(result.success).toBe(true);
  });

  test('rejette dateFin antérieure à dateDebut, sur le champ dateFin', () => {
    const result = upsertPlanWithoutFileSchema.safeParse({
      ...baseValues,
      dateDebut: '2026-01-01',
      dateFin: '2025-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['dateFin']);
    }
  });
});
