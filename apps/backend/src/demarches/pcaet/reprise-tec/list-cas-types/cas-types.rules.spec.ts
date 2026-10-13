import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { describe, expect, test } from 'vitest';
import type { DossierRecette } from '../shared/dossiers-recette.repository';
import { getCasType, getParticularites } from './cas-types.rules';

const repris: DossierRecette = {
  tecDossierId: 1,
  collectiviteId: 10,
  collectiviteNom: 'CC de test',
  etat: 'mise_en_oeuvre',
  motif: null,
  statut: DemarchePcaetStatusEnum.PUBLIE,
  adoptionDecideePar: 'suivi',
  melange: false,
  lanceBrut: '2019-03-01 00:00:00+00',
  oblige: true,
  transmisLe: null,
  transmisDansTec: null,
  sirenTec: '200000001',
  sirenTet: '200000001',
};

describe('getCasType', () => {
  test.each([
    [{}, 'C1'],
    [{ adoptionDecideePar: 'repli' }, 'C2'],
    [{ etat: null }, 'C3'],
    [{ etat: null, adoptionDecideePar: 'repli' }, 'C4'],
    [{ etat: 'depot_pour_avis' }, 'C5'],
    [
      { etat: 'depot_pour_avis', statut: DemarchePcaetStatusEnum.INSTRUIT },
      'C6',
    ],
    [{ etat: 'en_cours_elaboration' }, 'C7'],
    [
      {
        etat: 'en_cours_elaboration',
        statut: DemarchePcaetStatusEnum.EN_ELABORATION,
      },
      'C8',
    ],
    [{ motif: 'doublon', statut: null }, 'C9'],
    [{ motif: 'coquille_vide', statut: null }, 'C10'],
    [{ motif: 'elaboration_doublon', statut: null }, 'C11'],
    [{ motif: 'sans_etat_invisible', statut: null }, 'C12'],
    [{ motif: 'dossier_de_test', statut: null }, 'C13'],
  ] as const)('%o donne %s', (changement, attendu) => {
    expect(getCasType({ ...repris, ...changement })).toBe(attendu);
  });
});

describe('getParticularites', () => {
  test('un dossier non repris n’en a aucune', () => {
    expect(
      getParticularites({ ...repris, motif: 'doublon', melange: true })
    ).toEqual([]);
  });

  test('mélange, transmission ramenée, lancement corrigé, autre SIREN', () => {
    expect(
      getParticularites({
        ...repris,
        melange: true,
        transmisLe: '2020-01-15',
        transmisDansTec: '2020-04-02',
        lanceBrut: '0219-03-01',
        sirenTet: '200000002',
      })
    ).toEqual(['P1', 'P2', 'P3', 'P4']);
  });
});
