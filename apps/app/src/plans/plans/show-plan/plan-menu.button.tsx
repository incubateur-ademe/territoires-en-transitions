import { makeCollectivitePlansActionsListUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Icon, MenuAction, MenuSeparator } from '@tet/ui';
import { useState } from 'react';
import { GenerateReportPlanModal } from '../../reports/generate-plan-report-pptx/generate-report.modal';
import { useIsPendingReport } from '../../reports/generate-plan-report-pptx/use-is-pending-report';
import { DeletePlanOrAxeModal } from './actions/delete-axe-or-plan.modal';
import RestreindreFichesModal from './actions/update-fiche-visibility.modal';
import { useExportPlanAction } from './data/use-export-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';

type RestreindreFicheState = 'closed' | 'private' | 'public';

export const PlanMenuButton = () => {
  const { plan, axeHasFiches } = usePlanAxesContext();
  const { mutate: exportPlanAction, isPending } = useExportPlanAction(plan.id);
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const [restreindreFiche, setRestreindreFiche] =
    useState<RestreindreFicheState>('closed');
  const [isOpenDeletePlanModal, setIsOpenDeletePlanModal] = useState(false);

  const [isOpenGenerateReportModal, setIsOpenGenerateReportModal] =
    useState(false);
  const {
    isPending: isPendingGenerateReport,
    renderToast,
    isGeneratePptxPlanReportEnabled,
  } = useIsPendingReport();

  const canMutatePlan = hasCollectivitePermission('plans.mutate');
  const canExportPlan = hasCollectivitePermission('plans.export');

  if (!canMutatePlan && !canExportPlan) {
    return null;
  }

  const menuActions: MenuAction[] = [
    canMutatePlan
      ? {
          label: "Rendre publique l'ensemble des actions",
          icon: 'lock-unlock-fill',
          onClick: () => {
            setRestreindreFiche('public');
          },
        }
      : null,
    canMutatePlan
      ? {
          label: "Rendre privé l'ensemble des actions",
          icon: 'lock-fill',
          onClick: () => {
            setRestreindreFiche('private');
          },
        }
      : null,
    canMutatePlan ? MenuSeparator : null,
    canExportPlan
      ? {
          label: 'Télécharger le plan (Excel)',
          icon: 'file-excel-line',
          disabled: isPending,
          tooltip: isPending ? 'Export en cours' : undefined,
          onClick: () => {
            exportPlanAction('xlsx');
          },
        }
      : null,
    canExportPlan
      ? {
          label: 'Télécharger le plan (Word)',
          icon: 'file-word-line',
          disabled: isPending,
          tooltip: isPending ? 'Export en cours' : undefined,
          onClick: () => {
            exportPlanAction('docx');
          },
        }
      : null,
    canExportPlan && isGeneratePptxPlanReportEnabled
      ? {
          label: 'Générer un rapport',
          icon: 'slideshow-line',
          disabled: isPendingGenerateReport,
          tooltip: isPendingGenerateReport ? 'Génération en cours' : undefined,
          onClick: () => {
            setIsOpenGenerateReportModal(true);
          },
        }
      : null,
    canMutatePlan ? MenuSeparator : null,
    canMutatePlan
      ? {
          label: 'Supprimer le plan',
          icon: 'delete-bin-6-line',
          disabled: isPending,
          onClick: () => {
            setIsOpenDeletePlanModal(true);
          },
        }
      : null,
  ].filter(Boolean) as MenuAction[];

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
      {isGeneratePptxPlanReportEnabled && isOpenGenerateReportModal && (
        <GenerateReportPlanModal
          plan={plan}
          openState={{
            isOpen: isOpenGenerateReportModal,
            setIsOpen: setIsOpenGenerateReportModal,
          }}
        />
      )}
      {renderToast()}
    </>
  );
};
