import { describe, expect, it } from 'vitest';
import {
  buildSearchDossiersSuggestions,
  type CollectivitesSuivies,
} from './search-dossiers.suggestions';

const collectivite = (
  id: number,
  nom: string,
  departementCode: string,
  regionCode: string,
  extra: Partial<CollectivitesSuivies['collectivites'][number]> = {}
): CollectivitesSuivies['collectivites'][number] => ({
  id,
  nom,
  departementCode,
  departementLibelle: departementCode === '70' ? 'Haute-Saône' : 'Hérault',
  regionCode,
  regionLibelle: regionCode === '27' ? 'Bourgogne-Franche-Comté' : 'Occitanie',
  porteur: null,
  isSupra: false,
  ...extra,
});

const NATIONAL: CollectivitesSuivies = {
  collectivites: [
    collectivite(1, 'CC du Pays d’Héricourt', '70', '27'),
    collectivite(2, 'Montpellier Méditerranée Métropole', '34', '76'),
    collectivite(3, 'PETR du Pays Lauragais', '34', '76', { isSupra: true }),
    collectivite(4, 'CC Lauragais Revel Sorezois', '34', '76', {
      porteur: { id: 3, nom: 'PETR du Pays Lauragais' },
    }),
  ],
  departements: [
    { code: '34', libelle: 'Hérault' },
    { code: '70', libelle: 'Haute-Saône' },
  ],
  regions: [
    { code: '27', libelle: 'Bourgogne-Franche-Comté' },
    { code: '76', libelle: 'Occitanie' },
  ],
};

const groupes = (suivies: CollectivitesSuivies, query: string) =>
  buildSearchDossiersSuggestions(suivies)(query).map(({ id, options }) => ({
    id,
    options: options.map(({ label }) => label),
  }));

describe('buildSearchDossiersSuggestions', () => {
  it('trouve une collectivité mal tapée', () => {
    expect(groupes(NATIONAL, 'hericout')).toEqual([
      { id: 'collectivites', options: ['CC du Pays d’Héricourt'] },
    ]);
  });

  it('signale le Supra et rattache l’EPCI couvert à son porteur', () => {
    const [{ options }] = buildSearchDossiersSuggestions(NATIONAL)('laura');
    expect(options).toEqual([
      expect.objectContaining({
        label: 'CC Lauragais Revel Sorezois',
        description: 'Couverte par PETR du Pays Lauragais',
      }),
      expect.objectContaining({
        label: 'PETR du Pays Lauragais',
        badge: 'Supra',
      }),
    ]);
  });

  it('suggère départements et régions, avec leur nombre de collectivités', () => {
    const suggestions = buildSearchDossiersSuggestions(NATIONAL)('herault');
    expect(suggestions.map(({ id }) => id)).toEqual(['departements']);
    expect(suggestions[0].options[0]).toMatchObject({
      id: '34',
      label: 'Hérault (34)',
      meta: '3 collectivités',
    });
    expect(groupes(NATIONAL, 'occit')).toEqual([
      { id: 'regions', options: ['Occitanie'] },
    ]);
  });

  it('tait départements et régions sur un territoire qui n’en a qu’un', () => {
    const ddt: CollectivitesSuivies = {
      collectivites: [NATIONAL.collectivites[0]],
      departements: [{ code: '70', libelle: 'Haute-Saône' }],
      regions: [{ code: '27', libelle: 'Bourgogne-Franche-Comté' }],
    };
    expect(groupes(ddt, 'haute')).toEqual([]);
  });
});
