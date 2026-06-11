import { describe, expect, it } from 'vitest';
import { enqueueImportFormSchema } from './enqueue-import.input';

describe('enqueueImportFormSchema', () => {
  it('applique les valeurs par défaut quand le formulaire est vide', () => {
    expect(enqueueImportFormSchema.parse({})).toEqual({
      instructions: '',
      withVerifications: true,
      withSousActions: true,
      disabledFields: [],
    });
  });

  it('convertit les booléens en chaîne et accepte les colonnes désactivées en tableau', () => {
    expect(
      enqueueImportFormSchema.parse({
        instructions: 'Ignore les annexes',
        withVerifications: 'false',
        withSousActions: 'true',
        disabledFields: ['budget', 'statut'],
      })
    ).toEqual({
      instructions: 'Ignore les annexes',
      withVerifications: false,
      withSousActions: true,
      disabledFields: ['budget', 'statut'],
    });
  });

  it('enveloppe en tableau une colonne désactivée unique envoyée seule', () => {
    expect(
      enqueueImportFormSchema.parse({ disabledFields: 'budget' }).disabledFields
    ).toEqual(['budget']);
  });

  it('rejette une colonne désactivée hors de la liste des champs désactivables', () => {
    expect(
      enqueueImportFormSchema.safeParse({ disabledFields: ['inexistant'] })
        .success
    ).toBe(false);
  });

  it('rejette des instructions de plus de 2000 caractères', () => {
    expect(
      enqueueImportFormSchema.safeParse({ instructions: 'a'.repeat(2001) })
        .success
    ).toBe(false);
  });

  it('rejette plus de 9 colonnes désactivées', () => {
    expect(
      enqueueImportFormSchema.safeParse({
        disabledFields: Array.from({ length: 10 }, () => 'budget'),
      }).success
    ).toBe(false);
  });
});
