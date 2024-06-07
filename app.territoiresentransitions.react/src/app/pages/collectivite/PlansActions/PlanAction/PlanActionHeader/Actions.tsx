import classNames from 'classnames';

import SmallIconContextMenu from 'app/pages/collectivite/PlansActions/PlanAction/PlanActionHeader/SmallIconContextMenu';
import IconUnlockFill from 'ui/shared/designSystem/icons/IconUnlockFill';
import IconLockFill from 'ui/shared/designSystem/icons/IconLockFill';

import SupprimerAxeModal from '../SupprimerAxeModal';
import RestreindreFichesModal from '../RestreindreFichesModal';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {PlanNode} from '../data/types';
import {useExportPlanAction} from '../data/useExportPlanAction';
import ModifierPlanModale from './ModifierPlanModale';
import {TPlanType} from 'types/alias';
import {Tooltip} from '@tet/ui';

const EXPORT_OPTIONS = [
  {value: 'xlsx', label: 'Format Excel (.xlsx)'},
  {value: 'docx', label: 'Format Word (.docx)'},
];

type Props = {
  collectivite_id: number;
  plan: PlanNode;
  type?: TPlanType;
  axe: PlanNode;
  axes: PlanNode[];
  isAxePage: boolean;
  axeHasFiches: boolean;
};

/** Actions liées au plan d'action situées dans le header d'une page plan */
const Actions = ({
  collectivite_id,
  plan,
  type,
  axe,
  axes,
  isAxePage,
  axeHasFiches,
}: Props) => {
  const {mutate: exportPlanAction, isLoading} = useExportPlanAction(axe.id);

  return (
    <div className="flex items-center gap-3 ml-auto">
      <ModifierPlanModale type={type} axe={axe} isAxePage={isAxePage}>
        <button
          data-test="ModifierPlanBouton"
          className="py-1.5 px-4 text-sm text-primary font-bold bg-white rounded-lg"
        >
          Modifier
        </button>
      </ModifierPlanModale>
      {!isAxePage && axeHasFiches ? (
        <SmallIconContextMenu
          dataTest="export-pa"
          title="Exporter"
          disabled={isLoading}
          options={EXPORT_OPTIONS}
          buttonClassname="flex p-2 bg-white hover:bg-primary-1 rounded-lg fr-icon-download-line text-primary before:!w-4 before:!h-4"
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
          className="p-2 bg-white hover:!bg-primary-1 rounded-lg"
          title={isAxePage ? 'Supprimer cet axe' : "Supprimer ce plan d'action"}
        >
          <span className="flex fr-fi-delete-line before:!h-4 before:!w-4 before:text-error-1"></span>
        </button>
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
              className="p-2 bg-white hover:bg-primary-1 rounded-lg"
              disabled={!axeHasFiches}
            >
              <Tooltip
                placement="bottom"
                label="Rendre publiques l'ensemble des fiches du plan"
              >
                <div>
                  <IconUnlockFill
                    className={classNames('h-4 w-4 fill-success-1', {
                      'fill-grey-5': !axeHasFiches,
                    })}
                  />
                </div>
              </Tooltip>
            </button>
          </RestreindreFichesModal>
          <RestreindreFichesModal planId={plan.id} axes={axes} restreindre>
            <button
              data-test="BoutonToutesFichesPrivees"
              className="p-2 bg-white hover:bg-primary-1 rounded-lg"
              disabled={!axeHasFiches}
            >
              <Tooltip
                placement="bottom"
                label="Rendre privées l'ensemble des fiches du plan"
              >
                <div>
                  <IconLockFill
                    className={classNames('h-4 w-4 fill-primary', {
                      'fill-grey-5': !axeHasFiches,
                    })}
                  />
                </div>
              </Tooltip>
            </button>
          </RestreindreFichesModal>
        </>
      )}
    </div>
  );
};

export default Actions;
