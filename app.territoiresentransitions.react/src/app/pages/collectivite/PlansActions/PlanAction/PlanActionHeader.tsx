import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import SmallIconContextMenu from 'ui/shared/select/SmallIconContextMenu';
import SupprimerAxeModal from './SupprimerAxeModal';
import {PlanNode} from './data/types';
import {checkAxeHasFiche} from './data/utils';
import {useExportPlanAction} from './data/useExportPlanAction';
import {Link} from 'react-router-dom';
import {generateTitle} from '../FicheAction/data/utils';

type TPlanActionHeader = {
  isAxePage: boolean;
  plan: PlanNode;
  axe?: PlanNode;
  collectivite_id: number;
  isReadonly?: boolean;
};

const EXPORT_OPTIONS = [
  {value: 'xlsx', label: 'Format Excel (.xlsx)'},
  {value: 'docx', label: 'Format Word (.docx)'},
];

const PlanActionHeader = ({
  collectivite_id,
  isAxePage,
  plan,
  axe,
  isReadonly,
}: TPlanActionHeader) => {
  const {mutate: exportPlanAction, isLoading} = useExportPlanAction(plan.id);

  return (
    <div className="">
      <div className="py-6 flex items-center justify-between">
        {/** Lien plan d'action page axe */}
        {isAxePage && (
          <Link
            className="p-1 shrink-0 text-xs text-gray-500 underline !bg-none !shadow-none hover:text-gray-600"
            to={makeCollectivitePlanActionUrl({
              collectiviteId: collectivite_id,
              planActionUid: plan.id.toString(),
            })}
          >
            {generateTitle(plan.nom)}
          </Link>
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
                title="Supprimer ce plan d'action"
              />
            </SupprimerAxeModal>
            {!isAxePage && checkAxeHasFiche(plan) && !isReadonly ? (
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
