import classNames from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ActionCard } from '@/app/referentiels/actions/action.card';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { ActionType } from '@/domain/referentiels';
import { AccordionControlled, AccordionType } from '@/ui';

export type TAxe = ActionListItem & {
  children?: TAxe[];
};

type Props = {
  axe: TAxe;
  accordionProps?: Omit<AccordionType, 'title' | 'content'>;
  showDescription?: boolean;
};

/** Axe et sous-axe de la liste de mesures du référentiel */
const Axe = ({ axe, accordionProps, showDescription }: Props) => {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('axe');

  const [isOpen, setIsOpened] = useState(
    idParam ? axe.actionId.includes(idParam) : false
  );

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (axe.actionId === idParam) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [idParam, axe.actionId]);

  const isActionChildren = axe.children?.[0]?.actionType === 'action';

  return (
    <AccordionControlled
      ref={ref}
      dataTest={`ExpandableAction-${axe.identifiant}`}
      title={axe.nom}
      containerClassname="!border-t-0 last:border-b-0"
      headerClassname={classNames({ '!pb-4': isOpen })}
      expanded={isOpen}
      setExpanded={() => setIsOpened(!isOpen)}
      headerContent={
        <div className="flex items-center justify-between gap-3">
          <ScoreProgressBar
            id={axe.actionId}
            identifiant={axe.identifiant}
            type={axe.actionType as ActionType}
            className="w-48 max-md:hidden"
          />
          <ScoreRatioBadge
            actionId={axe.actionId}
            className="justify-end w-40 max-sm:hidden"
            size="sm"
          />
        </div>
      }
      content={
        isActionChildren ? (
          <div
            className={classNames('grid grid-rows-1 grid-cols-1 gap-4 mb-4', {
              'md:grid-cols-2 xl:grid-cols-3': !showDescription,
            })}
          >
            {axe.children?.map((child) => (
              <ActionCard
                key={child.actionId}
                action={child}
                showDescription={showDescription}
              />
            ))}
          </div>
        ) : (
          <div className={classNames('flex flex-col')}>
            {axe.children?.map((child) => (
              <Axe
                key={child.actionId}
                axe={{ ...child, nom: `${child.identifiant} ${child.nom}` }}
                accordionProps={{
                  containerClassname: 'ml-4 !border-0 !text-grey-7',
                  headerClassname: '!py-4 !text-grey-6',
                  arrowClassname: '!text-grey-6',
                }}
                showDescription={showDescription}
              />
            ))}
          </div>
        )
      }
      {...accordionProps}
    />
  );
};

export default Axe;
