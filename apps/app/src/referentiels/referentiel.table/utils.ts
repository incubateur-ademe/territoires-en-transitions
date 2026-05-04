import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Table, TableMeta } from '@tanstack/react-table';
import {
  ActionId,
  ActionType,
  ActionTypeEnum,
  ReferentielException,
  ReferentielId,
} from '@tet/domain/referentiels';
import { DiscussionListItem } from '../actions/comments/hooks/use-list-discussions';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';

const isTableMetaValid = (
  meta?: TableMeta<ActionListItem>
): meta is ReferentielTableMeta => {
  return (
    meta !== undefined &&
    'collectiviteId' in meta &&
    'referentielId' in meta &&
    'permissions' in meta &&
    meta.permissions !== undefined &&
    'canMutateReferentiel' in meta.permissions &&
    typeof meta.permissions.canMutateReferentiel === 'boolean' &&
    'updateActionStatut' in meta &&
    typeof meta.updateActionStatut === 'function' &&
    'updateActionPilotes' in meta &&
    typeof meta.updateActionPilotes === 'function' &&
    'updateActionServices' in meta &&
    typeof meta.updateActionServices === 'function' &&
    'updateActionExplication' in meta &&
    typeof meta.updateActionExplication === 'function' &&
    'setFocusedCellId' in meta &&
    typeof meta.setFocusedCellId === 'function' &&
    'isPendingDetailleALaTache' in meta &&
    typeof meta.isPendingDetailleALaTache === 'function' &&
    'setPendingDetailleALaTache' in meta &&
    typeof meta.setPendingDetailleALaTache === 'function'
  );
};

export type ReferentielTableMeta = {
  collectiviteId: number;
  referentielId: ReferentielId;

  permissions: {
    canMutateReferentiel: boolean;
  };

  commentsByActionId?: Partial<Record<ActionId, DiscussionListItem[]>>;
  fichesByActionId?: Partial<Record<ActionId, FicheListItem[]>>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  updateActionPilotes: ReturnType<typeof useUpsertMesurePilotes>['mutate'];
  updateActionServices: ReturnType<
    typeof useUpsertMesureServicesPilotes
  >['mutate'];
  updateActionExplication: ReturnType<
    typeof useUpdateActionExplication
  >['mutate'];
  /**
   * Cible la cellule à focusser après le prochain rendu (ex: après dépliage
   * d'une ligne lors du passage en « détaillé à la tâche »).
   */
  setFocusedCellId: (cellId: string) => void;
  /**
   * Etat UI transitoire pour afficher "détaillé à la tâche" juste après
   * sélection, avant que l'inférence backend ne reflète ce statut.
   */
  isPendingDetailleALaTache: (actionId: ActionId) => boolean;
  setPendingDetailleALaTache: (actionId: ActionId, isPending: boolean) => void;
};

export const getTableMeta = (
  table: Table<ActionListItem>
): ReferentielTableMeta => {
  const meta = table.options.meta;
  if (!isTableMetaValid(meta)) {
    throw new ReferentielException('Table meta is not valid');
  }
  return meta;
};

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
