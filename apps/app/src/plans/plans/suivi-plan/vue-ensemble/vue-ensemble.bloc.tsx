'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { JaugeBar } from '@/app/plans/shared/jauge/jauge.bar';
import { StatutEnum } from '@tet/domain/plans';
import { Alert, Icon, InfoTooltip, InlineLink } from '@tet/ui';
import { useState } from 'react';
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
  const [thematiqueIds, setThematiqueIds] = useState<number[]>([]);
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
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3 p-6 border border-grey-3 rounded-lg">
            <span className="text-4xl font-bold text-primary-9">
              {`${data.avancement.toLocaleString('fr-FR')} %`}
            </span>
            <span className="flex items-center gap-1 text-sm text-primary-9">
              {appLabels.vueEnsembleAvancement}
              <InfoTooltip
                label={
                  <div className="max-w-sm font-normal">
                    <p className="mb-2">
                      {appLabels.vueEnsembleAvancementInfo}
                    </p>
                    <p className="mb-0">
                      {appLabels.vueEnsembleEnCoursSansAvancementInfo(
                        data.enCoursSansAvancement
                      )}
                    </p>
                  </div>
                }
              />
            </span>
            <JaugeBar value={data.avancement} hideBadge />
            <span className="text-xs text-grey-8">
              {appLabels.vueEnsembleBaseCalcul({
                total: data.total,
                abandonnees: data.abandonnees,
              })}
            </span>
            {data.enCoursSansAvancement > 0 && (
              <Alert
                className="mt-auto"
                state="warning"
                customIcon="time-line"
                title={
                  <span className="text-sm font-normal">
                    {appLabels.vueEnsembleEnCoursSansAvancement(
                      data.enCoursSansAvancement
                    )}{' '}
                    <InlineLink
                      href={makeCollectivitePlanActionUrl({
                        collectiviteId,
                        planActionUid: planId.toString(),
                        filters: { statuts: [StatutEnum.EN_COURS] },
                      })}
                    >
                      {appLabels.vueEnsembleRenseigner}
                    </InlineLink>
                  </span>
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-3 p-6 border border-grey-3 rounded-lg">
            <span className="text-sm font-bold text-primary-9">
              {appLabels.vueEnsembleRepartitionParStatut}
            </span>
            <RepartitionParStatut
              collectiviteId={collectiviteId}
              planId={planId}
              total={data.total}
              repartition={data.repartitionParStatut}
            />
            <span className="mt-auto text-xs text-grey-8">
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
