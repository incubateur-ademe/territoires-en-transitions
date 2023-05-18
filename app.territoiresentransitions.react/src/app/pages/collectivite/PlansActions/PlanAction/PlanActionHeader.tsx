import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import SupprimerAxeModal from './SupprimerAxeModal';
import {PlanNode} from './data/types';
import {checkAxeHasFiche} from './data/utils';
import {useExportPlanAction} from './export/useExportPlanAction';
import {Link} from 'react-router-dom';

type TPlanActionHeader = {
  plan: PlanNode;
  axe?: PlanNode;
  collectivite_id: number;
  isReadonly?: boolean;
};

const PlanActionHeader = ({
  collectivite_id,
  plan,
  axe,
  isReadonly,
}: TPlanActionHeader) => {
  const {exportPlanAction, isLoading} = useExportPlanAction(plan.id);

  return (
    <div className="">
      <div className="py-6 flex items-center justify-between">
        {/** Lien plan d'action page axe */}
        {axe && (
          <Link
            className="p-1 shrink-0 text-xs text-gray-500 underline !bg-none !shadow-none hover:text-gray-600"
            to={makeCollectivitePlanActionUrl({
              collectiviteId: collectivite_id,
              planActionUid: plan.id.toString(),
            })}
          >
            {plan.nom ?? 'Sans titre'}
          </Link>
        )}
        {/** Actions */}
        {!isReadonly && (
          <div className="flex items-center gap-4 ml-auto">
            <SupprimerAxeModal
              isPlan
              axe={axe ? axe : plan}
              plan={plan}
              redirectURL={makeCollectiviteFichesNonClasseesUrl({
                collectiviteId: collectivite_id!,
              })}
            >
              <button
                data-test="SupprimerPlanBouton"
                className="fr-btn fr-btn--tertiary fr-btn--sm fr-fi-delete-line"
                title="Supprimer ce plan d'action"
              />
            </SupprimerAxeModal>
            {!axe && checkAxeHasFiche(plan) && !isReadonly ? (
              <button
                data-test="export-pa"
                className="fr-btn fr-btn--tertiary fr-btn--sm fr-fi-download-line"
                title="Exporter"
                disabled={isLoading}
                onClick={() => {
                  exportPlanAction();
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanActionHeader;
