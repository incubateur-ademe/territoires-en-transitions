import { describe, expect, it } from 'vitest';
import { parseEnqueueImportForm } from './enqueue-import.input';

describe('parseEnqueueImportForm', () => {
  it('applique les valeurs par défaut quand le formulaire est vide', () => {
    expect(parseEnqueueImportForm({})).toEqual({
      instructions: '',
      withVerifications: true,
      withSousActions: true,
      disabledFields: [],
    });
  });

  it('convertit les booléens en chaîne et parse les colonnes désactivées en JSON', () => {
    expect(
      parseEnqueueImportForm({
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
    expect(parseEnqueueImportForm({ disabledFields: 'budget' }).disabledFields).toEqual(
      []
    );
  });
});
