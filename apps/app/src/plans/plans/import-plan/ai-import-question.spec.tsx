import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiImportQuestion } from './ai-import-question';

const question = {
  kind: 'action-level' as const,
  axes: { exampleTitle: 'Limiter les déchets verts', examplePage: 31, count: 5 },
  fiches: {
    exampleTitle: 'Accompagner les habitants vers le jardinage au naturel',
    examplePage: 37,
    count: 16,
  },
  etapes: {
    exampleTitle: 'Diagnostiquer et orienter',
    examplePage: 37,
    count: 54,
  },
  proposed: 'fiche' as const,
  answer: null,
};

const renderQuestion = (onAnswer = vi.fn()) => {
  render(<AiImportQuestion question={question} onAnswer={onAnswer} />);
  return onAnswer;
};

const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];

describe('AiImportQuestion', () => {
  it('montre les niveaux du document, le choix proposé coché', () => {
    renderQuestion();

    expect(
      screen.getByRole('radiogroup', {
        name: appLabels.importPlanIaQuestionTitre,
      })
    ).toBeTruthy();
    expect(screen.getByText(question.fiches.exampleTitle)).toBeTruthy();
    expect(screen.getByText(question.etapes.exampleTitle)).toBeTruthy();
    expect(radios().map(({ checked }) => checked)).toEqual([true, false]);
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceFiche({
          axes: 5,
          sousAxes: 0,
          actions: 16,
          sousActions: 54,
        })
      )
    ).toBeTruthy();
  });

  it("chiffre l'autre lecture quand on la choisit, et l'envoie", () => {
    const onAnswer = renderQuestion();

    fireEvent.click(radios()[1]);

    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceEtape({
          axes: 5,
          sousAxes: 16,
          actions: 54,
          sousActions: 0,
        })
      )
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.importPlanIaQuestionContinuer,
      })
    );
    expect(onAnswer).toHaveBeenCalledWith('etape');
  });
});
