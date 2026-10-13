import { appLabels } from '@/app/labels/catalog';
import type { ResolveTargetById } from '@/app/shared/guided-tour/guided-tour-targets.context';
import type {
  GuidedTourStep,
  GuidedTourStepData,
} from '@/app/shared/guided-tour/guided-tour.tooltip';
import { insideTopEndFloatingOptions } from '@/app/shared/guided-tour/inside-top-end.middleware';
import type { LevierId } from '@tet/domain/shared';
import { createElement } from 'react';
import type { SelectLevier } from '../priorisation-leviers.view/select-levier';
import { PriorisationTourIntro } from './priorisation-tour-intro';
import type { PriorisationTargetId } from './priorisation-tour.targets';

type PriorisationTourStepsInput = {
  resolve: ResolveTargetById<PriorisationTargetId>;
  levierToPrioritizeId?: LevierId;
  select: SelectLevier;
};

const OPEN_LEVIER_STEP_DATA: GuidedTourStepData = {
  nextLabel: appLabels.priorisationVisiteOuvrirLevier,
};

const toLevierSteps = ({
  resolve,
  levierToPrioritizeId,
  select,
}: PriorisationTourStepsInput): GuidedTourStep[] => {
  if (levierToPrioritizeId === undefined) {
    return [];
  }
  return [
    {
      target: resolve('levierToPrioritize'),
      title: appLabels.priorisationVisiteLevierAPrioriserTitre,
      content: appLabels.priorisationVisiteLevierAPrioriserDescription,
      placement: 'right',
      data: OPEN_LEVIER_STEP_DATA,
    },
    {
      target: resolve('levierHeader'),
      title: appLabels.priorisationVisiteDetailLevierTitre,
      content: appLabels.priorisationVisiteDetailLevierDescription,
      placement: 'left',
      before: async () => select(levierToPrioritizeId),
    },
    {
      target: resolve('firstActionDeReference'),
      title: appLabels.priorisationVisiteActionsTitre,
      content: appLabels.priorisationVisiteActionsDescription,
      placement: 'left',
    },
  ];
};

const toPriorisationTourSteps = ({
  resolve,
  levierToPrioritizeId,
  select,
}: PriorisationTourStepsInput): GuidedTourStep[] => [
  {
    target: 'body',
    title: appLabels.priorisationVisiteParcoursTitre,
    content: createElement(PriorisationTourIntro),
    placement: 'center',
  },
  {
    target: resolve('leviersPanel'),
    title: appLabels.priorisationVisiteMatriceTitre,
    content: appLabels.priorisationVisiteMatriceDescription,
    floatingOptions: insideTopEndFloatingOptions,
  },
  ...toLevierSteps({ resolve, levierToPrioritizeId, select }),
  {
    target: resolve('tourHelp'),
    title: appLabels.priorisationVisiteAideTitre,
    content: appLabels.priorisationVisiteAideDescription,
    placement: 'bottom',
  },
];

export { toPriorisationTourSteps };
