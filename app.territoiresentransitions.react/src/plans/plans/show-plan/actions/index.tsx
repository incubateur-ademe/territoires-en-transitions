import classNames from 'classnames';

import { DeletePlanOrAxeModal } from './delete-axe-or-plan.modal';
import RestreindreFichesModal from './update-fiche-visibility.modal';

import { makeCollectivitePlansActionsLandingUrl } from '@/app/app/paths';
import ContextMenu from '@/app/ui/shared/select/ContextMenu';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Plan } from '@/domain/plans/plans';
import { Button, Icon, Tooltip } from '@/ui';
import { useState } from 'react';
import { useExportPlanAction } from '../data/use-export-plan';
import { UpdatePlanModal } from './update-plan.modal';

const EXPORT_OPTIONS = [
  { value: 'xlsx', label: 'Format Excel (.xlsx)' },
  { value: 'docx', label: 'Format Word (.docx)' },
];

type Props = {
  plan: Plan;
  axeHasFiches: boolean;
};

export const Actions = ({ axeHasFiches, plan }: Props) => {
  const { mutate: exportPlanAction, isPending } = useExportPlanAction(plan.id);

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
        <UpdatePlanModal
          plan={plan.axes[0]}
          type={plan.type}
          referents={plan.referents}
          pilotes={plan.pilotes}
          defaultValues={{
            nom: plan.nom ?? 'Sans titre',
            typeId: plan.type?.id ?? null,
            referents: plan.referents ?? undefined,
            pilotes: plan.pilotes ?? undefined,
          }}
          openState={{
            isOpen: isModifierPlanModalOpen,
            setIsOpen: setIsModifierPlanModalOpen,
          }}
        />
      )}
      {axeHasFiches ? (
        isPending ? (
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
              disabled={isPending}
              title="Exporter"
              icon="download-line"
              variant="white"
              size="xs"
            />
          </ContextMenu>
        )
      ) : null}
      <DeletePlanOrAxeModal
        planId={plan.id}
        axeId={plan.id}
        axeHasFiche={axeHasFiches}
        redirectURL={makeCollectivitePlansActionsLandingUrl({
          collectiviteId: plan.collectiviteId,
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
      </DeletePlanOrAxeModal>

      <>
        <RestreindreFichesModal
          planId={plan.id}
          axes={plan.axes}
          restreindre={false}
        >
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
        <RestreindreFichesModal planId={plan.id} axes={plan.axes} restreindre>
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
