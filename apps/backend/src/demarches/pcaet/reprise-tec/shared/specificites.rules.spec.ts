import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { describe, expect, test } from 'vitest';
import { listSpecificites, SpecificitesInput } from './specificites.rules';

const demarchePubliee = {
  status: DemarchePcaetStatusEnum.PUBLIE,
  launchedAt: '2019-03-01T00:00:00.000Z',
  transmittedAt: null,
  adoptedAt: '2021-06-30',
};

const dossierRepris: SpecificitesInput = {
  dossier: {
    etat: 'mise_en_oeuvre',
    lanceBrut: '2019-03-01 00:00:00+00',
    receptionProjetLe: null,
    avisDrealLe: null,
    avisCrLe: null,
    melange: false,
    adoptionDecideePar: null,
  },
  copieId: null,
  sirenTec: '200000001',
  sirenTet: '200000001',
  suivi: { avisEtatLe: null, approbationLe: null },
  demarche: demarchePubliee,
};

const codes = (input: SpecificitesInput) =>
  listSpecificites(input).map((s) => s.code);

describe('listSpecificites', () => {
  test('un dossier sans particularité n’en a aucune', () => {
    expect(codes(dossierRepris)).toEqual([]);
  });

  test('un dossier non repris ne garde que SIREN et copie', () => {
    expect(
      codes({
        ...dossierRepris,
        dossier: { ...dossierRepris.dossier, etat: null, melange: true },
        sirenTet: '200000002',
        copieId: 12,
        demarche: null,
      })
    ).toEqual(['autre_siren', 'copie_fondue']);
  });

  test('en élaboration dans T&C et publié dans TeT', () => {
    expect(
      codes({
        ...dossierRepris,
        dossier: { ...dossierRepris.dossier, etat: 'en_cours_elaboration' },
      })
    ).toEqual(['elaboration_publie']);
  });

  test('lancement saisi avant 2000', () => {
    expect(
      listSpecificites({
        ...dossierRepris,
        dossier: { ...dossierRepris.dossier, lanceBrut: '0219-03-01' },
      })
    ).toEqual([
      expect.objectContaining({
        code: 'lancement_corrige',
        saisi: '0219-03-01',
        lanceLe: '2019-03-01',
      }),
    ]);
  });

  test('transmission : réception du projet, sinon le premier avis', () => {
    expect(
      listSpecificites({
        ...dossierRepris,
        dossier: {
          ...dossierRepris.dossier,
          avisDrealLe: '2020-05-10',
          avisCrLe: '2020-04-02',
        },
        demarche: {
          ...demarchePubliee,
          transmittedAt: '2020-01-15T00:00:00.000Z',
        },
      })
    ).toEqual([
      expect.objectContaining({
        code: 'transmission_ramenee',
        transmisDansTec: '2020-04-02',
        transmisLe: '2020-01-15',
      }),
    ]);
  });

  test('adoption par repli, mélange et élaboration sans service', () => {
    expect(
      codes({
        ...dossierRepris,
        dossier: {
          ...dossierRepris.dossier,
          adoptionDecideePar: 'repli',
          melange: true,
        },
        demarche: {
          ...demarchePubliee,
          status: DemarchePcaetStatusEnum.EN_ELABORATION,
        },
      })
    ).toEqual(['adoption_repli', 'melange', 'aucun_service']);
  });
});
