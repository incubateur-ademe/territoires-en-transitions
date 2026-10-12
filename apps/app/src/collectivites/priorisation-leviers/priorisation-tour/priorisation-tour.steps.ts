import { appLabels } from '@/app/labels/catalog';
import type { ResolveTargetById } from '@/app/shared/guided-tour/guided-tour-targets.context';
import { insideTopEndFloatingOptions } from '@/app/shared/guided-tour/inside-top-end.middleware';
import type { Step } from 'react-joyride';
import type { PriorisationTargetId } from './priorisation-tour.targets';

const toPriorisationTourSteps = ({
  resolve,
}: {
  resolve: ResolveTargetById<PriorisationTargetId>;
}): Step[] => [
  {
    target: resolve('metrics'),
    title: appLabels.priorisationVisiteMetriquesTitre,
    content: appLabels.priorisationVisiteMetriquesDescription,
    placement: 'bottom',
  },
  {
    target: resolve('leviersPanel'),
    title: appLabels.priorisationVisiteMatriceTitre,
    content: appLabels.priorisationVisiteMatriceDescription,
    floatingOptions: insideTopEndFloatingOptions,
  },
  {
    target: resolve('tourHelp'),
    title: appLabels.priorisationVisiteAideTitre,
    content: appLabels.priorisationVisiteAideDescription,
    placement: 'bottom',
  },
];

export { toPriorisationTourSteps };
