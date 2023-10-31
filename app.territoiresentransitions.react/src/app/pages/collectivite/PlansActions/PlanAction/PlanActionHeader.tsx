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
import RestreindreFichesModal from './RestreindreFichesModal';
import IconLockFill from 'ui/shared/designSystem/icons/IconLockFill';
import IconUnlockFill from 'ui/shared/designSystem/icons/IconUnlockFill';
import DSTetTooltip from 'ui/shared/floating-ui/DSTetTooltip';
import classNames from 'classnames';

type TPlanActionHeader = {
  collectivite_id: number;
  plan: PlanNode;
  axe: PlanNode;
  axes: PlanNode[];
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
  axes,
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
            {!isAxePage && axeHasFiches ? (
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
            {!isAxePage && (
              <>
                <RestreindreFichesModal
                  planId={plan.id}
                  axes={axes}
                  restreindre={false}
                >
                  <button
                    data-test="BoutonToutesFichesPubliques"
                    disabled={!axeHasFiches}
                  >
                    <DSTetTooltip
                      placement="bottom"
                      label={() => (
                        <span>
                          Rendre publiques l'ensemble des fiches du plan
                        </span>
                      )}
                    >
                      <div className="fr-btn fr-btn--tertiary fr-btn--sm !p-2">
                        <IconUnlockFill
                          className={classNames('h-4 w-4 fill-success-1', {
                            'fill-grey-5': !axeHasFiches,
                          })}
                        />
                      </div>
                    </DSTetTooltip>
                  </button>
                </RestreindreFichesModal>
                <RestreindreFichesModal
                  planId={plan.id}
                  axes={axes}
                  restreindre
                >
                  <button
                    data-test="BoutonToutesFichesPrivees"
                    disabled={!axeHasFiches}
                  >
                    <DSTetTooltip
                      placement="bottom"
                      label={() => (
                        <span>
                          Rendre privées l'ensemble des fiches du plan
                        </span>
                      )}
                    >
                      <div className="fr-btn fr-btn--tertiary fr-btn--sm !p-2">
                        <IconLockFill
                          className={classNames('h-4 w-4 fill-principale', {
                            'fill-grey-5': !axeHasFiches,
                          })}
                        />
                      </div>
                    </DSTetTooltip>
                  </button>
                </RestreindreFichesModal>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanActionHeader;
