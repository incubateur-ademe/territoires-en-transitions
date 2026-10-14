import { appLabels } from '@/app/labels/catalog';
import { insideTopEndFloatingOptions } from '@/app/shared/guided-tour/inside-top-end.middleware';
import type { LevierId } from '@tet/domain/shared';
import type { Step } from 'react-joyride';
import { describe, expect, it, vi } from 'vitest';
import type { SelectLevier } from '../priorisation-leviers.view/select-levier';
import { toPriorisationTourSteps } from './priorisation-tour.steps';
import type { PriorisationTargetId } from './priorisation-tour.targets';

type StepData = Parameters<NonNullable<Step['before']>>[0];

const toElement = (label: string): HTMLElement => {
  const element = document.createElement('div');
  element.textContent = label;
  return element;
};

const elements: Record<PriorisationTargetId, HTMLElement> = {
  leviersPanel: toElement('panneau des leviers'),
  levierToPrioritize: toElement('levier à prioriser'),
  levierHeader: toElement('en-tête du levier'),
  firstActionDeReference: toElement('boutons de la première action'),
  tourHelp: toElement("bouton d'aide"),
};

const resolve = (id: PriorisationTargetId) => () => elements[id];

const resolveTarget = (step: Step): unknown =>
  typeof step.target === 'function' ? step.target() : step.target;

const LEVIER_TO_PRIORITIZE_ID = 'biogaz';

const toSteps = ({
  levierToPrioritizeId,
  select = vi.fn<SelectLevier>(),
}: {
  levierToPrioritizeId?: LevierId;
  select?: SelectLevier;
}): Step[] =>
  toPriorisationTourSteps({ resolve, levierToPrioritizeId, select });

describe('toPriorisationTourSteps', () => {
  it("enchaîne le parcours, la matrice puis l'aide sans levier à prioriser", () => {
    const steps = toSteps({});

    expect(steps.map(({ title }) => title)).toEqual([
      appLabels.priorisationVisiteParcoursTitre,
      appLabels.priorisationVisiteMatriceTitre,
      appLabels.priorisationVisiteAideTitre,
    ]);
  });

  it("insère le levier à prioriser, son détail et ses actions avant l'aide quand un levier est à prioriser", () => {
    const steps = toSteps({ levierToPrioritizeId: LEVIER_TO_PRIORITIZE_ID });

    expect(steps.map(({ title }) => title)).toEqual([
      appLabels.priorisationVisiteParcoursTitre,
      appLabels.priorisationVisiteMatriceTitre,
      appLabels.priorisationVisiteLevierAPrioriserTitre,
      appLabels.priorisationVisiteDetailLevierTitre,
      appLabels.priorisationVisiteActionsTitre,
      appLabels.priorisationVisiteAideTitre,
    ]);
  });

  it("vise la page entière pour le parcours, puis la matrice et le bouton d'aide sans levier à prioriser", () => {
    const steps = toSteps({});

    expect(steps.map(resolveTarget)).toEqual([
      'body',
      elements.leviersPanel,
      elements.tourHelp,
    ]);
  });

  it('présente le parcours au centre de la page', () => {
    const [introStep] = toSteps({});

    expect(introStep.placement).toBe('center');
  });

  it("vise le point, l'en-tête et les boutons de la première action avec un levier à prioriser", () => {
    const steps = toSteps({ levierToPrioritizeId: LEVIER_TO_PRIORITIZE_ID });

    expect(steps.map(resolveTarget)).toEqual([
      'body',
      elements.leviersPanel,
      elements.levierToPrioritize,
      elements.levierHeader,
      elements.firstActionDeReference,
      elements.tourHelp,
    ]);
  });

  it('place le popover de la matrice dans le coin de son panneau', () => {
    const [, matrixStep] = toSteps({});

    expect(matrixStep.floatingOptions).toBe(insideTopEndFloatingOptions);
  });

  it("propose d'ouvrir le levier plutôt que de passer à l'étape suivante", () => {
    const steps = toSteps({ levierToPrioritizeId: LEVIER_TO_PRIORITIZE_ID });

    expect(steps.map(({ data }) => data)).toEqual([
      undefined,
      undefined,
      { nextLabel: appLabels.priorisationVisiteOuvrirLevier },
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("n'ouvre le levier à prioriser qu'avant l'étape de son détail", async () => {
    const select = vi.fn<SelectLevier>();
    const steps = toSteps({
      levierToPrioritizeId: LEVIER_TO_PRIORITIZE_ID,
      select,
    });
    const hasBeforeHook = steps.map(({ before }) => before !== undefined);

    await steps[3].before?.({} as StepData);

    expect({ hasBeforeHook, selected: select.mock.calls }).toEqual({
      hasBeforeHook: [false, false, false, true, false, false],
      selected: [['biogaz']],
    });
  });
});
