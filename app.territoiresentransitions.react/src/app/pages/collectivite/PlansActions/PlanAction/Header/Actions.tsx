import classNames from 'classnames';

import RestreindreFichesModal from '../RestreindreFichesModal';
import SupprimerAxeModal from '../SupprimerAxeModal';

import { makeCollectivitePlansActionsLandingUrl } from '@/app/app/paths';
import { TPlanType } from '@/app/types/alias';
import ContextMenu from '@/app/ui/shared/select/ContextMenu';
import { Button, Icon, Tooltip } from '@/ui';
import { useState } from 'react';
import SpinnerLoader from '../../../../../../ui/shared/SpinnerLoader';
import { PlanNode } from '../data/types';
import { useExportPlanAction } from '../data/useExportPlanAction';
import ModifierPlanModale from './ModifierPlanModale';

const EXPORT_OPTIONS = [
  { value: 'xlsx', label: 'Format Excel (.xlsx)' },
  { value: 'docx', label: 'Format Word (.docx)' },
];

type Props = {
  collectiviteId: number;
  planId: number;
  type: TPlanType | null;
  axe: PlanNode;
  axes: PlanNode[];
  axeHasFiches: boolean;
};

/** Actions liées au plan d'action situées dans le header d'une page plan */
export const Actions = ({
  collectiviteId,
  planId,
  type,
  axe,
  axes,
  axeHasFiches,
}: Props) => {
  const { mutate: exportPlanAction, isLoading } = useExportPlanAction(axe.id);

  const [isModifierPlanModalOpen, setIsModifierPlanModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 ml-auto">
      <button
        data-test="ModifierPlanBouton"
        className="py-1.5 px-4 text-sm text-primary font-bold bg-white rounded-lg"
        onClick={() => setIsModifierPlanModalOpen(true)}
      >
        Modifier
      </button>
      {isModifierPlanModalOpen && (
        <ModifierPlanModale
          type={type}
          axe={axe}
          openState={{
            isOpen: isModifierPlanModalOpen,
            setIsOpen: setIsModifierPlanModalOpen,
          }}
        />
      )}
      {axeHasFiches ? (
        isLoading ? (
          <div className="inline-flex bg-white gap-2 items-center border rounded-md h-8 px-2 text-xs text-primary-5 font-bold">
            <Icon icon="download-line" />
            Export en cours
            <SpinnerLoader />
          </div>
        ) : (
          <ContextMenu
            dataTest="export-pa"
            options={EXPORT_OPTIONS}
            onSelect={(format) => exportPlanAction(format as any)}
          >
            <Button
              disabled={isLoading}
              title="Exporter"
              icon="download-line"
              variant="white"
              size="xs"
            />
          </ContextMenu>
        )
      ) : null}
      <SupprimerAxeModal
        planId={planId}
        axe={axe}
        axeHasFiche={axeHasFiches}
        redirectURL={makeCollectivitePlansActionsLandingUrl({
          collectiviteId,
        })}
      >
        <Button
          dataTest="SupprimerPlanBouton"
          icon="delete-bin-6-line"
          className="!text-error-1"
          title="Supprimer ce plan d'action"
          size="xs"
          variant="white"
        />
      </SupprimerAxeModal>

      <>
        <RestreindreFichesModal planId={planId} axes={axes} restreindre={false}>
          <button
            data-test="BoutonToutesFichesPubliques"
            className="flex bg-white hover:bg-primary-1 rounded-lg"
            disabled={!axeHasFiches}
          >
            <Tooltip
              placement="bottom"
              label="Rendre publiques l'ensemble des fiches du plan"
            >
              <span
                className={classNames(
                  'ri-lock-unlock-fill p-2 leading-none text-success-1',
                  {
                    '!text-grey-5': !axeHasFiches,
                  }
                )}
              />
            </Tooltip>
          </button>
        </RestreindreFichesModal>
        <RestreindreFichesModal planId={planId} axes={axes} restreindre>
          <button
            data-test="BoutonToutesFichesPrivees"
            className="flex bg-white hover:bg-primary-1 rounded-lg"
            disabled={!axeHasFiches}
          >
            <Tooltip
              placement="bottom"
              label="Rendre privées l'ensemble des fiches du plan"
            >
              <span
                className={classNames(
                  'ri-lock-fill p-2 leading-none text-primary',
                  {
                    '!text-grey-5': !axeHasFiches,
                  }
                )}
              />
            </Tooltip>
          </button>
        </RestreindreFichesModal>
      </>
    </div>
  );
};
