import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import SmallIconContextMenu from 'ui/shared/select/SmallIconContextMenu';
import SupprimerAxeModal from './SupprimerAxeModal';
import {PlanNode} from './data/types';
import {useExportPlanAction} from './data/useExportPlanAction';
import {generateTitle} from '../FicheAction/data/utils';
import FilAriane from 'ui/shared/FilAriane';

type TPlanActionHeader = {
  collectivite_id: number;
  plan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  axeHasFiches: boolean;
  isReadonly?: boolean;
};

const EXPORT_OPTIONS = [
  {value: 'xlsx', label: 'Format Excel (.xlsx)'},
  {value: 'docx', label: 'Format Word (.docx)'},
];

const PlanActionHeader = ({
  collectivite_id,
  plan,
  axe,
  isAxePage,
  axeHasFiches,
  isReadonly,
}: TPlanActionHeader) => {
  const {mutate: exportPlanAction, isLoading} = useExportPlanAction(axe.id);

  return (
    <div className="">
      <div className="py-6 flex items-center justify-between">
        {/** Lien plan d'action page axe */}
        {isAxePage && (
          <FilAriane
            links={[
              {
                path: makeCollectivitePlanActionUrl({
                  collectiviteId: collectivite_id,
                  planActionUid: axe.id.toString(),
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
              planId={plan.id}
              axe={axe}
              axeHasFiche={axeHasFiches}
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
            {!isAxePage && axeHasFiches && !isReadonly ? (
              <SmallIconContextMenu
                dataTest="export-pa"
                title="Exporter"
                disabled={isLoading}
                options={EXPORT_OPTIONS}
                buttonClassname="fr-icon-download-line fr-btn--sm"
                hideDefaultIcon
                onSelect={format => exportPlanAction(format as any)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanActionHeader;
