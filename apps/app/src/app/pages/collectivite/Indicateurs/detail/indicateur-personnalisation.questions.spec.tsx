import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurPersonnalisationQuestions } from './indicateur-personnalisation.questions';

const mocks = vi.hoisted(() => ({
  useListQuestionsReponses: vi.fn(),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 3,
}));
vi.mock(
  '@/app/collectivites/personnalisations/data/use-list-personnalisation-questions-reponses',
  () => ({
    useListPersonnalisationQuestionsReponses: mocks.useListQuestionsReponses,
  })
);
vi.mock(
  '@/app/collectivites/personnalisations/personnalisation-questions.list',
  () => ({
    PersonnalisationQuestionsList: ({ canEdit }: { canEdit: boolean }) => (
      <div role="list" aria-label="questions" data-can-edit={canEdit} />
    ),
  })
);

const questionReponses = [{ question: { id: 'potentiel_eolien_ou_hydro' } }];

describe('IndicateurPersonnalisationQuestions', () => {
  beforeEach(() => {
    mocks.useListQuestionsReponses.mockReset();
    mocks.useListQuestionsReponses.mockReturnValue(questionReponses);
  });

  it('demande la question de potentiel éolien ou hydro pour la collectivité courante', () => {
    render(<IndicateurPersonnalisationQuestions isDrom={false} canEdit />);

    expect(mocks.useListQuestionsReponses).toHaveBeenCalledWith(3, {
      questionIds: ['potentiel_eolien_ou_hydro'],
    });
  });

  it('affiche les questions et transmet le droit d’édition', () => {
    render(<IndicateurPersonnalisationQuestions isDrom={false} canEdit />);

    expect(
      screen
        .getByRole('list', { name: 'questions' })
        .getAttribute('data-can-edit')
    ).toBe('true');
  });

  it('masque les questions en DROM', () => {
    render(<IndicateurPersonnalisationQuestions isDrom canEdit />);

    expect(screen.queryByRole('list', { name: 'questions' })).toBeNull();
  });

  it('masque les questions quand la collectivité n’en a aucune', () => {
    mocks.useListQuestionsReponses.mockReturnValue([]);
    render(<IndicateurPersonnalisationQuestions isDrom={false} canEdit />);

    expect(screen.queryByRole('list', { name: 'questions' })).toBeNull();
  });
});
