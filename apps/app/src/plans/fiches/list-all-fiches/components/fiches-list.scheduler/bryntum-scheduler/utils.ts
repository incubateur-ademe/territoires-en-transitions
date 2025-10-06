import { DateHelper } from '@bryntum/scheduler';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { FicheWithRelations } from '@/domain/plans/fiches';

export function toSchedulerEvent(fiches: FicheWithRelations[]) {
  return fiches
    .map((fiche) => {
      const startDate = fiche.dateDebut ? new Date(fiche.dateDebut) : null;
      const endDate = fiche.dateFin ? new Date(fiche.dateFin) : null;

      if (!startDate && !endDate) return null;

      const start = startDate || new Date(endDate!.getTime() - 86400000); // -1 jour
      const end = endDate || new Date(startDate!.getTime() + 86400000); // +1 jour

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
