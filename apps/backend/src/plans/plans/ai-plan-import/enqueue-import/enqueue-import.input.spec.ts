import { describe, expect, it } from 'vitest';
import { tryParseEnqueueImportForm } from './enqueue-import.input';

describe('tryParseEnqueueImportForm', () => {
  it('applique les valeurs par défaut quand le formulaire est vide', () => {
    expect(tryParseEnqueueImportForm({})).toEqual({
      instructions: '',
      withVerifications: true,
      withSousActions: true,
      disabledFields: [],
    });
  });

  it('convertit les booléens en chaîne et parse les colonnes désactivées en JSON', () => {
    expect(
      tryParseEnqueueImportForm({
        instructions: 'Ignore les annexes',
        withVerifications: 'false',
        withSousActions: 'true',
        disabledFields: '["budget","statut"]',
      })
    ).toEqual({
      instructions: 'Ignore les annexes',
      withVerifications: false,
      withSousActions: true,
      disabledFields: ['budget', 'statut'],
    });
  });

  it('rejette un disabledFields qui n\'est pas du JSON', () => {
    expect(tryParseEnqueueImportForm({ disabledFields: 'budget' })).toBeNull();
  });

  it('rejette un disabledFields JSON qui n\'est pas un tableau', () => {
    expect(
      tryParseEnqueueImportForm({ disabledFields: '"budget"' })
    ).toBeNull();
  });

  it('rejette une colonne désactivée hors de la liste des champs désactivables', () => {
    expect(
      tryParseEnqueueImportForm({ disabledFields: '["inexistant"]' })
    ).toBeNull();
  });

  it('rejette des instructions de plus de 2000 caractères', () => {
    expect(
      tryParseEnqueueImportForm({ instructions: 'a'.repeat(2001) })
    ).toBeNull();
  });

  it('rejette plus de 9 colonnes désactivées', () => {
    const fields = JSON.stringify(Array.from({ length: 10 }, () => 'budget'));
    expect(tryParseEnqueueImportForm({ disabledFields: fields })).toBeNull();
  });
});
