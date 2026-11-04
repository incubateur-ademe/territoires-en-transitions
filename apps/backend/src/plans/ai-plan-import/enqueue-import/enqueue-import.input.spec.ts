import { describe, expect, it } from 'vitest';
import { enqueueImportFormSchema } from './enqueue-import.input';

describe('enqueueImportFormSchema', () => {
  it.each(['generic', 'annexe-3-electrification'])(
    'reconnaît le profil %s sans le confondre avec un import générique',
    (profile) => {
      expect(
        enqueueImportFormSchema.parse({ planName: 'Mon plan', profile }).profile
      ).toBe(profile);
    }
  );

  it.each(['unknown', '', null])('refuse le profil invalide %s', (profile) => {
    expect(
      enqueueImportFormSchema.safeParse({ planName: 'Mon plan', profile })
        .success
    ).toBe(false);
  });

  it('applique les valeurs par défaut quand seul le nom du plan est fourni', () => {
    expect(enqueueImportFormSchema.parse({ planName: 'Mon plan' })).toEqual({
      profile: 'generic',
      instructions: '',
      planName: 'Mon plan',
      withVerifications: true,
      withSousActions: true,
      disabledFields: [],
      confirmReimport: false,
    });
  });

  it('rejette un formulaire sans nom de plan', () => {
    expect(enqueueImportFormSchema.safeParse({}).success).toBe(false);
  });

  it('convertit planType en nombre depuis le formulaire multipart', () => {
    expect(
      enqueueImportFormSchema.parse({ planName: 'Mon plan', planType: '4' })
        .planType
    ).toBe(4);
  });

  it('convertit les booléens en chaîne et accepte les colonnes désactivées en tableau', () => {
    expect(
      enqueueImportFormSchema.parse({
        instructions: 'Ignore les annexes',
        planName: 'Mon plan',
        withVerifications: 'false',
        withSousActions: 'true',
        disabledFields: ['budget', 'statut'],
      })
    ).toEqual({
      profile: 'generic',
      instructions: 'Ignore les annexes',
      planName: 'Mon plan',
      withVerifications: false,
      withSousActions: true,
      disabledFields: ['budget', 'statut'],
      confirmReimport: false,
    });
  });

  it('enveloppe en tableau une colonne désactivée unique envoyée seule', () => {
    expect(
      enqueueImportFormSchema.parse({
        planName: 'Mon plan',
        disabledFields: 'budget',
      }).disabledFields
    ).toEqual(['budget']);
  });

  it('rejette une colonne désactivée hors de la liste des champs désactivables', () => {
    expect(
      enqueueImportFormSchema.safeParse({
        planName: 'Mon plan',
        disabledFields: ['inexistant'],
      }).success
    ).toBe(false);
  });

  it('rejette des instructions de plus de 2000 caractères', () => {
    expect(
      enqueueImportFormSchema.safeParse({
        planName: 'Mon plan',
        instructions: 'a'.repeat(2001),
      }).success
    ).toBe(false);
  });

  it('rejette plus de 9 colonnes désactivées', () => {
    expect(
      enqueueImportFormSchema.safeParse({
        planName: 'Mon plan',
        disabledFields: Array.from({ length: 10 }, () => 'budget'),
      }).success
    ).toBe(false);
  });
});
