'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';
import { AvancementInfoTooltip } from '../avancement-info.tooltip';
import { useGetAvancementParAxe } from '../data/use-get-avancement-par-axe';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { ThematiquesFilterButton } from '../thematiques-filter.button';
import { AvancementAxeRow } from './avancement-axe.row';

const NB_AXES_VISIBLES = 5;

export const AvancementParAxeBloc = ({ planId }: { planId: number }) => {
  const [thematiqueIds, setThematiqueIds] = useQueryState(
    'avancementParAxeThematiques',
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const [isAllVisible, setIsAllVisible] = useState(false);
  const { data: axes } = useGetAvancementParAxe({ planId, thematiqueIds });

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
      actions={
        <ThematiquesFilterButton
          thematiqueIds={thematiqueIds}
          onChange={setThematiqueIds}
          dataTest="plans.suivi.avancement-par-axe.filtre-thematiques"
        />
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
