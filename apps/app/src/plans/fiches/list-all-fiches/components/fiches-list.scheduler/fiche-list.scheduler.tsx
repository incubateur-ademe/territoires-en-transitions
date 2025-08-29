import { DateHelper } from '@bryntum/scheduler';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { ListFicheResumesOutput } from '@/app/plans/fiches/_data/types';
import { Scheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/bryntum-scheduler/scheduler';
import { Alert, Badge, ButtonMenu } from '@/ui';
import { cn } from '@/ui/utils/cn';

type Props = {
  fiches: ListFicheResumesOutput['data'];
  isLoading: boolean;
};

export const FicheListScheduler = ({ fiches, isLoading }: Props) => {
  // On transforme les fiches en events pour le scheduler
  const events = fiches
    .map((fiche) => {
      const startDate = fiche.dateDebut ? new Date(fiche.dateDebut) : null;
      const endDate = fiche.dateFin ? new Date(fiche.dateFin) : null;

      if (!startDate && !endDate) return null;

      const start = startDate || new Date(endDate!.getTime() - 86400000);
      const end = endDate || new Date(startDate!.getTime() + 86400000);

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

  return (
    <div className="relative h-[80vh] flex flex-col">
      <ButtonMenu
        className={cn('!absolute top-4 left-4 z-50')}
        variant="outlined"
        size="xs"
        menuPlacement="bottom-start"
        openOnHover
        icon="information-line"
        text="Aide"
      >
        <Alert
          rounded
          title="Raccourcis pour utilisation à la souris"
          description={
            <ul className="mb-0 text-sm [&>li]:flex [&>li]:items-center [&>li]:gap-1 [&>li]:pb-3">
              <li>
                Zoomer ou dé-zoomer → <Badge title="ctrl" size="sm" /> +
                <Badge title="scroll" size="sm" />
              </li>
              <li>
                Se déplacer dans le temps → <Badge title="shift" size="sm" /> +
                <Badge title="scroll" size="sm" />
              </li>
            </ul>
          }
        />
      </ButtonMenu>
      <Scheduler events={events} isLoading={isLoading} />
    </div>
  );
};
