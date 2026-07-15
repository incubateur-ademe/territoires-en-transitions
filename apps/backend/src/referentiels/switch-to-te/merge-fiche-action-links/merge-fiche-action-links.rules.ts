import { FicheActionLink } from '@tet/backend/plans/fiches/update-fiche/fiche-action-link.repository';
import {
  getReferentielIdFromActionId,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';
import { isOrigineConcernee } from '../shared/action-origine';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import { resolveCibleTeDepuisOrigine } from '../shared/correspondance-origine-cible';

export const ficheActionLinkDedupKey = (row: FicheActionLink): string =>
  `${row.ficheId}:${row.actionId}`;

export const dedupeFicheActionLinks = (
  rows: FicheActionLink[]
): FicheActionLink[] => uniqBy(rows, (row) => ficheActionLinkDedupKey(row));

export const isSourceActionConcernee = (
  sourceActionId: string,
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>
): boolean => {
  const referentielId = getReferentielIdFromActionId(sourceActionId);
  const scoreMap = scoreMapsByReferentiel.get(referentielId);
  if (!scoreMap) {
    return false;
  }

  const actionScore = scoreMap.get(sourceActionId);
  if (!actionScore) {
    return false;
  }

  return isOrigineConcernee(actionScore);
};

export const mergeFicheActionLinks = (
  ctx: SwitchToTeContext
): FicheActionLink[] => {
  const rows: FicheActionLink[] = [];

  for (const link of ctx.sourceFicheLinks) {
    if (!isSourceActionConcernee(link.actionId, ctx.scoreMapsByReferentiel)) {
      continue;
    }

    const teActionId = resolveCibleTeDepuisOrigine({
      sourceActionId: link.actionId,
      indexes: ctx.correspondanceIndexes,
      hierarchiesByReferentielId: ctx.hierarchiesByReferentielId,
      teScoreMap: ctx.teScoreMap,
    });

    if (!teActionId) {
      continue;
    }

    rows.push({ ficheId: link.ficheId, actionId: teActionId });
  }

  return dedupeFicheActionLinks(rows);
};
