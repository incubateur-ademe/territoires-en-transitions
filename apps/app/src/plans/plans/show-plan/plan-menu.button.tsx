import { appLabels } from '@/app/labels/catalog';
import { makeCollectivitePlansActionsListUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Icon, MenuAction, MenuSeparator } from '@tet/ui';
import { useState } from 'react';
import { GenerateReportPlanModal } from '../../reports/generate-plan-report-pptx/generate-report.modal';
import { useIsPendingReport } from '../../reports/generate-plan-report-pptx/use-is-pending-report';
import { DeletePlanOrAxeModal } from './actions/delete-axe-or-plan.modal';
import { DuplicatePlanModal } from './actions/duplicate-plan.modal';
import RestreindreFichesModal from './actions/update-fiche-visibility.modal';
import { useDuplicatePlan } from './data/use-duplicate-plan';
import { useExportPlanAction } from './data/use-export-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { RiDeleteBin6Line, RiDownloadLine, RiFileCopyLine, RiFileExcelLine, RiFileWordLine, RiLockFill, RiLockUnlockFill, RiMoreLine, RiSlideshowLine } from '@remixicon/react';

type RestreindreFicheState = 'closed' | 'private' | 'public';

export const PlanMenuButton = () => {
  const { plan, axeHasFiches } = usePlanAxesContext();
  const { mutate: exportPlanAction, isPending } = useExportPlanAction(plan.id);
  const { mutateAsync: duplicatePlan, isPending: isDuplicating } =
    useDuplicatePlan(plan.id);
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const [restreindreFiche, setRestreindreFiche] =
    useState<RestreindreFicheState>('closed');
  const [isOpenDeletePlanModal, setIsOpenDeletePlanModal] = useState(false);
  const [isOpenDuplicateModal, setIsOpenDuplicateModal] = useState(false);

  const [isOpenGenerateReportModal, setIsOpenGenerateReportModal] =
    useState(false);
  const { isPending: isPendingGenerateReport, renderToast } =
    useIsPendingReport();

  const canMutatePlan = hasCollectivitePermission('plans.mutate');
  const canExportPlan = hasCollectivitePermission('plans.export');

  if (!canMutatePlan && !canExportPlan) {
    return null;
  }

  const menuActions: MenuAction[] = [
    canMutatePlan
      ? {
          label: appLabels.rendreFichesPubliques,
          icon: <RiLockUnlockFill />,
          onClick: () => {
            setRestreindreFiche('public');
          },
        }
      : null,
    canMutatePlan
      ? {
          label: appLabels.rendreFichesPrivees,
          icon: <RiLockFill />,
          onClick: () => {
            setRestreindreFiche('private');
          },
        }
      : null,
    canMutatePlan ? MenuSeparator : null,
    canExportPlan
      ? {
          label: appLabels.telechargerPlanExcel,
          icon: <RiFileExcelLine />,
          disabled: isPending,
          tooltip: isPending ? appLabels.exportEnCours : undefined,
          onClick: () => {
            exportPlanAction('xlsx');
          },
        }
      : null,
    canExportPlan
      ? {
          label: appLabels.telechargerPlanWord,
          icon: <RiFileWordLine />,
          disabled: isPending,
          tooltip: isPending ? appLabels.exportEnCours : undefined,
          onClick: () => {
            exportPlanAction('docx');
          },
        }
      : null,
    canExportPlan
      ? {
          label: appLabels.genererRapportPowerpoint,
          icon: <RiSlideshowLine />,
          disabled: isPendingGenerateReport,
          tooltip: isPendingGenerateReport
            ? appLabels.generationEnCours
            : undefined,
          onClick: () => {
            setIsOpenGenerateReportModal(true);
          },
        }
      : null,
    canMutatePlan ? MenuSeparator : null,
    canMutatePlan
      ? {
          label: appLabels.dupliquerPlan,
          icon: <RiFileCopyLine />,
          onClick: () => {
            setIsOpenDuplicateModal(true);
          },
        }
      : null,
    canMutatePlan
      ? {
          label: appLabels.supprimerPlan,
          icon: <RiDeleteBin6Line />,
          variant: 'destructive',
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
          <Icon icon={<RiDownloadLine />} />
          {appLabels.exportEnCours}
          <SpinnerLoader />
        </div>
      )}
      <ButtonMenu
        title={appLabels.editerPlan}
        icon={<RiMoreLine />}
        variant="grey"
        size="xs"
        menu={{
          className: 'max-w-96',
          actions: menuActions,
        }}
      />
      {restreindreFiche !== 'closed' && (
        <RestreindreFichesModal
          planId={plan.id}
          isPrivate={restreindreFiche === 'private'}
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
      {isOpenDuplicateModal && (
        <DuplicatePlanModal
          planNom={plan.nom}
          isPending={isDuplicating}
          onDuplicate={async (nom) => {
            await duplicatePlan({ nom });
          }}
          openState={{
            isOpen: isOpenDuplicateModal,
            setIsOpen: setIsOpenDuplicateModal,
          }}
        />
      )}
      {isOpenGenerateReportModal && (
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
