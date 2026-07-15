import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { actionServiceTable } from '@tet/backend/referentiels/models/action-service.table';
import { type ActionType, type ReferentielId } from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';
import {
  resolveMesureOrigineId,
  sortByReferentielOrder,
} from '../shared/action-origine';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';

export type ActionServiceCreate = Pick<
  typeof actionServiceTable.$inferInsert,
  'collectiviteId' | 'actionId' | 'serviceTagId'
>;

export type MergeServicesForCibleInput = {
  originesConcernees: CorrelatedActionWithScore[];
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  servicesByMesureActionId: Map<string, number[]>;
};

export const dedupeServiceTagIds = (serviceTagIds: number[]): number[] =>
  uniqBy(
    serviceTagIds.filter((serviceTagId) => serviceTagId != null),
    (serviceTagId) => serviceTagId
  );

export const mergeServicesForCible = (
  input: MergeServicesForCibleInput
): number[] => {
  const accumulated: number[] = [];

  for (const origine of sortByReferentielOrder(input.originesConcernees)) {
    const mesureActionId = resolveMesureOrigineId(
      {
        referentielId: origine.referentielId as ReferentielId,
        actionId: origine.actionId,
      },
      input.hierarchiesByReferentielId
    );
    const serviceTagIds =
      input.servicesByMesureActionId.get(mesureActionId) ?? [];
    accumulated.push(...serviceTagIds);
  }

  return dedupeServiceTagIds(accumulated);
};

export const mergeServices = (ctx: SwitchToTeContext): ActionServiceCreate[] => {
  const rows: ActionServiceCreate[] = [];

  for (const cible of ctx.cibles.mesures) {
    if (!cible.concernee) {
      continue;
    }

    const serviceTagIds = mergeServicesForCible({
      originesConcernees: cible.originesConcernees,
      hierarchiesByReferentielId: ctx.hierarchiesByReferentielId,
      servicesByMesureActionId: ctx.servicesByMesureActionId,
    });

    if (serviceTagIds.length === 0) {
      continue;
    }

    for (const serviceTagId of serviceTagIds) {
      rows.push({
        collectiviteId: ctx.collectiviteId,
        actionId: cible.actionId,
        serviceTagId,
      });
    }
  }

  return rows;
};
