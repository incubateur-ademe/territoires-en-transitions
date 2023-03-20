import {makeCollectiviteFichesNonClasseesUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {BoutonAttention} from 'ui/BoutonAttention';
import ScrollTopButton from 'ui/shared/ScrollTopButton';
import {TPlanAction} from './data/types/PlanAction';
import SupprimerAxeModal from './SupprimerAxeModal';

type TPlanActionFooter = {
  plan: TPlanAction;
  isReadonly: boolean;
};

const PlanActionFooter = ({plan, isReadonly}: TPlanActionFooter) => {
  const collectivite_id = useCollectiviteId();

  return (
    <div className="flex flex-col gap-8 items-start pt-12">
      {!isReadonly && (
        <SupprimerAxeModal
          axe={plan.axe}
          plan={plan}
          redirectURL={makeCollectiviteFichesNonClasseesUrl({
            collectiviteId: collectivite_id!,
          })}
        >
          <BoutonAttention className="fr-btn--sm">
            Supprimer ce plan d’action
          </BoutonAttention>
        </SupprimerAxeModal>
      )}
      <ScrollTopButton />
    </div>
  );
};

export default PlanActionFooter;
