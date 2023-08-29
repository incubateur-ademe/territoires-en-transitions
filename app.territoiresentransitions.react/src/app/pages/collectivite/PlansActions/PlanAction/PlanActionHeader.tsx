import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import SupprimerAxeModal from './SupprimerAxeModal';
import {PlanNode} from './data/types';
import {checkAxeHasFiche} from './data/utils';
import {useExportPlanAction} from './export/useExportPlanAction';
import {generateTitle} from '../FicheAction/data/utils';
import FilAriane from 'ui/shared/FilAriane';

type TPlanActionHeader = {
  isAxePage: boolean;
  plan: PlanNode;
  axe?: PlanNode;
  collectivite_id: number;
  isReadonly?: boolean;
};

const PlanActionHeader = ({
  collectivite_id,
  isAxePage,
  plan,
  axe,
  isReadonly,
}: TPlanActionHeader) => {
  const {exportPlanAction, isLoading} = useExportPlanAction(plan.id);

  return (
    <div className="">
      <div className="py-6 flex items-center justify-between">
        {/** Lien plan d'action page axe */}
        {isAxePage && axe && (
          <FilAriane
            links={[
              {
                path: makeCollectivitePlanActionUrl({
                  collectiviteId: collectivite_id,
                  planActionUid: plan.id.toString(),
                }),
                displayedName: generateTitle(plan.nom),
              },
              {displayedName: generateTitle(axe.nom)},
            ]}
          />
        )}
        {/** Actions */}
        {!isReadonly && (
          <div className="flex items-center gap-4 ml-auto">
            <SupprimerAxeModal
              isPlan={!isAxePage}
              axe={axe ? axe : plan}
              plan={plan}
              redirectURL={
                isAxePage
                  ? makeCollectivitePlanActionUrl({
                      collectiviteId: collectivite_id,
                      planActionUid: plan.id.toString(),
                    })
                  : makeCollectivitePlansActionsSyntheseUrl({
                      collectiviteId: collectivite_id!,
                    })
              }
            >
              <button
                data-test="SupprimerPlanBouton"
                className="fr-btn fr-btn--tertiary fr-btn--sm fr-fi-delete-line"
                title={
                  isAxePage ? 'Supprimer cet axe' : "Supprimer ce plan d'action"
                }
              />
            </SupprimerAxeModal>
            {!isAxePage && checkAxeHasFiche(plan) && !isReadonly ? (
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
