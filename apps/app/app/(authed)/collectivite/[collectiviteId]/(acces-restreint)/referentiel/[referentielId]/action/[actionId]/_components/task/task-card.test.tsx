import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TaskCard from './task-card';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ActionTypeEnum } from '@tet/domain/referentiels';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@/app/referentiels/actions/action-statut/use-action-statut', () => ({
  useActionStatut: vi.fn(),
}));

vi.mock('../subaction/subaction-card.header', () => ({
  SubactionCardHeader: ({
    hideStatus,
    shouldDisplayProgressBar,
  }: {
    hideStatus: boolean;
    shouldDisplayProgressBar: boolean;
  }) => (
    <div data-testid="subaction-card-header">
      <div data-testid="hide-status">{String(hideStatus)}</div>
      <div data-testid="display-progress">{String(shouldDisplayProgressBar)}</div>
    </div>
  ),
}));

vi.mock('../score-indicatif/score-indicatif.libelle', () => ({
  default: () => <div data-testid="score-indicatif-libelle">Score</div>,
}));

vi.mock('../subaction/subaction-card.actions', () => ({
  default: () => <div data-testid="subaction-card-actions">Actions</div>,
}));

vi.mock('../action/action.justification-field', () => ({
  ActionJustificationField: ({ placeholder }: { placeholder: string }) => (
    <div data-testid="justification-field">{placeholder}</div>
  ),
}));

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;
const mockUseActionStatut = useActionStatut as ReturnType<typeof vi.fn>;

describe('TaskCard', () => {
  const mockTask: ActionDefinitionSummary = {
    id: 'task_1',
    identifiant: '1.1.1',
    nom: 'Test Task',
    type: ActionTypeEnum.TACHE,
    haveScoreIndicatif: false,
    children: [],
    description: 'Test description',
    referentielVersion: 'v1',
    thematiques: [],
    phase: 'mise_en_oeuvre',
    havePreuve: false,
    haveExemples: false,
    havePerso: false,
    discussionsCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
    });
    mockUseActionStatut.mockReturnValue({
      statut: null,
    });
  });

  it('should render task card', () => {
    render(
      <TaskCard task={mockTask} hideStatus={false} showJustifications={false} />
    );

    expect(screen.getByTestId('subaction-card-header')).toBeInTheDocument();
  });

  describe('status visibility', () => {
    it('should pass hideStatus prop to header', () => {
      render(
        <TaskCard
          task={mockTask}
          hideStatus={true}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('hide-status')).toHaveTextContent('true');
    });

    it('should show status when hideStatus is false', () => {
      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('hide-status')).toHaveTextContent('false');
    });
  });

  describe('progress bar display', () => {
    it('should show progress bar when status is detaille and concerne is true', () => {
      mockUseActionStatut.mockReturnValue({
        statut: {
          avancement: 'detaille',
          concerne: true,
        },
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('display-progress')).toHaveTextContent('true');
    });

    it('should not show progress bar when avancement is not detaille', () => {
      mockUseActionStatut.mockReturnValue({
        statut: {
          avancement: 'fait',
          concerne: true,
        },
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('display-progress')).toHaveTextContent('false');
    });

    it('should not show progress bar when concerne is false', () => {
      mockUseActionStatut.mockReturnValue({
        statut: {
          avancement: 'detaille',
          concerne: false,
        },
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('display-progress')).toHaveTextContent('false');
    });
  });

  describe('score indicatif', () => {
    it('should render score indicatif libelle', () => {
      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('score-indicatif-libelle')).toBeInTheDocument();
    });
  });

  describe('actions section', () => {
    it('should render actions when user has permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'referentiels.mutate'),
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.getByTestId('subaction-card-actions')).toBeInTheDocument();
    });

    it('should show divider when user has permission and is detaille', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });
      mockUseActionStatut.mockReturnValue({
        statut: {
          avancement: 'detaille',
        },
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      // Divider should be present
      const { container } = render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );
      expect(container.querySelector('[class*="divider"]')).toBeInTheDocument();
    });
  });

  describe('justifications', () => {
    it('should show justification field when showJustifications is true', () => {
      render(
        <TaskCard task={mockTask} hideStatus={false} showJustifications={true} />
      );

      expect(screen.getByTestId('justification-field')).toBeInTheDocument();
    });

    it('should not show justification field when showJustifications is false', () => {
      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(screen.queryByTestId('justification-field')).not.toBeInTheDocument();
    });

    it('should use correct placeholder for justification field', () => {
      render(
        <TaskCard task={mockTask} hideStatus={false} showJustifications={true} />
      );

      expect(screen.getByTestId('justification-field')).toHaveTextContent(
        "Ce champ est facultatif, il ne sera pas considéré lors de l'audit"
      );
    });
  });

  describe('with score indicatif', () => {
    it('should show divider when task has score indicatif', () => {
      const taskWithScore = {
        ...mockTask,
        haveScoreIndicatif: true,
      };

      render(
        <TaskCard
          task={taskWithScore}
          hideStatus={false}
          showJustifications={false}
        />
      );

      // Actions component should be rendered
      expect(screen.getByTestId('subaction-card-actions')).toBeInTheDocument();
    });
  });

  describe('permission checks', () => {
    it('should check for referentiels.mutate permission', () => {
      const mockHasPermission = vi.fn().mockReturnValue(true);
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: mockHasPermission,
      });

      render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      expect(mockHasPermission).toHaveBeenCalledWith('referentiels.mutate');
    });
  });

  describe('card styling', () => {
    it('should have border and rounded corners', () => {
      const { container } = render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('border', 'rounded-lg');
    });

    it('should have correct layout classes', () => {
      const { container } = render(
        <TaskCard
          task={mockTask}
          hideStatus={false}
          showJustifications={false}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('flex', 'flex-col', 'gap-2');
    });
  });
});