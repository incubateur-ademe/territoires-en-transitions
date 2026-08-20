import { describe, expect, it } from 'vitest';
import { buildLookupConfig } from './build-lookup-config';
import { getFilterValuesLabels } from './get-filter-values-labels';

const PILOTE_UUID = 'ccc3bc7c-3eb9-4d17-bec9-4dad77cfcefa';

const toLookupConfig = (personneOptions: Array<{ value: string; label: string }>) =>
  buildLookupConfig({
    plans: [],
    personneOptions,
    services: [],
    thematiques: [],
    financeurs: [],
    structures: [],
    partenaires: [],
    libreTags: [],
    instanceGouvernanceTags: [],
  });

describe('getFilterValuesLabels', () => {
  it('rend le nom de la personne quand elle figure dans la liste', () => {
    const config = toLookupConfig([
      { value: PILOTE_UUID, label: 'Camille Dupont' },
    ]);

    expect(
      getFilterValuesLabels(config, 'utilisateurPiloteIds', [PILOTE_UUID])
    ).toEqual(['Camille Dupont']);
  });

  it("n'affiche jamais l'identifiant brut d'un pilote absent de la liste", () => {
    const config = toLookupConfig([]);

    expect(
      getFilterValuesLabels(config, 'utilisateurPiloteIds', [PILOTE_UUID])
    ).toEqual(['Inconnu']);
  });

  it("n'affiche jamais l'identifiant brut d'un référent absent de la liste", () => {
    const config = toLookupConfig([]);

    expect(
      getFilterValuesLabels(config, 'utilisateurReferentIds', [PILOTE_UUID])
    ).toEqual(['Inconnu']);
  });

  it('rend la valeur telle quelle pour une catégorie sans table de résolution', () => {
    expect(getFilterValuesLabels({}, 'anneesNotes', ['2024'])).toEqual(['2024']);
  });
});
