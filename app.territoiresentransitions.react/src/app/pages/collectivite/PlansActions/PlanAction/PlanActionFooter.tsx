import {makeCollectiviteFichesNonClasseesUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import ScrollTopButton from 'ui/shared/ScrollTopButton';
import {TPlanAction} from './data/types/PlanAction';
import SupprimerAxeModal from './SupprimerAxeModal';

type TPlanActionFooter = {
  plan: TPlanAction;
};

const PlanActionFooter = ({plan}: TPlanActionFooter) => {
  const collectivite_id = useCollectiviteId();

  return (
    <div className="flex flex-col gap-8 items-start pt-12">
      <SupprimerAxeModal
        axe={plan.axe}
        plan={plan}
        redirectURL={makeCollectiviteFichesNonClasseesUrl({
          collectiviteId: collectivite_id!,
        })}
      >
        <div className="inline-flex border border-red-700">
          <button className="fr-btn fr-btn--secondary fr-btn--sm fr-text-default--error !shadow-none">
            Supprimer ce plan d’action
          </button>
        </div>
      </SupprimerAxeModal>
      <ScrollTopButton />
    </div>
  );
};

export default PlanActionFooter;
