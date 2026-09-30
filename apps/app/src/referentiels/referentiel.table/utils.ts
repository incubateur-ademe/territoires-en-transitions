import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  Table,
  tableFeatures,
} from '@tanstack/react-table';
import {
  ActionId,
  ActionType,
  ActionTypeEnum,
  ReferentielException,
  ReferentielId,
} from '@tet/domain/referentiels';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { DiscussionListItem } from '../actions/comments/hooks/use-list-discussions';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';
import { MesureAuditStatutRow } from '../audits/use-list-mesure-audit-statuts-grouped-by-id';
import { useUpdateMesureAuditStatut } from '../audits/use-update-mesure-audit-statut';

export type ReferentielTableMeta = {
  collectiviteId: number;
  referentielId: ReferentielId;

  permissions: {
    canMutateReferentiel: boolean;
  };

  commentsByActionId?: Partial<Record<ActionId, DiscussionListItem[]>>;
  fichesByActionId?: Partial<Record<ActionId, FicheListItem[]>>;
  auditStatutsByMesureId?: Partial<Record<ActionId, MesureAuditStatutRow>>;
  canUpdateAudit?: boolean;
  updateMesureAuditStatut?: ReturnType<
    typeof useUpdateMesureAuditStatut
  >['mutate'];
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  updateActionPilotes: ReturnType<typeof useUpsertMesurePilotes>['mutate'];
  updateActionServices: ReturnType<
    typeof useUpsertMesureServicesPilotes
  >['mutate'];
  updateActionExplication: ReturnType<
    typeof useUpdateActionExplication
  >['mutate'];
  /**
   * Etat UI transitoire pour afficher "détaillé à la tâche" juste après
   * sélection, avant que l'inférence backend ne reflète ce statut.
   */
  isPendingDetailleALaTache: (actionId: ActionId) => boolean;
  setPendingDetailleALaTache: (actionId: ActionId, isPending: boolean) => void;
};

export const referentielTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  expandedRowModel: createExpandedRowModel(),
  tableMeta: metaHelper<ReferentielTableMeta>(),
});

export type ReferentielTableFeatures = typeof referentielTableFeatures;

export const getTableMeta = (
  table: Table<ReferentielTableFeatures, ActionListItem>
): ReferentielTableMeta => {
  const meta = table.options.meta;
  if (meta === undefined) {
    throw new ReferentielException('Table meta is not valid');
  }
  return meta;
};

export const isAuditableMesure = (
  action: ActionListItem,
  auditStatut: MesureAuditStatutRow | undefined
): auditStatut is MesureAuditStatutRow =>
  action.actionType === ActionTypeEnum.ACTION && auditStatut !== undefined;

export const rowClassNameByActionType: Record<ActionType, string> = {
  [ActionTypeEnum.AXE]:
    '!bg-primary-9 font-medium text-white [&_td]:border-b  [&_td]:border-primary-10 ',
  [ActionTypeEnum.SOUS_AXE]:
    '!bg-primary-8 font-medium text-white [&_td]:border-b  [&_td]:border-primary-10',
  [ActionTypeEnum.ACTION]:
    '!bg-primary-1 text-primary-9  [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.SOUS_ACTION]:
    '!bg-white text-primary-9 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.TACHE]:
    '!bg-white text-primary-9 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.REFERENTIEL]: '',
  [ActionTypeEnum.EXEMPLE]: '',
};
