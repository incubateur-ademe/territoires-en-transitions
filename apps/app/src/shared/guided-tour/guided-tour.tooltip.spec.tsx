import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TooltipRenderProps } from 'react-joyride';
import { describe, expect, it, vi } from 'vitest';
import { GuidedTourTooltip } from './guided-tour.tooltip';

type ButtonProps = TooltipRenderProps['backProps'];

const STEP_TITLE = "Titre de l'étape";

const STEP_CONTENT = "Contenu de l'étape";

const TOTAL_STEPS = 3;

const toButtonProps = (ariaLabel: string): ButtonProps => ({
  'aria-label': ariaLabel,
  'data-action': ariaLabel,
  onClick: vi.fn(),
  role: 'button',
  title: ariaLabel,
});

const toStep = (title?: string): TooltipRenderProps['step'] =>
  ({ title, content: STEP_CONTENT } as TooltipRenderProps['step']);

const toTooltipProps = ({
  index,
  title = STEP_TITLE,
}: {
  index: number;
  title?: string;
}): TooltipRenderProps => ({
  backProps: toButtonProps(''),
  closeProps: toButtonProps(appLabels.visiteGuideeQuitter),
  controls: {} as TooltipRenderProps['controls'],
  continuous: true,
  index,
  isLastStep: index === TOTAL_STEPS - 1,
  primaryProps: toButtonProps(''),
  size: TOTAL_STEPS,
  skipProps: toButtonProps(''),
  step: toStep(title),
  tooltipProps: { 'aria-modal': true, role: 'alertdialog' },
});

const toStepLabel = (index: number): string =>
  appLabels.visiteGuideeEtape({ index, size: TOTAL_STEPS });

const toProgress = (): {
  now: string | null;
  min: string | null;
  max: string | null;
  text: string | null;
  widthPercent: number;
} => {
  const progressbar = screen.getByRole('progressbar', {
    name: appLabels.visiteGuideeProgression,
  });
  const fill = progressbar.firstElementChild;
  if (!(fill instanceof HTMLElement)) {
    throw new Error('Progress fill not found');
  }
  return {
    now: progressbar.getAttribute('aria-valuenow'),
    min: progressbar.getAttribute('aria-valuemin'),
    max: progressbar.getAttribute('aria-valuemax'),
    text: progressbar.getAttribute('aria-valuetext'),
    widthPercent: Math.round(parseFloat(fill.style.width)),
  };
};

const hasButton = (name: string): boolean =>
  screen.queryByRole('button', { name }) !== null;

describe('GuidedTourTooltip', () => {
  it('affiche le compteur et une progression à un tiers, sans « Précédent » à la première étape', () => {
    render(<GuidedTourTooltip {...toTooltipProps({ index: 0 })} />);

    expect({
      counter: screen.queryByText(toStepLabel(1)) !== null,
      progress: toProgress(),
      hasBackButton: hasButton(appLabels.precedent),
      hasNextButton: hasButton(appLabels.suivant),
    }).toEqual({
      counter: true,
      progress: {
        now: '1',
        min: '0',
        max: '3',
        text: toStepLabel(1),
        widthPercent: 33,
      },
      hasBackButton: false,
      hasNextButton: true,
    });
  });

  it('propose « Précédent » à partir de la deuxième étape', () => {
    render(<GuidedTourTooltip {...toTooltipProps({ index: 1 })} />);

    expect(hasButton(appLabels.precedent)).toBe(true);
  });

  it('remplace « Suivant » par « Terminer » et remplit la barre à la dernière étape', () => {
    render(<GuidedTourTooltip {...toTooltipProps({ index: 2 })} />);

    expect({
      hasFinishButton: hasButton(appLabels.terminer),
      hasNextButton: hasButton(appLabels.suivant),
      progress: toProgress(),
    }).toEqual({
      hasFinishButton: true,
      hasNextButton: false,
      progress: {
        now: '3',
        min: '0',
        max: '3',
        text: toStepLabel(3),
        widthPercent: 100,
      },
    });
  });

  it("nomme la boîte de dialogue par le titre de l'étape et la décrit par son contenu", () => {
    render(<GuidedTourTooltip {...toTooltipProps({ index: 0 })} />);

    expect(
      screen.queryByRole('alertdialog', {
        name: STEP_TITLE,
        description: STEP_CONTENT,
      })
    ).not.toBeNull();
  });

  it("nomme la boîte de dialogue par un libellé de repli quand l'étape n'a pas de titre", () => {
    render(
      <GuidedTourTooltip {...toTooltipProps({ index: 0 })} step={toStep()} />
    );

    expect({
      hasNamedDialog:
        screen.queryByRole('alertdialog', {
          name: appLabels.visiteGuidee,
          description: STEP_CONTENT,
        }) !== null,
      hasHeading: screen.queryByRole('heading') !== null,
      labelledBy: screen
        .getByRole('alertdialog')
        .getAttribute('aria-labelledby'),
    }).toEqual({ hasNamedDialog: true, hasHeading: false, labelledBy: null });
  });

  it('branche chaque bouton sur son action', () => {
    const props = toTooltipProps({ index: 1 });
    render(<GuidedTourTooltip {...props} />);

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.visiteGuideePasser })
    );
    fireEvent.click(
      screen.getByRole('button', { name: appLabels.visiteGuideeQuitter })
    );
    fireEvent.click(screen.getByRole('button', { name: appLabels.precedent }));
    fireEvent.click(screen.getByRole('button', { name: appLabels.suivant }));

    expect({
      skip: vi.mocked(props.skipProps.onClick).mock.calls.length,
      close: vi.mocked(props.closeProps.onClick).mock.calls.length,
      back: vi.mocked(props.backProps.onClick).mock.calls.length,
      primary: vi.mocked(props.primaryProps.onClick).mock.calls.length,
    }).toEqual({ skip: 1, close: 1, back: 1, primary: 1 });
  });
});
