import { useState } from 'react';

import { AccordionControlled } from '@/app/ui/Accordion';
import PlanActionFiltres from './PlanActionFiltres';

import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { TFilters, nameToShortNames } from '../../FicheAction/data/filters';
import { PlanNode } from '../data/types';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  setIsFiltered: (isFiltered: boolean) => void;
};

const PlanActionFiltresAccordeon = ({
  plan,
  axe,
  isAxePage,
  setIsFiltered,
}: Props) => {
  const collectivite_id = useCollectiviteId();

  // on utilise les params pour savoir si l'URL contient des filtres et
  // ainsi afficher l'accordéon ouvert ou non au montage de la page
  const [filters] = useSearchParams<TFilters>(
    isAxePage
      ? `/collectivite/${collectivite_id}/plans/plan/${plan.id}/${axe.id}`
      : `/collectivite/${collectivite_id}/plans/plan/${plan.id}`,
    { collectivite_id: collectivite_id!, axes: [axe.id] },
    nameToShortNames
  );

  const isFiltered = filters && Object.keys(filters).length > 2;

  // Stock l'état d'ouverture de l'accordéon afin d'afficher ou non la liste les filtres
  // et donc prévenir l'appel à la base s'il n'est pas ouvert
  const [isOpen, setIsOpen] = useState(isFiltered);

  return (
    <AccordionControlled
      dataTest="FiltrerFiches"
      id="filtres-plan"
      className="mb-8"
      titre="Filtrer"
      html={
        isOpen && (
          <PlanActionFiltres
            plan={plan}
            axe={axe}
            isAxePage={isAxePage}
            setIsFiltered={setIsFiltered}
          />
        )
      }
      expanded={isOpen}
      setExpanded={setIsOpen}
    />
  );
};

export default PlanActionFiltresAccordeon;
