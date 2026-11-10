import { appLabels } from '@/app/labels/catalog';
import { JaugeBar } from '@/app/plans/shared/jauge/jauge.bar';
import { RouterOutput } from '@tet/api';
import { Button } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode, useState } from 'react';

export type AvancementAxe =
  RouterOutput['plans']['suivi']['getAvancementParAxe'][number];

const AvancementAxeLigne = ({
  axe,
  isSousAxe = false,
  chevron,
}: {
  axe: AvancementAxe;
  isSousAxe?: boolean;
  chevron?: ReactNode;
}) => (
  <div
    className="grid grid-cols-[2rem_minmax(0,2fr)_9.5rem_minmax(0,3fr)] items-center gap-4 py-2.5 border-b border-grey-3 last:border-b-0"
    data-test="plans.suivi.avancement-par-axe.ligne"
  >
    <div className="h-8">{chevron}</div>
    <span
      className={cn('flex items-start gap-3 text-sm text-primary-9', {
        'font-bold': !isSousAxe,
        'pl-1': isSousAxe,
      })}
    >
      {isSousAxe && (
        <span
          aria-hidden
          className="shrink-0 w-4 h-3.5 mt-px border-l border-b border-grey-5"
        />
      )}
      {axe.nom || appLabels.sansTitre}
    </span>
    <span className="text-xs text-grey-8">
      {isSousAxe
        ? appLabels.suiviPlanNbActions({ count: axe.total })
        : `${appLabels.suiviPlanNbActions({
            count: axe.total,
          })} · ${appLabels.avancementParAxeRealisees({
            count: axe.realisees,
          })}`}
    </span>
    <JaugeBar
      value={Math.round(axe.avancement)}
      label={axe.nom || appLabels.sansTitre}
      isBadgeLarge
    />
  </div>
);

export const AvancementAxeRow = ({ axe }: { axe: AvancementAxe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSousAxes = axe.sousAxes.length > 0;

  return (
    <>
      <AvancementAxeLigne
        axe={axe}
        chevron={
          hasSousAxes && (
            <Button
              variant="unstyled"
              size="xs"
              className="flex items-center justify-center w-8 h-8 rounded-md text-primary-9 hover:bg-primary-1"
              icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
              title={
                isOpen
                  ? appLabels.avancementParAxeMasquerSousAxes
                  : appLabels.avancementParAxeAfficherSousAxes
              }
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            />
          )
        }
      />
      {isOpen &&
        axe.sousAxes.map((sousAxe) => (
          <AvancementAxeLigne key={sousAxe.id} axe={sousAxe} isSousAxe />
        ))}
    </>
  );
};
