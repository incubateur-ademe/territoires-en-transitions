import { makeCollectivitePlansActionsListUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ButtonMenu, Icon, MenuAction } from '@tet/ui';
import { useState } from 'react';
import { DeletePlanOrAxeModal } from './actions/delete-axe-or-plan.modal';
import RestreindreFichesModal from './actions/update-fiche-visibility.modal';
import { useExportPlanAction } from './data/use-export-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';

type RestreindreFicheState = 'closed' | 'private' | 'public';

export const PlanMenuButton = () => {
  const { plan, axeHasFiches } = usePlanAxesContext();
  const { mutate: exportPlanAction, isPending } = useExportPlanAction(plan.id);

  const [restreindreFiche, setRestreindreFiche] =
    useState<RestreindreFicheState>('closed');
  const [isOpenDeletePlanModal, setIsOpenDeletePlanModal] = useState(false);

  const menuActions: MenuAction[] = [
    {
      label: "Rendre publique l'ensemble des actions",
      icon: 'lock-unlock-fill',
      onClick: () => {
        setRestreindreFiche('public');
      },
    },
    {
      label: "Rendre privé l'ensemble des actions",
      icon: 'lock-unlock-fill',
      onClick: () => {
        setRestreindreFiche('private');
      },
    },
    {
      label: 'Télécharger le plan (Excel)',
      icon: 'download-line',
      disabled: isPending,
      tooltip: isPending ? 'Export en cours' : undefined,
      onClick: () => {
        exportPlanAction('xlsx');
      },
    },
    {
      label: 'Télécharger le plan (Word)',
      icon: 'download-line',
      disabled: isPending,
      tooltip: isPending ? 'Export en cours' : undefined,
      onClick: () => {
        exportPlanAction('docx');
      },
    },
    {
      label: 'Supprimer le plan',
      icon: 'delete-bin-6-line',
      disabled: isPending,
      onClick: () => {
        setIsOpenDeletePlanModal(true);
      },
    },
  ];

  return (
    <>
      {isPending && (
        <div className="inline-flex bg-white gap-2 items-center border rounded-md h-8 px-2 text-xs text-primary-5 font-bold min-w-max">
          <Icon icon="download-line" />
          Export en cours
          <SpinnerLoader />
        </div>
      )}
      <ButtonMenu
        title="Editer ce plan"
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{
          actions: menuActions,
        }}
      />
      {restreindreFiche !== 'closed' && (
        <RestreindreFichesModal
          planId={plan.id}
          axes={plan.axes}
          restreindre={restreindreFiche === 'private'}
          openState={{
            isOpen: true,
            setIsOpen: () => setRestreindreFiche('closed'),
          }}
        />
      )}
      {isOpenDeletePlanModal && (
        <DeletePlanOrAxeModal
          planId={plan.id}
          axeId={plan.id}
          axeHasFiche={axeHasFiches}
          redirectURL={makeCollectivitePlansActionsListUrl({
            collectiviteId: plan.collectiviteId,
          })}
          openState={{
            isOpen: isOpenDeletePlanModal,
            setIsOpen: setIsOpenDeletePlanModal,
          }}
        />
      )}
    </>
  );
};
