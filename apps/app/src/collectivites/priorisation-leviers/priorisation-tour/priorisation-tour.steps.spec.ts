import { appLabels } from '@/app/labels/catalog';
import type { Step } from 'react-joyride';
import { describe, expect, it } from 'vitest';
import { toPriorisationTourSteps } from './priorisation-tour.steps';
import type { PriorisationTargetId } from './priorisation-tour.targets';

const toElement = (label: string): HTMLElement => {
  const element = document.createElement('div');
  element.textContent = label;
  return element;
};

const elements: Record<PriorisationTargetId, HTMLElement> = {
  metrics: toElement('métriques'),
  leviersPanel: toElement('panneau des leviers'),
  tourHelp: toElement("bouton d'aide"),
};

const resolve = (id: PriorisationTargetId) => () => elements[id];

const resolveTarget = (step: Step): HTMLElement | null =>
  typeof step.target === 'function' ? step.target() : null;

describe('toPriorisationTourSteps', () => {
  it("enchaîne les métriques, la matrice puis l'aide", () => {
    const steps = toPriorisationTourSteps({ resolve });

    expect(steps.map(({ title }) => title)).toEqual([
      appLabels.priorisationVisiteMetriquesTitre,
      appLabels.priorisationVisiteMatriceTitre,
      appLabels.priorisationVisiteAideTitre,
    ]);
  });

  it("vise les métriques, le panneau des leviers puis le bouton d'aide", () => {
    const steps = toPriorisationTourSteps({ resolve });

    expect(steps.map(resolveTarget)).toEqual([
      elements.metrics,
      elements.leviersPanel,
      elements.tourHelp,
    ]);
  });

  it('place le popover de la matrice dans le coin de son panneau', () => {
    const [, matrixStep] = toPriorisationTourSteps({ resolve });

    expect(
      matrixStep.floatingOptions?.middleware?.map(({ name }) => name)
    ).toEqual(['insideTopEnd']);
  });
});
