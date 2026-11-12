import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { toQueryPayload } from '@/app/plans/plans/show-plan/data/use-fiches-filters-list/filter-formatters';
import { Filters } from '@/app/plans/plans/show-plan/data/use-fiches-filters-list/types';
import { Statut } from '@tet/domain/plans';
import { pick } from 'es-toolkit';

export type PilotageFilters = Omit<Filters, 'collectiviteId' | 'axes' | 'page'>;

export const makePilotageParStatutUrl = ({
  collectiviteId,
  planId,
  statut,
  filters = {},
}: {
  collectiviteId: number;
  planId: number;
  statut: Statut | null;
  filters?: PilotageFilters;
}) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
    filters: {
      ...pick(toQueryPayload({ ...filters, collectiviteId }), [
        'priorites',
        'noPriorite',
        'personnePiloteIds',
        'noPilote',
        'personneReferenteIds',
        'noReferent',
        'enCoursSansAvancement',
        'notModifiedForOverAYear',
      ]),
      ...(statut ? { statuts: [statut] } : { noStatut: true }),
    },
  });
