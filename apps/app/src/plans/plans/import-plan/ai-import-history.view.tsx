'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlanImportsUrl,
  makeCollectivitePlansActionsImporterIaUrl,
  makeCollectivitePlansActionsListUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Badge,
  Breadcrumbs,
  Button,
  Event,
  PageHeader,
  Tooltip,
  useEventTracker,
} from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { AiImportStatusView } from './ai-import-status.view';
import { importStatusLabels } from './ai-import.labels';
import { aiImportQueryState } from './ai-import.query-state';
import {
  isInaccessibleAiImportError,
  useGetAiImportStatus,
} from './data/use-get-ai-import-status';
import { useGetOngoingAiImport } from './data/use-get-ongoing-ai-import';

export const AiImportHistoryView = () => {
  const tracker = useEventTracker();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const trpc = useTRPC();
  const router = useRouter();
  const [{ importJobId }, setImportQuery] = useQueryStates(aiImportQueryState, {
    history: 'push',
  });
  const canAccessImportForm = hasCollectivitePermission('plans.fiches.import');
  const { isOngoing: isOngoingImport } = useGetOngoingAiImport(collectiviteId);
  const statusQuery = useGetAiImportStatus(importJobId);
  const planId = statusQuery.data?.createdPlanId;
  const openPlanDisabledReason = statusQuery.error
    ? isInaccessibleAiImportError(statusQuery.error)
      ? appLabels.importPlanIaSuiviIndisponible
      : appLabels.importPlanIaSuiviErreur
    : statusQuery.isPending
    ? appLabels.chargementEnCours
    : planId == null
    ? appLabels.importPlanIaPlanIndisponible
    : undefined;
  const newImportDisabledReason = isOngoingImport
    ? appLabels.erreursApi.IN_FLIGHT_JOB_EXISTS
    : undefined;
  const imports = useInfiniteQuery(
    trpc.plans.aiImport.listRecentAiImports.infiniteQueryOptions(
      { collectiviteId, limit: 20 },
      {
        getNextPageParam: (page) => page.nextCursor ?? undefined,
        retry: false,
        enabled: importJobId === null,
      }
    )
  );
  const newImportUrl = makeCollectivitePlansActionsImporterIaUrl({
    collectiviteId,
  });
  const items = imports.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader>
        <PageHeader.Navigation label={appLabels.importPlanIaNavigation}>
          <Breadcrumbs
            size="sm"
            items={[
              {
                label: appLabels.plans,
                href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
              },
              {
                label: appLabels.importPlanIaHistorique,
                href: makeCollectivitePlanImportsUrl({ collectiviteId }),
              },
              ...(importJobId !== null
                ? [{ label: appLabels.importPlanIaDetails }]
                : []),
            ]}
          />
        </PageHeader.Navigation>
        <PageHeader.Title>
          {importJobId !== null
            ? appLabels.importPlanIaDetails
            : appLabels.importPlanIaHistorique}
        </PageHeader.Title>
        {(importJobId !== null || canAccessImportForm) && (
          <PageHeader.Actions>
            <div className="flex flex-wrap items-center gap-2">
              {importJobId !== null && !openPlanDisabledReason && (
                <Button
                  size="sm"
                  variant="outlined"
                  href={
                    planId != null
                      ? makeCollectivitePlanActionUrl({
                          collectiviteId,
                          planActionUid: String(planId),
                        })
                      : undefined
                  }
                  onClick={() =>
                    tracker(Event.plans.importIa.ouvrirPlan, {
                      origine: 'detail_import',
                      jobId: importJobId,
                      planId,
                      profile: statusQuery.data?.profile,
                      status: statusQuery.data?.status,
                    })
                  }
                  dataTest="plans.import-ia.ouvrir-plan"
                >
                  {appLabels.importPlanIaOuvrirPlan}
                </Button>
              )}
              {canAccessImportForm && (
                <Tooltip label={newImportDisabledReason}>
                  <span
                    className="inline-flex"
                    tabIndex={newImportDisabledReason ? 0 : undefined}
                  >
                    <Button
                      size="sm"
                      icon="add-line"
                      href={!newImportDisabledReason ? newImportUrl : undefined}
                      disabled={!!newImportDisabledReason}
                      className="disabled:pointer-events-none"
                      dataTest="plans.import-ia.nouveau-button"
                    >
                      {appLabels.importPlanIaNouveau}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </div>
          </PageHeader.Actions>
        )}
      </PageHeader>
      <div className="bg-white rounded-lg p-6 md:p-10 flex flex-col gap-6">
        {importJobId !== null ? (
          <AiImportStatusView
            key={importJobId}
            jobId={importJobId}
            statusQuery={statusQuery}
            onRetry={() =>
              router.push(
                makeCollectivitePlansActionsImporterIaUrl({
                  collectiviteId,
                  retryJobId: importJobId,
                })
              )
            }
          />
        ) : (
          <>
            {imports.isPending && <SpinnerLoader className="mx-auto w-8 h-8" />}
            {imports.isError && (
              <ErrorCard
                title={appLabels.importPlanIaHistoriqueErreur}
                retry={() =>
                  imports.isFetchNextPageError
                    ? imports.fetchNextPage()
                    : imports.refetch()
                }
              />
            )}
            {imports.isSuccess && items.length === 0 && (
              <p className="mb-0">{appLabels.importPlanIaHistoriqueVide}</p>
            )}
            <ul
              className="m-0 p-0 list-none divide-y divide-grey-3"
              data-test="plans.import-ia.historique"
            >
              {items.map((item) => (
                <li
                  key={item.jobId}
                  className="py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="underlined"
                      onClick={() => {
                        tracker(Event.plans.importIa.details, {
                          origine: 'historique',
                          jobId: item.jobId,
                          planId: item.createdPlanId,
                          profile: item.profile,
                          status: item.status,
                        });
                        void setImportQuery({ importJobId: item.jobId });
                      }}
                    >
                      {item.planName ?? appLabels.importPlanIaSansNom}
                    </Button>
                    <time
                      dateTime={item.createdAt}
                      className="text-sm text-grey-7"
                    >
                      {new Date(item.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  <Badge
                    title={importStatusLabels[item.status]}
                    variant={
                      item.status === 'failed'
                        ? 'error'
                        : item.status === 'done'
                        ? 'success'
                        : 'info'
                    }
                  />
                </li>
              ))}
            </ul>
            {imports.hasNextPage && (
              <Button
                variant="outlined"
                loading={imports.isFetchingNextPage}
                disabled={imports.isFetchingNextPage}
                onClick={() => imports.fetchNextPage()}
              >
                {appLabels.importPlanIaVoirPlus}
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
};
