import { render, screen } from '@testing-library/react';
import type { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurPersonnalisationProvider } from './indicateur-personnalisation.context';
import { IndicateurPersonnalisationQuestions } from './indicateur-personnalisation.questions';

vi.mock(
  '@/app/collectivites/personnalisations/personnalisation-questions.list',
  () => ({
    PersonnalisationQuestionsList: ({ canEdit }: { canEdit: boolean }) => (
      <div role="list" aria-label="questions" data-can-edit={canEdit} />
    ),
  })
);

const questionReponses = [
  { question: { id: 'potentiel_eolien_ou_hydro' } },
] as PersonnalisationQuestionReponse[];

const renderQuestions = ({
  isDrom,
  questions,
}: {
  isDrom: boolean;
  questions: PersonnalisationQuestionReponse[];
}) =>
  render(
    <IndicateurPersonnalisationProvider
      value={{ useListQuestionsReponses: () => questions }}
    >
      <IndicateurPersonnalisationQuestions isDrom={isDrom} canEdit />
    </IndicateurPersonnalisationProvider>
  );

describe('IndicateurPersonnalisationQuestions', () => {
  it('affiche les questions et transmet le droit d’édition', () => {
    renderQuestions({ isDrom: false, questions: questionReponses });

    expect(
      screen
        .getByRole('list', { name: 'questions' })
        .getAttribute('data-can-edit')
    ).toBe('true');
  });

  it('masque les questions en DROM', () => {
    renderQuestions({ isDrom: true, questions: questionReponses });

    expect(screen.queryByRole('list', { name: 'questions' })).toBeNull();
  });

  it('masque les questions quand la collectivité n’en a aucune', () => {
    renderQuestions({ isDrom: false, questions: [] });

    expect(screen.queryByRole('list', { name: 'questions' })).toBeNull();
  });
});
