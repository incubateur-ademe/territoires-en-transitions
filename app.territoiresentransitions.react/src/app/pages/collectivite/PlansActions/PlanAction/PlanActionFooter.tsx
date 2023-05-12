import {makeCollectiviteFichesNonClasseesUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {BoutonAttention} from 'ui/buttons/BoutonAttention';
import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {PlanNode} from './data/types';
import {checkAxeHasFiche} from './data/utils';
import {useExportPlanAction} from './export/useExportPlanAction';
import SupprimerAxeModal from './SupprimerAxeModal';

type TPlanActionFooter = {
  plan: PlanNode;
  isReadonly: boolean;
};

const PlanActionFooter = ({plan, isReadonly}: TPlanActionFooter) => {
  const collectivite_id = useCollectiviteId();
  const {exportPlanAction, isLoading} = useExportPlanAction(plan.id);

  return (
    <div className="flex flex-col gap-8 items-start pt-12">
      <div className="flex gap-4">
        {checkAxeHasFiche(plan) && !isReadonly ? (
          <button
            data-test="export-pa"
            className="fr-btn fr-btn--icon-left fr-fi-download-line"
            disabled={isLoading}
            onClick={() => {
              exportPlanAction();
            }}
          >
            Exporter
          </button>
        ) : null}
        {!isReadonly && (
          <SupprimerAxeModal
            axe={plan}
            plan={plan}
            redirectURL={makeCollectiviteFichesNonClasseesUrl({
              collectiviteId: collectivite_id!,
            })}
          >
            <BoutonAttention data-test="SupprimerPlanBouton">
              Supprimer ce plan d’action
            </BoutonAttention>
          </SupprimerAxeModal>
        )}
      </div>
      <ScrollTopButton />
    </div>
  );
};

export default PlanActionFooter;
