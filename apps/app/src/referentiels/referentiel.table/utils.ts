import { Column } from '@tanstack/react-table';
import {
  ActionType,
  ActionTypeEnum,
  ReferentielId,
} from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { CSSProperties } from 'react';
import { ActionDetailed, Snapshot } from '../use-snapshot';
import { ReferentielTableRow } from './types';

/** Types d'actions qui sont dépliés par défaut */
const EXPANDED_BY_DEFAULT_TYPES = new Set([
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
]);

export const buildInitialExpanded = (
  rows: ReferentielTableRow[]
): Record<string, boolean> => {
  return rows.reduce((acc, row) => {
    if (EXPANDED_BY_DEFAULT_TYPES.has(row.type) && row.children?.length) {
      acc[row.id] = true;
      Object.assign(acc, buildInitialExpanded(row.children));
    }
    return acc;
  }, {} as Record<string, boolean>);
};

/** Retourne les styles communs pour les colonnes fixées */
export const getCommonPinningStyles = (
  column: Column<ReferentielTableRow>
): CSSProperties => {
  const isPinned = column.getIsPinned();
  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
};

/** Retourne la classe CSS des cellules pour chaque type d'action */
export const actionTypeToClassName: Record<ActionType, string> = {
  [ActionTypeEnum.AXE]:
    '!bg-primary-9 border-b border-r last:border-r-0 border-primary-10 font-medium text-white',
  [ActionTypeEnum.SOUS_AXE]:
    '!bg-primary-8 border-b border-r last:border-r-0 border-primary-10 font-medium text-white',
  [ActionTypeEnum.ACTION]:
    'border-r border-r-primary-10 last:border-r-0 border-b border-b-grey-3 !bg-primary-1 text-primary-9',
  [ActionTypeEnum.SOUS_ACTION]:
    'border-r border-r-primary-10 last:border-r-0 border-b border-b-grey-3 !bg-white text-primary-9',
  [ActionTypeEnum.TACHE]:
    'border-r border-r-primary-10 last:border-r-0 border-b border-b-grey-3 !bg-white text-primary-9',
  [ActionTypeEnum.REFERENTIEL]: '',
};

/** Transforme les données du snapshot au format attendu par le tableau du référentiel */
function mapActionToRow(
  action: ActionDetailed,
  collectiviteId: number,
  referentielId: ReferentielId
): ReferentielTableRow {
  const { score } = action;

  return {
    id: action.actionId,
    collectiviteId,
    referentielId,
    actionId: action.actionId,
    identifiant: action.identifiant,
    nom: action.nom,
    depth: action.level,
    type: action.actionType as ActionType,
    explication: score.explication,
    scoreRealise: divisionOrZero(score.pointFait, score.pointPotentiel),
    scoreProgramme: divisionOrZero(score.pointProgramme, score.pointPotentiel),
    scorePasFait: divisionOrZero(score.pointPasFait, score.pointPotentiel),
    pointFait: score.pointFait,
    pointProgramme: score.pointProgramme,
    pointsPasFait: score.pointPasFait,
    pointPotentiel: score.pointPotentiel,
    pointRestant: score.pointPotentiel - score.pointFait,
    statut: score.statut,
    phase: action.categorie ?? undefined,
    children: action.actionsEnfant.map((child) =>
      mapActionToRow(child, collectiviteId, referentielId)
    ),
  };
}

export function snapshotToReferentielTableRows(
  snapshot: Snapshot
): ReferentielTableRow[] {
  return snapshot.scoresPayload.scores.actionsEnfant.map((action) =>
    mapActionToRow(action, snapshot.collectiviteId, snapshot.referentielId)
  );
}
