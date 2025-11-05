import { DateHelper } from '@bryntum/scheduler';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { FicheResume } from '@/domain/plans';
import { computeDateRange } from './compute-data-range';

export function toSchedulerEvent(fiches: FicheResume[]) {
  return fiches
    .map((fiche) => {
      const startDate = fiche.dateDebut ? new Date(fiche.dateDebut) : null;
      const endDate = fiche.dateFin ? new Date(fiche.dateFin) : null;

      const dateRange = computeDateRange(startDate, endDate);
      if (!dateRange) return null;
      const [start, end] = dateRange;

      return {
        id: fiche.id,
        resourceId: fiche.id,
        name: generateTitle(fiche.titre),
        fiche,
        startDate: DateHelper.format(start),
        endDate: DateHelper.format(end),
      };
    })
    .filter((e) => !!e);
}
