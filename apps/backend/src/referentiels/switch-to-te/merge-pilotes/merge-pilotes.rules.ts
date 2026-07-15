import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type PersonneId } from '@tet/domain/collectivites';
import { type ActionType, type ReferentielId } from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';
import {
  resolveMesureOrigineId,
  sortByReferentielOrder,
} from '../shared/action-origine';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';

export type ActionPiloteCreate = Pick<
  typeof actionPiloteTable.$inferInsert,
  'collectiviteId' | 'actionId' | 'userId' | 'tagId'
>;

export type MergePilotesForCibleInput = {
  originesConcernees: CorrelatedActionWithScore[];
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  pilotesByMesureActionId: Map<string, PersonneId[]>;
};

export const piloteDedupKey = (pilote: PersonneId): string =>
  pilote.userId ?? `tag:${pilote.tagId}`;

export const dedupePilotes = (pilotes: PersonneId[]): PersonneId[] =>
  uniqBy(
    pilotes.filter((pilote) => pilote.userId != null || pilote.tagId != null),
    piloteDedupKey
  );

export const mergePilotesForCible = (
  input: MergePilotesForCibleInput
): PersonneId[] => {
  const accumulated: PersonneId[] = [];

  for (const origine of sortByReferentielOrder(input.originesConcernees)) {
    const mesureActionId = resolveMesureOrigineId(
      {
        referentielId: origine.referentielId as ReferentielId,
        actionId: origine.actionId,
      },
      input.hierarchiesByReferentielId
    );
    const pilotes = input.pilotesByMesureActionId.get(mesureActionId) ?? [];
    accumulated.push(...pilotes);
  }

  return dedupePilotes(accumulated);
};

export const mergePilotes = (ctx: SwitchToTeContext): ActionPiloteCreate[] => {
  const rows: ActionPiloteCreate[] = [];

  for (const cible of ctx.cibles.mesures) {
    if (!cible.concernee) {
      continue;
    }

    const pilotes = mergePilotesForCible({
      originesConcernees: cible.originesConcernees,
      hierarchiesByReferentielId: ctx.hierarchiesByReferentielId,
      pilotesByMesureActionId: ctx.pilotesByMesureActionId,
    });

    if (pilotes.length === 0) {
      continue;
    }

    for (const pilote of pilotes) {
      rows.push({
        collectiviteId: ctx.collectiviteId,
        actionId: cible.actionId,
        userId: pilote.userId ?? null,
        tagId: pilote.tagId ?? null,
      });
    }
  }

  return rows;
};
