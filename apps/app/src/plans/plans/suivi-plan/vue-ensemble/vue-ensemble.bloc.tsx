'use client';

import { appLabels } from '@/app/labels/catalog';
import { JaugeBar } from '@/app/plans/shared/jauge/jauge.bar';
import { Alert, Icon } from '@tet/ui';
import { useRef } from 'react';
import { AvancementInfoTooltip } from '../avancement-info.tooltip';
import { useExportSuiviPlanBloc } from '../data/use-export-suivi-plan-bloc';
import { useGetVueEnsemble } from '../data/use-get-vue-ensemble';
import { ExportBlocButton } from '../export-bloc.button';
import { RenseignerAvancementButton } from '../faire-avancer-le-plan/renseigner-avancement.side-panel';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { SuiviPlanFilterBadges } from '../suivi-plan-filter-badges';
import { SuiviPlanFiltersButton } from '../suivi-plan-filters.button';
import { useSuiviPlanBlocFilters } from '../use-suivi-plan-bloc-filters';
import { RepartitionParStatut } from './repartition-par-statut.chart';

export const VueEnsembleBloc = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const filters = useSuiviPlanBlocFilters('vueEnsembleFiltres');
  const input = { planId, ...filters.queryInput };
  const { data } = useGetVueEnsemble(input);
  const blocRef = useRef<HTMLElement>(null);
  const { mutate: exportExcel, isPending: isExportingExcel } =
    useExportSuiviPlanBloc('vue-ensemble');

  return (
    <SuiviPlanBloc
      titre={appLabels.vueEnsembleTitre}
      dataTest="plans.suivi.vue-ensemble"
      ref={blocRef}
      filterBadges={<SuiviPlanFilterBadges filters={filters} />}
      actions={
        <>
          <SuiviPlanFiltersButton
            filters={filters}
            hiddenKeys={['statuts']}
            dataTest="plans.suivi.vue-ensemble.filtres"
          />
          <ExportBlocButton
            blocRef={blocRef}
            fileName={appLabels.vueEnsembleTitre}
            onExportExcel={() => exportExcel(input)}
            isExportingExcel={isExportingExcel}
            dataTest="plans.suivi.vue-ensemble.exporter"
          />
        </>
      }
    >
      {data ? (
        <div className="[container-type:inline-size]">
          <div className="grid gap-4 grid-cols-1 [@container(min-width:67rem)]:grid-cols-2">
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
                <div className="[container-type:inline-size]">
                  <Alert
                    state="warning"
                    customIcon="progress-1-line"
                    className="gap-2.5 px-3 py-2.5 rounded-md ring-1 ring-inset ring-warning-3"
                    description={
                      <div className="flex flex-col items-start gap-2 [@container(min-width:30rem)]:flex-row [@container(min-width:30rem)]:items-center [@container(min-width:30rem)]:justify-between">
                        <span className="text-sm leading-5 text-grey-9">
                          {appLabels.vueEnsembleEnCoursSansAvancement(
                            data.enCoursSansAvancement
                          )}
                        </span>
                        <RenseignerAvancementButton
                          collectiviteId={collectiviteId}
                          planId={planId}
                          dataTest="plans.suivi.vue-ensemble.renseigner-avancement"
                        />
                      </div>
                    }
                  />
                </div>
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
                pilotageFilters={filters.pilotageFilters}
                repartition={data.repartitionParStatut}
              />
              <span className="text-xs text-grey-8">
                {appLabels.vueEnsembleRepartitionInfo}
              </span>
            </div>
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
