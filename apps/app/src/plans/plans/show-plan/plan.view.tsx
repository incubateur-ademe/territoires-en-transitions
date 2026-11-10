'use client';

import { DemarcheBanner } from '@/app/demarches/components/banner';
import { useDemarcheLinkedToPlan } from '@/app/demarches/pcaet/use-demarche-linked-to-plan';
import { useListPlanSecteursCounts } from '@/app/plans/plans/secteurs-counts/data/use-list-plan-secteurs-counts';
import { appLabels } from '@/app/labels/catalog';
import { useCreateFicheResume } from '@/app/plans/fiches/data/use-create-fiche-resume';
import { EmptyPlanView } from '@/app/plans/plans/show-plan/empty-plan.view';
import { getElectrificationCibleDisplay } from '@/app/plans/plans/electrification/show-plan/electrification-cible.view';
import {
  PlanAxesProvider,
  usePlanAxesContext,
} from '@/app/plans/plans/show-plan/plan-arborescence.view/plan-axes.context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { useUser } from '@tet/api/users';
import {
  countPlanSecteursARenseigner,
  isPlanNavigable,
  isPlanPendingVerification,
  Plan,
  PlanStatusEnum,
} from '@tet/domain/plans';
import { Alert, Button, Spacer, VisibleWhen } from '@tet/ui';
import { ContentPanelWithHeader } from './content-panel-with-header';
import { useCreateAxe } from './data/use-create-axe';
import { useGetPlan } from './data/use-get-plan';
import { ResumeAiImportButton } from '@/app/plans/plans/import-plan/resume-ai-import.button';
import {
  ImportedPlanBanner,
  SecteursManquantsBanner,
} from './imported-plan.banner';
import { FilteredResults } from './filters/filtered-results';
import { FiltersMenuButton } from './filters/filters.button-menu';
import {
  addAxeButtonProps,
  createFicheResumeButtonProps,
} from './plan-actions.button-props';
import { PlanOptionsButton } from './plan-arborescence.view/plan-options.button';
import { PlanTree } from './plan-arborescence.view/plan-tree';
import { PlanHeader } from './plan.header';

type Props = {
  plan: Plan;
};

export const PlanView = ({ plan: initialPlanData }: Props) => {
  const plan = useGetPlan(initialPlanData.id, {
    initialData: initialPlanData,
  });
  const rootAxe = plan?.axes.find((axe) => axe.parent === null);

  if (!plan || !rootAxe) {
    return <div>{appLabels.planNonTrouve}</div>;
  }

  if (!isPlanNavigable(plan)) {
    const isFailed = plan.status === PlanStatusEnum.FAILED;
    return (
      <div role="status">
        <Alert
          className="m-6"
          state={isFailed ? 'error' : 'info'}
          title={
            isFailed
              ? appLabels.importPlanIaEchecCourt
              : appLabels.importPlanIaEnCoursCourt
          }
          description={
            isFailed
              ? appLabels.importPlanIaEchecDescription
              : appLabels.importPlanIaEnCoursDescription
          }
        />
        {isFailed ? (
          <div className="mx-6">
            <ResumeAiImportButton planId={plan.id} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <PlanAxesProvider
      plan={plan}
      rootAxe={rootAxe}
      getIndicateurCardOptions={(indicateur) =>
        getElectrificationCibleDisplay({
          source: plan.indicateurSource,
          collectiviteId: plan.collectiviteId,
          indicateurId: indicateur.id,
          unite: indicateur.unite,
        })
      }
    >
      <PlanViewContent />
    </PlanAxesProvider>
  );
};

const PlanViewContent = () => {
  const {
    collectivite,
    isReadOnly,
    areAllClosed,
    toggleAll,
    isActionsVisible,
    plan,
    rootAxe,
    axeHasFiches,
    hasAxesToExpand,
    isPlanEmpty,
    isFiltered,
  } = usePlanAxesContext();

  const { mutate: addAxe } = useCreateAxe({
    collectiviteId: collectivite.collectiviteId,
    parentAxe: { id: plan.id, depth: 0 },
    planId: plan.id,
  });

  const { mutate: createFiche } = useCreateFicheResume({
    collectiviteId: collectivite.collectiviteId,
    axeId: plan.id,
    planId: plan.id,
  });

  const user = useUser();

  const canMutatePlans = collectivite.hasCollectivitePermission('plans.mutate');
  const linkedDemarche = useDemarcheLinkedToPlan({
    planId: plan.id,
    canMutatePlans,
  });
  const isImportedPlanBannerVisible =
    canMutatePlans && isPlanPendingVerification(plan);

  const { isEnabled: isSecteursEnabled, countsByPlanId } =
    useListPlanSecteursCounts(collectivite.collectiviteId, [plan.id]);
  const secteursCounts = countsByPlanId.get(plan.id);
  const secteursARenseigner = secteursCounts
    ? countPlanSecteursARenseigner(secteursCounts)
    : 0;
  // Hors import, seul un plan transmis avec la démarche doit avoir tous ses
  // secteurs : c'est une condition du dépôt pour avis.
  const isSecteursManquantsBannerVisible =
    canMutatePlans &&
    !isImportedPlanBannerVisible &&
    linkedDemarche !== undefined &&
    secteursARenseigner > 0;

  return (
    <div className="w-full">
      <VisibleWhen condition={linkedDemarche !== undefined}>
        <div className="mb-6">
          <DemarcheBanner collectiviteId={collectivite.collectiviteId} />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={isImportedPlanBannerVisible}>
        <div className="mb-6">
          <ImportedPlanBanner
            planId={plan.id}
            isSecteursConcerne={
              isSecteursEnabled && secteursCounts !== undefined
            }
            secteursARenseigner={secteursARenseigner}
            demarcheUrl={linkedDemarche?.planActionsUrl}
          />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={isSecteursManquantsBannerVisible}>
        <div className="mb-6">
          <SecteursManquantsBanner secteursARenseigner={secteursARenseigner} />
        </div>
      </VisibleWhen>
      <PlanHeader />
      <VisibleWhen condition={isPlanEmpty}>
        <div className="h-[50vh]">
          <EmptyPlanView currentCollectivite={collectivite} plan={rootAxe} />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={!isPlanEmpty}>
        <ContentPanelWithHeader
          headerActionButtonsLeft={
            <>
              <PlanOptionsButton />
              <VisibleWhen condition={hasAxesToExpand && !isFiltered}>
                <Button
                  size="sm"
                  variant="outlined"
                  icon={areAllClosed ? 'arrow-down-line' : 'arrow-up-line'}
                  iconPosition="right"
                  onClick={toggleAll}
                  dataTest="ToggleAllAxes"
                >
                  {areAllClosed
                    ? appLabels.deplierTousLesAxes
                    : appLabels.replierTousLesAxes}
                </Button>
              </VisibleWhen>
            </>
          }
          headerActionButtonsRight={
            <div className="flex gap-6">
              <VisibleWhen
                condition={
                  !isReadOnly &&
                  isActionsVisible &&
                  collectivite.hasCollectivitePermission('plans.mutate')
                }
              >
                <div className="flex items-center gap-6">
                  {!isFiltered && (
                    <Button {...addAxeButtonProps} onClick={() => addAxe()} />
                  )}

                  <Button
                    {...createFicheResumeButtonProps}
                    onClick={() => createFiche()}
                  />
                </div>
              </VisibleWhen>
              <VisibleWhen condition={axeHasFiches}>
                <FiltersMenuButton />
              </VisibleWhen>
            </div>
          }
        >
          <VisibleWhen condition={!isFiltered}>
            <PlanTree
              plan={rootAxe}
              axes={plan.axes}
              collectivite={collectivite}
            />
          </VisibleWhen>
          <VisibleWhen condition={isFiltered}>
            <FilteredResults
              planId={plan.id}
              collectivite={collectivite}
              currentUserId={user.id}
            />
          </VisibleWhen>
        </ContentPanelWithHeader>
        <Spacer height={2} />
        <ScrollTopButton />
      </VisibleWhen>
    </div>
  );
};
