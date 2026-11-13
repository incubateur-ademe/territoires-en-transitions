import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlanImportsUrl,
  makeCollectivitePlansActionsListUrl,
} from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useTRPC } from '@tet/api';
import { useQuery } from '@tanstack/react-query';
import {
  ButtonMenu,
  Event,
  Icon,
  MenuAction,
  MenuSeparator,
  useEventTracker,
} from '@tet/ui';
import { useState } from 'react';
import { GenerateReportPlanModal } from '../../reports/generate-plan-report-pptx/generate-report.modal';
import { useIsPendingReport } from '../../reports/generate-plan-report-pptx/use-is-pending-report';
import { DeletePlanOrAxeModal } from './actions/delete-axe-or-plan.modal';
import { DuplicatePlanModal } from './actions/duplicate-plan.modal';
import RestreindreFichesModal from './actions/update-fiche-visibility.modal';
import { useDuplicatePlan } from './data/use-duplicate-plan';
import { useExportPlanAction } from './data/use-export-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { usePlanCreationCapabilities } from '../use-plan-creation-capabilities';

type RestreindreFicheState = 'closed' | 'private' | 'public';

export const PlanMenuButton = () => {
  const tracker = useEventTracker();
  const { plan, axeHasFiches } = usePlanAxesContext();
  const { getDisabledReason } = usePlanCreationCapabilities();
  const duplicateDisabledReason = getDisabledReason(plan.type?.id);
  const { mutate: exportPlanAction, isPending } = useExportPlanAction(plan.id);
  const { mutateAsync: duplicatePlan, isPending: isDuplicating } =
    useDuplicatePlan(plan.id);
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const trpc = useTRPC();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canReadImport = hasCollectivitePermission('plans.fiches.import');
  const { data: imports } = useQuery(
    trpc.plans.aiImport.listRecentAiImports.queryOptions(
      { collectiviteId: plan.collectiviteId, planId: plan.id, limit: 1 },
      { enabled: isMenuOpen && canReadImport, retry: false }
    )
  );
  const importJob = canReadImport
    ? imports?.items.find((item) => item.createdPlanId === plan.id)
    : undefined;

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

  if (!canMutatePlan && !canExportPlan && !canReadImport) {
    return null;
  }

  const menuActions: MenuAction[] = [
    canMutatePlan
      ? {
          label: appLabels.rendreFichesPubliques,
          icon: 'lock-unlock-fill',
          onClick: () => {
            setRestreindreFiche('public');
          },
        }
      : null,
    canMutatePlan
      ? {
          label: appLabels.rendreFichesPrivees,
          icon: 'lock-fill',
          onClick: () => {
            setRestreindreFiche('private');
          },
        }
      : null,
    canMutatePlan ? MenuSeparator : null,
    canExportPlan
      ? {
          label: appLabels.telechargerPlanExcel,
          icon: 'file-excel-line',
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
          icon: 'file-word-line',
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
          icon: 'slideshow-line',
          disabled: isPendingGenerateReport,
          tooltip: isPendingGenerateReport
            ? appLabels.generationEnCours
            : undefined,
          onClick: () => {
            setIsOpenGenerateReportModal(true);
          },
        }
      : null,
    canExportPlan && importJob ? MenuSeparator : null,
    importJob
      ? {
          label: appLabels.importPlanIaDetails,
          onClick: () =>
            tracker(Event.plans.importIa.details, {
              origine: 'menu_plan',
              jobId: importJob.jobId,
              planId: plan.id,
              profile: importJob.profile,
              status: importJob.status,
            }),
          icon: 'file-text-line',
          href: makeCollectivitePlanImportsUrl({
            collectiviteId: plan.collectiviteId,
            importJobId: importJob.jobId,
          }),
        }
      : null,
    canMutatePlan && (canExportPlan || importJob) ? MenuSeparator : null,
    canMutatePlan
      ? {
          label: appLabels.dupliquerPlan,
          icon: 'file-copy-line',
          disabled: !!duplicateDisabledReason,
          tooltip: duplicateDisabledReason,
          onClick: () => {
            setIsOpenDuplicateModal(true);
          },
        }
      : null,
    canMutatePlan
      ? {
          label: appLabels.supprimerPlan,
          icon: 'delete-bin-6-line',
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
          <Icon icon="download-line" />
          {appLabels.exportEnCours}
          <SpinnerLoader />
        </div>
      )}
      <ButtonMenu
        dataTest="plans.plan.menu"
        title={appLabels.editerPlan}
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{
          openState: { isOpen: isMenuOpen, setIsOpen: setIsMenuOpen },
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
          disabledReason={duplicateDisabledReason}
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
