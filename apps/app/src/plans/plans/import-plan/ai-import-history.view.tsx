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
import { useCollectiviteId } from '@tet/api/collectivites';
import { Badge, Breadcrumbs, Button, PageHeader, Tooltip } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { AiImportStatusView } from './ai-import-status.view';
import { importStatusLabels } from './ai-import.labels';
import { aiImportQueryState } from './ai-import.query-state';
import {
  isInaccessibleAiImportError,
  useGetAiImportStatus,
} from './data/use-get-ai-import-status';
import { useIsAiPlanImportEnabled } from './use-is-ai-plan-import-enabled';

export const AiImportHistoryView = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const router = useRouter();
  const [{ importJobId }, setImportQuery] = useQueryStates(aiImportQueryState, {
    history: 'push',
  });
  const canStartImport = useIsAiPlanImportEnabled();
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
        {(importJobId !== null || canStartImport) && (
          <PageHeader.Actions>
            <div className="flex flex-wrap items-center gap-2">
              {importJobId !== null && (
                <Tooltip label={openPlanDisabledReason}>
                  <span
                    className="inline-flex"
                    tabIndex={openPlanDisabledReason ? 0 : undefined}
                  >
                    <Button
                      size="sm"
                      variant="outlined"
                      className="disabled:pointer-events-none"
                      disabled={!!openPlanDisabledReason}
                      href={
                        !openPlanDisabledReason && planId != null
                          ? makeCollectivitePlanActionUrl({
                              collectiviteId,
                              planActionUid: String(planId),
                            })
                          : undefined
                      }
                      dataTest="plans.import-ia.ouvrir-plan"
                    >
                      {appLabels.importPlanIaOuvrirPlan}
                    </Button>
                  </span>
                </Tooltip>
              )}
              {canStartImport && (
                <Button
                  size="sm"
                  icon="add-line"
                  href={newImportUrl}
                  dataTest="plans.import-ia.nouveau-button"
                >
                  {appLabels.importPlanIaNouveau}
                </Button>
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
            onNewImport={() => router.push(newImportUrl)}
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
                      onClick={() =>
                        setImportQuery({ importJobId: item.jobId })
                      }
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
