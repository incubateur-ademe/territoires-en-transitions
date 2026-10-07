import { Row } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import {
  getAdaptationFilterFn,
  getLabellisationGoldFilterFn,
  getLabellisationGoldValue,
  getThematiquesFilterFn,
} from './referentiel-table.filters.utils';
import { ReferentielTableFeatures } from './utils';

const buildAction = (
  action: Partial<ActionListItem> & Pick<ActionListItem, 'actionId'>
) =>
  ({
    adaptationNiveau: null,
    isCoremeasure: false,
    thematiques: [],
    ...action,
  } as ActionListItem);

const actions: Record<string, ActionListItem> = Object.fromEntries(
  [
    buildAction({ actionId: 'te_1', actionType: ActionTypeEnum.AXE }),
    buildAction({ actionId: 'te_1.1', actionType: ActionTypeEnum.SOUS_AXE }),
    buildAction({
      actionId: 'te_1.1.1',
      actionType: ActionTypeEnum.ACTION,
      isCoremeasure: true,
      thematiques: [{ ref: 'dechets', nom: 'Déchets' }],
    }),
    buildAction({
      actionId: 'te_1.1.1.1',
      actionType: ActionTypeEnum.SOUS_ACTION,
      adaptationNiveau: 'exposition_forte',
    }),
    buildAction({
      actionId: 'te_1.1.1.1.1',
      actionType: ActionTypeEnum.TACHE,
    }),
    buildAction({
      actionId: 'te_1.1.1.2',
      actionType: ActionTypeEnum.SOUS_ACTION,
      adaptationNiveau: 'exposition_faible',
    }),
    buildAction({ actionId: 'te_1.1.2', actionType: ActionTypeEnum.ACTION }),
    buildAction({
      actionId: 'te_1.1.2.1',
      actionType: ActionTypeEnum.SOUS_ACTION,
    }),
  ].map((action) => [action.actionId, action])
);

const rowOf = (actionId: string) =>
  ({ original: actions[actionId] } as Row<
    ReferentielTableFeatures,
    ActionListItem
  >);

describe('getAdaptationFilterFn', () => {
  const filterFn = getAdaptationFilterFn(actions);

  it("retient la sous-mesure portant le niveau d'exposition filtré et ses tâches", () => {
    expect(
      filterFn(rowOf('te_1.1.1.1'), 'adaptation', ['exposition_forte'])
    ).toBe(true);
    expect(
      filterFn(rowOf('te_1.1.1.1.1'), 'adaptation', ['exposition_forte'])
    ).toBe(true);
  });

  it("écarte les lignes d'un autre niveau ou sans niveau d'exposition", () => {
    expect(
      filterFn(rowOf('te_1.1.1.2'), 'adaptation', ['exposition_forte'])
    ).toBe(false);
    expect(
      filterFn(rowOf('te_1.1.2.1'), 'adaptation', ['exposition_forte'])
    ).toBe(false);
    expect(
      filterFn(rowOf('te_1.1.1'), 'adaptation', ['exposition_forte'])
    ).toBe(false);
  });
});

describe('getLabellisationGoldFilterFn', () => {
  const filterFn = getLabellisationGoldFilterFn(actions);

  it('ne donne une valeur que sur les mesures', () => {
    expect(getLabellisationGoldValue(actions['te_1.1.1'])).toBe('avec');
    expect(getLabellisationGoldValue(actions['te_1.1.2'])).toBe('sans');
    expect(getLabellisationGoldValue(actions['te_1.1.1.1'])).toBeNull();
  });

  it('"Avec" retient la mesure coremeasure et ses descendants', () => {
    expect(filterFn(rowOf('te_1.1.1'), 'labellisationGold', ['avec'])).toBe(
      true
    );
    expect(filterFn(rowOf('te_1.1.1.1.1'), 'labellisationGold', ['avec'])).toBe(
      true
    );
    expect(filterFn(rowOf('te_1.1.2.1'), 'labellisationGold', ['avec'])).toBe(
      false
    );
  });

  it('"Sans" retient la mesure sans le tag et ses descendants', () => {
    expect(filterFn(rowOf('te_1.1.2'), 'labellisationGold', ['sans'])).toBe(
      true
    );
    expect(filterFn(rowOf('te_1.1.2.1'), 'labellisationGold', ['sans'])).toBe(
      true
    );
    expect(filterFn(rowOf('te_1.1.1.1'), 'labellisationGold', ['sans'])).toBe(
      false
    );
  });

  // Les axes et sous-axes restent affichés via `filterFromLeafRows` dès qu'une
  // de leurs mesures est retenue : s'ils l'étaient directement, ils
  // apparaîtraient aussi quand aucune de leurs mesures ne correspond.
  it('ne retient pas directement les axes et sous-axes', () => {
    expect(filterFn(rowOf('te_1'), 'labellisationGold', ['sans'])).toBe(false);
    expect(filterFn(rowOf('te_1.1'), 'labellisationGold', ['sans'])).toBe(
      false
    );
    expect(filterFn(rowOf('te_1.1'), 'labellisationGold', ['avec'])).toBe(
      false
    );
  });

  it('retient toutes les mesures, mais pas directement les sous-axes, quand les deux valeurs sont sélectionnées', () => {
    expect(
      filterFn(rowOf('te_1.1.1'), 'labellisationGold', ['avec', 'sans'])
    ).toBe(true);
    expect(
      filterFn(rowOf('te_1.1.2.1'), 'labellisationGold', ['avec', 'sans'])
    ).toBe(true);
    expect(
      filterFn(rowOf('te_1.1'), 'labellisationGold', ['avec', 'sans'])
    ).toBe(false);
  });
});

describe('getThematiquesFilterFn', () => {
  const filterFn = getThematiquesFilterFn(actions);

  it("retient la mesure portant l'une des thématiques filtrées et ses descendants", () => {
    expect(filterFn(rowOf('te_1.1.1'), 'thematiques', ['eau', 'dechets'])).toBe(
      true
    );
    expect(filterFn(rowOf('te_1.1.1.1.1'), 'thematiques', ['dechets'])).toBe(
      true
    );
  });

  it('écarte les lignes sans la thématique filtrée', () => {
    expect(filterFn(rowOf('te_1.1.1'), 'thematiques', ['eau'])).toBe(false);
    expect(filterFn(rowOf('te_1.1.2.1'), 'thematiques', ['dechets'])).toBe(
      false
    );
  });
});
