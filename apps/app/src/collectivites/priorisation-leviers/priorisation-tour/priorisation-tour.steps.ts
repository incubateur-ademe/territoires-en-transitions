import { appLabels } from '@/app/labels/catalog';
import type { ResolveTarget } from '@/app/shared/guided-tour/guided-tour-registry';
import { insideTopEnd } from '@/app/shared/guided-tour/inside-top-end.middleware';
import type { Step } from 'react-joyride';
import type { PriorisationTargetId } from './priorisation-tour.targets';

const INSIDE_TARGET_MARGIN = 20;

const toPriorisationTourSteps = ({
  resolve,
}: {
  resolve: (id: PriorisationTargetId) => ResolveTarget;
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
    floatingOptions: {
      hideArrow: true,
      middleware: [insideTopEnd(INSIDE_TARGET_MARGIN)],
    },
  },
  {
    target: resolve('tourHelp'),
    title: appLabels.priorisationVisiteAideTitre,
    content: appLabels.priorisationVisiteAideDescription,
    placement: 'bottom',
  },
];

export { toPriorisationTourSteps };
