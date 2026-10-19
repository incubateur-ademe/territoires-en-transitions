import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ReferentielId } from '@tet/domain/referentiels';
import { describe, expect, test } from 'vitest';
import {
  filterSelectableMesures,
  searchMesuresByIdentifiant,
} from './filter-mesures';

const makeMesure = (actionId: string): ActionListItem => {
  const [referentiel, identifiant] = actionId.split('_');
  return {
    actionId,
    identifiant,
    referentiel: referentiel as ReferentielId,
    nom: `Mesure ${actionId}`,
  } as ActionListItem;
};

const mesures = ['cae_1.1.1', 'cae_1.2', 'eci_1.1', 'te_1.1.1', 'te_2.1'].map(
  makeMesure
);

const ids = (list: ActionListItem[] | null) => list?.map((m) => m.actionId);

describe('filterSelectableMesures', () => {
  test('propose les mesures des référentiels modifiables', () => {
    expect(
      ids(
        filterSelectableMesures(mesures, {
          writableReferentielIds: ['te'],
          linkedMesureIds: [],
        })
      )
    ).toEqual(['te_1.1.1', 'te_2.1']);
  });

  test("propose aussi les mesures déjà liées d'un référentiel non modifiable", () => {
    expect(
      ids(
        filterSelectableMesures(mesures, {
          writableReferentielIds: ['te'],
          linkedMesureIds: ['cae_1.2'],
        })
      )
    ).toEqual(['cae_1.2', 'te_1.1.1', 'te_2.1']);
  });
});

describe('searchMesuresByIdentifiant', () => {
  test('renvoie null quand la saisie est un nom', () => {
    expect(searchMesuresByIdentifiant(mesures, 'énergie')).toBeNull();
  });

  test('cherche par identifiant numérique dans tous les référentiels', () => {
    expect(ids(searchMesuresByIdentifiant(mesures, '1.1'))).toEqual([
      'cae_1.1.1',
      'eci_1.1',
      'te_1.1.1',
    ]);
  });

  test('cherche dans Climat Ressources avec le préfixe cr', () => {
    expect(ids(searchMesuresByIdentifiant(mesures, 'cr 1.1'))).toEqual([
      'te_1.1.1',
    ]);
    expect(ids(searchMesuresByIdentifiant(mesures, 'CR2'))).toEqual([
      'te_2.1',
    ]);
  });

  test('cherche dans CAE et ECI avec leurs préfixes', () => {
    expect(ids(searchMesuresByIdentifiant(mesures, 'cae 1.2'))).toEqual([
      'cae_1.2',
    ]);
    expect(ids(searchMesuresByIdentifiant(mesures, 'eci 1'))).toEqual([
      'eci_1.1',
    ]);
  });
});
