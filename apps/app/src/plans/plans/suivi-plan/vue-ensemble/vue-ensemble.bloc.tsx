'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { JaugeBar } from '@/app/plans/shared/jauge/jauge.bar';
import { faireAvancerLePlanFilters } from '@tet/domain/plans';
import { Alert, Icon, InlineLink } from '@tet/ui';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { AvancementInfoTooltip } from '../avancement-info.tooltip';
import { useGetVueEnsemble } from '../data/use-get-vue-ensemble';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { ThematiquesFilterButton } from '../thematiques-filter.button';
import { RepartitionParStatut } from './repartition-par-statut.chart';

export const VueEnsembleBloc = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const [thematiqueIds, setThematiqueIds] = useQueryState(
    'vueEnsembleThematiques',
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const { data } = useGetVueEnsemble({ planId, thematiqueIds });

  return (
    <SuiviPlanBloc
      titre={appLabels.vueEnsembleTitre}
      dataTest="plans.suivi.vue-ensemble"
      actions={
        <ThematiquesFilterButton
          thematiqueIds={thematiqueIds}
          onChange={setThematiqueIds}
          dataTest="plans.suivi.vue-ensemble.filtre-thematiques"
        />
      }
    >
      {data ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-3 p-6 rounded-lg bg-grey-1 ring-1 ring-inset ring-grey-3">
            <div className="flex flex-col justify-center flex-1 gap-3">
              <span className="text-4xl leading-10 font-bold text-primary-9">
                {`${Math.round(data.avancement)} %`}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-primary-9">
                {appLabels.vueEnsembleAvancement}
                <AvancementInfoTooltip
                  intro={appLabels.suiviPlanAvancementInfoPlan}
                />
              </span>
              <JaugeBar value={Math.round(data.avancement)} hideBadge />
              <span className="text-xs text-grey-8">
                {appLabels.vueEnsembleBaseCalcul({
                  total: data.total,
                  abandonnees: data.abandonnees,
                })}
              </span>
            </div>
            {data.enCoursSansAvancement > 0 && (
              <Alert
                state="warning"
                customIcon="progress-1-line"
                className="gap-2.5 px-3 py-2.5 rounded-md ring-1 ring-inset ring-warning-3"
                description={
                  <span className="text-sm leading-5 text-grey-9">
                    {appLabels.vueEnsembleEnCoursSansAvancement(
                      data.enCoursSansAvancement
                    )}{' '}
                    <InlineLink
                      href={makeCollectivitePlanActionUrl({
                        collectiviteId,
                        planActionUid: planId.toString(),
                        filters:
                          faireAvancerLePlanFilters.enCoursSansAvancement,
                      })}
                      className="font-medium text-primary-9 underline-offset-2"
                    >
                      {appLabels.vueEnsembleRenseigner}
                    </InlineLink>
                  </span>
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-3 p-5 rounded-lg bg-grey-1 ring-1 ring-inset ring-grey-3">
            <span className="text-sm font-medium text-primary-9">
              {appLabels.vueEnsembleRepartitionParStatut}
            </span>
            <RepartitionParStatut
              collectiviteId={collectiviteId}
              planId={planId}
              total={data.total}
              repartition={data.repartitionParStatut}
            />
            <span className="text-xs text-grey-8">
              {appLabels.vueEnsembleRepartitionInfo}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      )}
    </SuiviPlanBloc>
  );
};
