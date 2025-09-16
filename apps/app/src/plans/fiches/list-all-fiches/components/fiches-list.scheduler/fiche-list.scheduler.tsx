import { ListFicheResumesOutput } from '@/app/plans/fiches/_data/types';
import { Scheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/bryntum-scheduler/scheduler';
import { toSchedulerEvent } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/bryntum-scheduler/utils';
import { Alert, Badge, ButtonMenu } from '@/ui';
import { cn } from '@/ui/utils/cn';

type Props = {
  fiches: ListFicheResumesOutput['data'];
  isLoading: boolean;
  fichesPerPage: number;
};

export const FicheListScheduler = ({
  fiches,
  isLoading,
  fichesPerPage,
}: Props) => {
  const events = toSchedulerEvent(fiches);

  const rowHeight = 72;
  const timeAxisHeight = 65;
  const margin = 16;
  const height = rowHeight * fichesPerPage + timeAxisHeight + margin;

  return (
    <div className="relative flex flex-col" style={{ height }}>
      <ButtonMenu
        className={cn('!absolute top-20 right-4 z-[1]')}
        variant="outlined"
        size="xs"
        menuPlacement="bottom-end"
        openOnHover
        icon="information-line"
        text="Aide"
      >
        <Alert
          rounded
          description={
            <div className="flex flex-col gap-3 mt-0.5 pr-8">
              <p className="mb-0 text-sm">
                Les fiches n&apos;ayant ni date de début, ni date de fin ne sont
                pas affichées
              </p>
              <div className="h-px bg-primary-3" />
              <p className="mb-0 font-bold text-info-1">
                Raccourcis pour utilisation à la souris
              </p>
              <ul className="mb-0 text-sm [&>li]:flex [&>li]:items-center [&>li]:gap-1 [&>li]:pb-3">
                <li>
                  Zoomer ou dé-zoomer → <Badge title="ctrl" size="sm" /> +
                  <Badge title="scroll" size="sm" />
                </li>
                <li>
                  Se déplacer dans le temps → <Badge title="shift" size="sm" />{' '}
                  +
                  <Badge title="scroll" size="sm" />
                </li>
              </ul>
            </div>
          }
        />
      </ButtonMenu>
      <Scheduler events={events} isLoading={isLoading} />
    </div>
  );
};
