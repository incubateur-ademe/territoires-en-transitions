import {useEffect, useState} from 'react';

import {Accordion} from 'ui/Accordion';
import PlanActionFiltres from './PlanActionFiltres';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useSearchParams} from 'core-logic/hooks/query';
import {TFilters, nameToShortNames} from '../../FicheAction/data/filters';
import {PlanNode} from '../data/types';

type Props = {
  plan: PlanNode;
  axe?: PlanNode;
  isFiltered: boolean;
  setIsFiltered: (isFiltered: boolean) => void;
};

const PlanActionFiltresAccordeon = ({
  plan,
  axe,
  isFiltered,
  setIsFiltered,
}: Props) => {
  const collectivite_id = useCollectiviteId();

  // Stock l'état d'ouverture de l'accordéon afin d'afficher ou non la liste les filtres
  // et donc prévenir l'appel à la base s'il n'est pas ouvert
  const [isOpen, setIsOpen] = useState(false);

  // on utilise les params pour savoir si l'URL contient des filtres et
  // ainsi afficher l'accordéon ouvert ou non au montage de la page
  const [filters] = useSearchParams<TFilters>(
    axe
      ? `/collectivite/${collectivite_id}/plans/plan/${plan.id}/${axe.id}`
      : `/collectivite/${collectivite_id}/plans/plan/${plan.id}`,
    {collectivite_id: collectivite_id!, axes_id: [axe ? axe.id : plan.id]},
    nameToShortNames
  );

  const isTestFiltered = filters && Object.keys(filters).length > 2;

  useEffect(() => setIsOpen(isTestFiltered), []);

  return (
    <Accordion
      dataTest="FiltrerFiches"
      id="filtres-plan"
      className="mb-8"
      titre="Filtrer"
      onExpand={isExpand => setIsOpen(isExpand)}
      html={
        isOpen && (
          <PlanActionFiltres
            plan={plan}
            axe={axe}
            setIsFiltered={setIsFiltered}
          />
        )
      }
      isExpanded={isOpen}
    />
  );
};

export default PlanActionFiltresAccordeon;
