'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';
import { useRef, useState } from 'react';
import { AvancementInfoTooltip } from '../avancement-info.tooltip';
import { useExportSuiviPlanBloc } from '../data/use-export-suivi-plan-bloc';
import { useGetAvancementParAxe } from '../data/use-get-avancement-par-axe';
import { ExportBlocButton } from '../export-bloc.button';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { SuiviPlanFiltersButton } from '../suivi-plan-filters.button';
import { useSuiviPlanBlocFilters } from '../use-suivi-plan-bloc-filters';
import { AvancementAxeRow } from './avancement-axe.row';

const NB_AXES_VISIBLES = 5;

export const AvancementParAxeBloc = ({ planId }: { planId: number }) => {
  const filters = useSuiviPlanBlocFilters('avancementParAxeFiltres');
  const input = { planId, ...filters.queryInput };
  const [isAllVisible, setIsAllVisible] = useState(false);
  const { data: axes } = useGetAvancementParAxe(input);
  const blocRef = useRef<HTMLElement>(null);
  const { mutate: exportExcel, isPending: isExportingExcel } =
    useExportSuiviPlanBloc('avancement-par-axe');

  const axesVisibles =
    axes && !isAllVisible ? axes.slice(0, NB_AXES_VISIBLES) : axes;
  const nbAxesMasques = axes ? axes.length - NB_AXES_VISIBLES : 0;

  return (
    <SuiviPlanBloc
      titre={
        <span className="flex items-center gap-1">
          {appLabels.avancementParAxeTitre}
          <AvancementInfoTooltip intro={appLabels.suiviPlanAvancementInfoAxe} />
        </span>
      }
      dataTest="plans.suivi.avancement-par-axe"
      ref={blocRef}
      actions={
        <>
          <SuiviPlanFiltersButton
            filters={filters}
            dataTest="plans.suivi.avancement-par-axe.filtres"
          />
          <ExportBlocButton
            blocRef={blocRef}
            fileName={appLabels.avancementParAxeTitre}
            onExportExcel={() => exportExcel(input)}
            isExportingExcel={isExportingExcel}
            dataTest="plans.suivi.avancement-par-axe.exporter"
          />
        </>
      }
    >
      {axes === undefined ? (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      ) : axes.length === 0 ? (
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.avancementParAxeAucunAxe}
        </p>
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-col border-t border-grey-3">
            {axesVisibles?.map((axe) => (
              <AvancementAxeRow key={axe.id} axe={axe} />
            ))}
          </div>
          {nbAxesMasques > 0 && (
            <Button
              variant="unstyled"
              size="sm"
              className="flex items-center gap-1 self-start mt-3 text-sm text-primary-9"
              icon={isAllVisible ? 'arrow-up-s-line' : 'arrow-down-s-line'}
              iconPosition="right"
              onClick={() => setIsAllVisible((visible) => !visible)}
              dataTest="plans.suivi.avancement-par-axe.voir-plus"
            >
              {isAllVisible
                ? appLabels.avancementParAxeVoirMoins
                : appLabels.avancementParAxeVoirPlus(nbAxesMasques)}
            </Button>
          )}
        </div>
      )}
    </SuiviPlanBloc>
  );
};
