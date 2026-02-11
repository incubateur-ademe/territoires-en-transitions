import { CollectiviteCurrent } from '@tet/api/collectivites';
import { PlanNode } from '@tet/domain/plans';
import { cn } from '@tet/ui';
import { useEffect, useRef } from 'react';
import { AxeDescription } from './axe-description';
import { AxeFiches } from './axe-fiches';
import { AxeHeader } from './axe-header';
import { AxeIndicateurs } from './axe-indicateurs';
import { AxeSkeleton } from './axe-skeleton';
import { AxeSousAxes } from './axe-sous-axes';
import { AxeProvider, useAxeContext } from './axe.context';

type Props = {
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  collectivite: CollectiviteCurrent;
};

export const Axe = (props: Props) => {
  return (
    <AxeProvider {...props}>
      <AxeContent />
    </AxeProvider>
  );
};

const AxeContent = () => {
  const { isOpen, isMainAxe, sousAxes, shouldScroll, providerProps } =
    useAxeContext();
  const { axe } = providerProps;
  const hasFiches = axe.fiches.length > 0;
  const hasSousAxes = sousAxes.length > 0;
  const axeRef = useRef<HTMLDivElement>(null);

  // Gérer le scroll automatique avec shouldScroll
  useEffect(() => {
    if (shouldScroll && axeRef.current) {
      axeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [shouldScroll]);

  if (axe.id < 0) {
    return <AxeSkeleton />;
  }

  return (
    <div
      ref={axeRef}
      data-test="Axe"
      id={`axe-${axe.id}`}
      className={cn('relative flex flex-col border rounded-md', {
        'border-grey-4': !isMainAxe || !isOpen,
        'border-primary-4': isMainAxe && isOpen,
      })}
    >
      <AxeHeader />
      {isOpen && (
        <div
          className="flex flex-col pt-0 pb-4 px-4 gap-4"
          data-test="axe-detail"
        >
          <AxeDescription />
          <AxeIndicateurs />
          <AxeFiches />
          <AxeSousAxes />
          {!hasFiches && !hasSousAxes && (
            <span className="px-6 pt-3 pb-0 text-sm italic text-grey-6">
              Cet axe ne contient aucune action ni axe
            </span>
          )}
        </div>
      )}
    </div>
  );
};
