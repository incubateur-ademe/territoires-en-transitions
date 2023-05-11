import {makeCollectiviteFichesNonClasseesUrl} from 'app/paths';
import SupprimerAxeModal from './SupprimerAxeModal';
import {PlanNode} from './data/types';
import {checkAxeHasFiche} from './data/utils';
import {useExportPlanAction} from './export/useExportPlanAction';

type TPlanActionHeader = {
  plan: PlanNode;
  collectivite_id: number;
  isReadonly?: boolean;
};

const PlanActionHeader = ({
  collectivite_id,
  plan,
  isReadonly,
}: TPlanActionHeader) => {
  const {exportPlanAction, isLoading} = useExportPlanAction(plan.id);

  return (
    <div className="">
      <div className="py-6 flex justify-between">
        {/** Actions */}
        {!isReadonly && (
          <div className="flex items-center gap-4 ml-auto">
            <SupprimerAxeModal
              isPlan
              axe={plan}
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
            {checkAxeHasFiche(plan) && !isReadonly ? (
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
