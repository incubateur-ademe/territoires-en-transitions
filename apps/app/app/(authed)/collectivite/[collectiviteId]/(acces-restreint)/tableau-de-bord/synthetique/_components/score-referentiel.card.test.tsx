import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScoreReferentielCard from './score-referentiel.card';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@/app/referentiels/use-snapshot', () => ({
  useListSnapshots: vi.fn(),
}));

vi.mock('@/app/ui/shared/SpinnerLoader', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="spinner" className={className}>
      Loading...
    </div>
  ),
}));

vi.mock('@/app/tableaux-de-bord/modules/module/module.container', () => ({
  ModuleContainer: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="module-container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock(
  '@/app/referentiels/comparisons/evolutions-score-total.chart',
  () => ({
    ScoreTotalEvolutionsChart: ({
      snapshots,
      referentielId,
    }: {
      snapshots: unknown[];
      referentielId: string;
    }) => (
      <div data-testid="score-chart">
        Chart for {referentielId} with {snapshots.length} snapshots
      </div>
    ),
  })
);

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useListSnapshots } from '@/app/referentiels/use-snapshot';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;
const mockUseListSnapshots = useListSnapshots as ReturnType<typeof vi.fn>;

describe('ScoreReferentielCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentCollectivite.mockReturnValue({
      collectiviteId: 1,
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
    });
  });

  describe('loading state', () => {
    it('should show spinner when loading', () => {
      mockUseListSnapshots.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show spinner inside module container', () => {
      mockUseListSnapshots.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByTestId('module-container')).toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no data', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByText('Climat Air Énergie')).toBeInTheDocument();
    });

    it('should show empty state when all points are non-renseigné', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [
          {
            pointNonRenseigne: 100,
            pointPotentiel: 100,
          },
        ],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      const button = screen.getByRole('link', {
        name: "Renseigner l'état des lieux",
      });
      expect(button).toBeInTheDocument();
    });

    it('should show action button when user has permission', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
      });
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'referentiels.mutate'),
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(
        screen.getByRole('link', { name: "Renseigner l'état des lieux" })
      ).toBeInTheDocument();
    });

    it('should show no data message when user lacks permission', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
      });
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });

    it('should not show detail button when empty', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(
        screen.queryByRole('link', { name: 'Afficher le détail' })
      ).not.toBeInTheDocument();
    });
  });

  describe('with data', () => {
    const mockSnapshots = [
      {
        pointNonRenseigne: 10,
        pointPotentiel: 100,
        pointFait: 50,
      },
      {
        pointNonRenseigne: 5,
        pointPotentiel: 100,
        pointFait: 70,
      },
    ];

    beforeEach(() => {
      mockUseListSnapshots.mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      });
    });

    it('should show chart title', () => {
      render(<ScoreReferentielCard referentielId="cae" />);

      expect(
        screen.getByText("L'évolution du score en points")
      ).toBeInTheDocument();
    });

    it('should show referentiel name', () => {
      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByText('CLIMAT AIR ÉNERGIE')).toBeInTheDocument();
    });

    it('should show chart component', () => {
      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByTestId('score-chart')).toBeInTheDocument();
    });

    it('should show detail button', () => {
      render(<ScoreReferentielCard referentielId="cae" />);

      const button = screen.getByRole('link', {
        name: 'Afficher le détail',
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute(
        'href',
        '/collectivite/1/referentiel/cae?tab=evolutions'
      );
    });

    it('should limit snapshots to 4 for chart', () => {
      const manySnapshots = Array.from({ length: 10 }, (_, i) => ({
        pointNonRenseigne: i,
        pointPotentiel: 100,
        pointFait: 50 + i,
      }));

      mockUseListSnapshots.mockReturnValue({
        data: manySnapshots,
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      const chart = screen.getByTestId('score-chart');
      expect(chart).toHaveTextContent('4 snapshots');
    });
  });

  describe('referentiel names', () => {
    it('should show correct name for CAE', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [{ pointNonRenseigne: 0, pointPotentiel: 100 }],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="cae" />);

      expect(screen.getByText('CLIMAT AIR ÉNERGIE')).toBeInTheDocument();
    });

    it('should show correct name for ECI', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [{ pointNonRenseigne: 0, pointPotentiel: 100 }],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="eci" />);

      expect(screen.getByText('ÉCONOMIE CIRCULAIRE')).toBeInTheDocument();
    });
  });

  describe('URL generation', () => {
    beforeEach(() => {
      mockUseListSnapshots.mockReturnValue({
        data: [{ pointNonRenseigne: 0, pointPotentiel: 100 }],
        isLoading: false,
      });
    });

    it('should generate correct URL for detail button', () => {
      render(<ScoreReferentielCard referentielId="cae" />);

      const button = screen.getByRole('link', {
        name: 'Afficher le détail',
      });
      expect(button).toHaveAttribute(
        'href',
        '/collectivite/1/referentiel/cae?tab=evolutions'
      );
    });

    it('should generate correct URL for empty state button', () => {
      mockUseListSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<ScoreReferentielCard referentielId="eci" />);

      const button = screen.getByRole('link', {
        name: "Renseigner l'état des lieux",
      });
      expect(button).toHaveAttribute('href', '/collectivite/1/referentiel/eci');
    });
  });
});