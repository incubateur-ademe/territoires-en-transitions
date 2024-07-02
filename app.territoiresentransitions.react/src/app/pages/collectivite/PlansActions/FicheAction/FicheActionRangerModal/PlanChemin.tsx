import {
  generateFilArianeLinks,
  usePlanActionChemin,
} from '../../PlanAction/data/usePlanActionChemin';
import {TAxeRow} from 'types/alias';
import {FicheAction} from '../data/types';
import {useRemoveFicheFromAxe} from '../data/useRemoveFicheFromAxe';
import {generateTitle} from '../data/utils';
import {Breadcrumbs} from '@tet/ui';

type Props = {
  fiche: FicheAction;
  axe_id: number;
};

const PlanChemin = ({fiche, axe_id}: Props) => {
  const {data} = usePlanActionChemin(axe_id);

  const {mutate: removeFiche} = useRemoveFicheFromAxe();

  return (
    <div
      data-test="PlanChemin"
      className="group flex items-center py-1 px-2 rounded-sm hover:bg-bf975"
    >
      <div className="py-0.5 pr-1">
        <Breadcrumbs
          size="xs"
          buttons={generateFilArianeLinks({
            collectiviteId: fiche.collectivite_id!,
            chemin: (data?.chemin ?? []) as TAxeRow[],
            titreFiche: generateTitle(fiche.titre),
            noLinks: true,
          })}
        />
      </div>
      <button
        data-test="EnleverFichePlanBouton"
        onClick={() =>
          removeFiche({
            axe_id,
            fiche_id: fiche.id!,
          })
        }
      >
        <div className="fr-fi-delete-line invisible text-bf500 group-hover:visible scale-75" />
      </button>
    </div>
  );
};

export default PlanChemin;
