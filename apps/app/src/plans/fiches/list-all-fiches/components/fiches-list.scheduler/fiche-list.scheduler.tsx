import { Scheduler } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/bryntum-scheduler/scheduler';
import { toSchedulerEvent } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.scheduler/bryntum-scheduler/to-sheduler-event';
import { FicheWithRelations } from '@/domain/plans';
import { Alert, Badge, DEPRECATED_ButtonMenu } from '@/ui';
import { cn } from '@/ui/utils/cn';
import '@bryntum/scheduler/scheduler.stockholm.css';
import './bryntum-scheduler/scheduler.css';

type Props = {
  fiches: FicheWithRelations[];
  isLoading: boolean;
  fichesPerPage: number;
};

export const FicheListScheduler = ({
  fiches,
  isLoading,
  fichesPerPage,
}: Props) => {
  const events = toSchedulerEvent(fiches);

  const nbFiches =
    fiches.length < fichesPerPage ? fiches.length : fichesPerPage;
  const rowHeight = 72;
  const timeAxisHeight = 65;
  const margin = 16;
  const height = rowHeight * nbFiches + timeAxisHeight + margin;

  return (
    <div
      id="fa-scheduler"
      className="relative flex flex-col"
      style={{ height, minHeight: '80vh' }}
    >
      <MenuAide />
      <Scheduler events={events} isLoading={isLoading} />
    </div>
  );
};

const MenuAide = () => (
  <DEPRECATED_ButtonMenu
    className={cn('absolute top-20 right-4 z-[1]')}
    variant="outlined"
    size="xs"
    menuPlacement="bottom-end"
    hoverConfig={{ enabled: true, move: false }}
    icon="information-line"
    text="Aide"
  >
    <Alert
      rounded
      description={
        <div className="flex flex-col gap-3 mt-0.5 pr-8">
          <p className="mb-0 text-sm">
            Les fiches n&apos;ayant ni date de début, ni date de fin ne sont pas
            affichées
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
              Se déplacer dans le temps → <Badge title="shift" size="sm" /> +
              <Badge title="scroll" size="sm" />
            </li>
          </ul>
        </div>
      }
    />
  </DEPRECATED_ButtonMenu>
);
