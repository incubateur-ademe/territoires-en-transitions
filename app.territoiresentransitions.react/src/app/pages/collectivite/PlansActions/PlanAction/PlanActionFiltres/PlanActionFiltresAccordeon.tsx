import { AccordionControlled } from '@/app/ui/Accordion';
import { PlanActionFiltres } from './PlanActionFiltres';

import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { useState } from 'react';
import { PlanNode } from '../data/types';

type Props = {
  currentPlan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  setIsFiltered: (isFiltered: boolean) => void;
  collectivite: CollectiviteNiveauAcces;
};

const PlanActionFiltresAccordeon = ({
  currentPlan,
  axe,
  isAxePage,
  setIsFiltered,
  collectivite,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AccordionControlled
      dataTest="FiltrerFiches"
      id="filtres-plan"
      className="mb-8"
      titre="Filtrer"
      html={
        isOpen && (
          <PlanActionFiltres
            plan={currentPlan}
            axe={axe}
            isAxePage={isAxePage}
            setIsFiltered={setIsFiltered}
            collectivite={collectivite}
          />
        )
      }
      expanded={isOpen}
      setExpanded={setIsOpen}
    />
  );
};

export default PlanActionFiltresAccordeon;
