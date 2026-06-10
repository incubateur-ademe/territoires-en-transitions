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

  it('retombe sur une liste vide si disabledFields est une chaîne non-JSON', () => {
    expect(
      tryParseEnqueueImportForm({ disabledFields: 'budget' })?.disabledFields
    ).toEqual([]);
  });

  it('rejette des instructions de plus de 2000 caractères', () => {
    expect(
      tryParseEnqueueImportForm({ instructions: 'a'.repeat(2001) })
    ).toBeNull();
  });

  it('rejette plus de 50 colonnes désactivées', () => {
    const fields = JSON.stringify(
      Array.from({ length: 51 }, (_, index) => `champ-${index}`)
    );
    expect(tryParseEnqueueImportForm({ disabledFields: fields })).toBeNull();
  });

  it('rejette un nom de colonne désactivée de plus de 100 caractères', () => {
    const fields = JSON.stringify(['x'.repeat(101)]);
    expect(tryParseEnqueueImportForm({ disabledFields: fields })).toBeNull();
  });
});
