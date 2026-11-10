import { renderHook } from '@testing-library/react';
import {
  ColumnFiltersState,
  createColumnHelper,
  ExpandedState,
  useTable,
} from '@tanstack/react-table';
import { ActionTypeEnum, ReferentielLabel } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import { listTotalRows } from './list-total-rows';
import {
  getLabelsFilterFn,
  getStatutFilterFn,
  getTextFilterFn,
} from './referentiel-table.filters.utils';
import { referentielTableFeatures, ReferentielTableFeatures } from './utils';

const action = ({
  actionId,
  childrenIds = [],
  labels = [],
  statut,
  avancement,
  nom = '',
  actionType = ActionTypeEnum.SOUS_ACTION,
}: {
  actionId: string;
  childrenIds?: string[];
  labels?: string[];
  statut?: string;
  avancement?: string;
  nom?: string;
  actionType?: string;
}) =>
  ({
    actionId,
    childrenIds,
    labels: labels as ReferentielLabel[],
    nom,
    actionType,
    score: { statut, avancement, concerne: true },
  } as unknown as ActionListItem);

// te_1 (axe)
// ├─ te_1.1 (mesure CAE, « eau ») → te_1.1.1 (fait), te_1.1.2 (pas fait, « eau »)
// └─ te_1.2 (mesure ECI)
//    ├─ te_1.2.1 → tâches te_1.2.1.1 (fait), te_1.2.1.2 (pas fait)
//    └─ te_1.2.2 (statut propre « fait », qui prévaut) → tâche te_1.2.2.1 (pas fait)
const actions: Record<string, ActionListItem> = Object.fromEntries(
  [
    action({
      actionId: 'te_1',
      childrenIds: ['te_1.1', 'te_1.2'],
      actionType: ActionTypeEnum.AXE,
    }),
    action({
      actionId: 'te_1.1',
      childrenIds: ['te_1.1.1', 'te_1.1.2'],
      labels: ['te_cae'],
      nom: 'Gestion de l’eau',
      actionType: ActionTypeEnum.ACTION,
    }),
    action({ actionId: 'te_1.1.1', statut: 'fait' }),
    action({ actionId: 'te_1.1.2', statut: 'pas_fait', nom: 'Eau potable' }),
    action({
      actionId: 'te_1.2',
      childrenIds: ['te_1.2.1', 'te_1.2.2'],
      labels: ['te_eci'],
      actionType: ActionTypeEnum.ACTION,
    }),
    action({ actionId: 'te_1.2.1', childrenIds: ['te_1.2.1.1', 'te_1.2.1.2'] }),
    action({
      actionId: 'te_1.2.1.1',
      statut: 'fait',
      actionType: ActionTypeEnum.TACHE,
    }),
    action({
      actionId: 'te_1.2.1.2',
      statut: 'pas_fait',
      actionType: ActionTypeEnum.TACHE,
    }),
    action({
      actionId: 'te_1.2.2',
      childrenIds: ['te_1.2.2.1'],
      avancement: 'fait',
    }),
    action({
      actionId: 'te_1.2.2.1',
      statut: 'pas_fait',
      actionType: ActionTypeEnum.TACHE,
    }),
  ].map((a) => [a.actionId, a])
);

const columnHelper = createColumnHelper<
  ReferentielTableFeatures,
  ActionListItem
>();
const columns = columnHelper.columns([
  columnHelper.accessor('labels', { filterFn: getLabelsFilterFn }),
  columnHelper.accessor((row) => row.score?.statut, {
    id: 'statut',
    filterFn: getStatutFilterFn,
  }),
]);

/** Reproduit l'affichage du tableau : lignes dépliées, tâches masquées ou non. */
const totalRowIds = ({
  columnFilters = [],
  globalFilter,
  expanded = true,
  hideTaches = false,
}: {
  columnFilters?: ColumnFiltersState;
  globalFilter?: string;
  expanded?: ExpandedState;
  hideTaches?: boolean;
}) => {
  const { result } = renderHook(() =>
    useTable({
      features: referentielTableFeatures,
      columns,
      data: [actions['te_1']],
      getSubRows: (row) => row.childrenIds.map((id) => actions[id]),
      getRowId: (row) => row.actionId,
      state: {
        columnFilters,
        expanded,
        ...(globalFilter ? { globalFilter } : {}),
      },
      globalFilterFn: getTextFilterFn,
      filterFromLeafRows: true,
    })
  );
  const displayedRows = result.current
    .getRowModel()
    .rows.filter(
      (row) => !hideTaches || row.original.actionType !== ActionTypeEnum.TACHE
    );
  return listTotalRows(displayedRows).map((row) => row.id);
};

describe('listTotalRows', () => {
  it("prend l'axe entier sans filtre", () => {
    expect(totalRowIds({})).toEqual(['te_1']);
  });

  it("ne prend que les mesures du volet filtré, pas l'axe entier", () => {
    expect(
      totalRowIds({ columnFilters: [{ id: 'labels', value: ['te_cae'] }] })
    ).toEqual(['te_1.1']);
    expect(
      totalRowIds({ columnFilters: [{ id: 'labels', value: ['te_eci'] }] })
    ).toEqual(['te_1.2']);
  });

  it('descend aux lignes retenues par un filtre de statut', () => {
    expect(
      totalRowIds({ columnFilters: [{ id: 'statut', value: ['fait'] }] })
    ).toEqual(['te_1.1.1', 'te_1.2.1.1']);
  });

  it('prend en entier un parent qui correspond lui-même, même si seule une partie de ses enfants correspond', () => {
    expect(totalRowIds({ globalFilter: 'eau' })).toEqual(['te_1.1']);
  });

  it('prend en entier une ligne dont les enfants retenus sont des tâches masquées', () => {
    expect(
      totalRowIds({
        columnFilters: [{ id: 'statut', value: ['fait'] }],
        hideTaches: true,
      })
    ).toEqual(['te_1.1.1', 'te_1.2.1']);
  });

  it('prend en entier une ligne repliée, comme elle est affichée', () => {
    expect(
      totalRowIds({
        columnFilters: [{ id: 'statut', value: ['fait'] }],
        expanded: { te_1: true },
      })
    ).toEqual(['te_1.1', 'te_1.2']);
  });

  it('ne descend pas sous une ligne dont le statut propre prévaut sur ses enfants', () => {
    expect(
      totalRowIds({ columnFilters: [{ id: 'statut', value: ['pas_fait'] }] })
    ).toEqual(['te_1.1.2', 'te_1.2.1.2', 'te_1.2.2']);
  });
});
