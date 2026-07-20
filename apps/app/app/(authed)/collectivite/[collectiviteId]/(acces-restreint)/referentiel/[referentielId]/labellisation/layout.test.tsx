import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Layout from './layout';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@/app/referentiels/referentiel-context', () => ({
  useReferentielId: vi.fn(),
}));

vi.mock('@/app/referentiels/labellisations/useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
}));

vi.mock('@/app/referentiels/use-snapshot', () => ({
  useEtatLieuxHasStarted: vi.fn(),
}));

vi.mock(
  '@/app/referentiels/labellisations/HeaderLabellisation',
  () => ({
    default: () => <div data-testid="header-labellisation">Header</div>,
  })
);

vi.mock('@/app/ui/shared/SpinnerLoader', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="spinner" className={className}>
      Loading...
    </div>
  ),
}));

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useEtatLieuxHasStarted } from '@/app/referentiels/use-snapshot';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;
const mockUseReferentielId = useReferentielId as ReturnType<typeof vi.fn>;
const mockUseCycleLabellisation = useCycleLabellisation as ReturnType<
  typeof vi.fn
>;
const mockUseEtatLieuxHasStarted = useEtatLieuxHasStarted as ReturnType<
  typeof vi.fn
>;

describe('Layout (Labellisation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentCollectivite.mockReturnValue({
      collectiviteId: 1,
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
    });
    mockUseReferentielId.mockReturnValue('cae');
    mockUseCycleLabellisation.mockReturnValue({});
  });

  describe('loading state', () => {
    it('should show spinner when loading', () => {
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: false,
        isLoading: true,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show title while loading', () => {
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: false,
        isLoading: true,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.getByRole('heading', { name: 'Audit et labellisation' })
      ).toBeInTheDocument();
      expect(screen.getByText('Référentiel Climat Air Énergie')).toBeInTheDocument();
    });
  });

  describe('when referentiel not started', () => {
    beforeEach(() => {
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: false,
        isLoading: false,
      });
    });

    it('should show not started message', () => {
      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.getByText(/Ce référentiel n'est pas encore renseigné/)
      ).toBeInTheDocument();
    });

    it('should show update button when user has permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'referentiels.mutate'),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      const button = screen.getByRole('link', {
        name: 'Mettre à jour le référentiel',
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute(
        'href',
        '/collectivite/1/referentiel/cae'
      );
    });

    it('should show view button when user lacks permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.getByRole('link', { name: 'Voir le référentiel' })
      ).toBeInTheDocument();
    });

    it('should have correct data-test attribute', () => {
      const { container } = render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        container.querySelector('[data-test="labellisation-cae"]')
      ).toBeInTheDocument();
    });
  });

  describe('when referentiel has started', () => {
    beforeEach(() => {
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: true,
        isLoading: false,
      });
    });

    it('should show header and tabs', () => {
      render(<Layout tabs={<div data-testid="tabs-content">Tabs</div>} />);

      expect(screen.getByTestId('header-labellisation')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-content')).toBeInTheDocument();
    });

    it('should show title and subtitle', () => {
      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.getByRole('heading', { name: 'Audit et labellisation' })
      ).toBeInTheDocument();
      expect(screen.getByText('Référentiel Climat Air Énergie')).toBeInTheDocument();
    });

    it('should have correct data-test attribute', () => {
      const { container } = render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        container.querySelector('[data-test="labellisation-cae"]')
      ).toBeInTheDocument();
    });
  });

  describe('referentiel name display', () => {
    it('should show CAE name for cae referentiel', () => {
      mockUseReferentielId.mockReturnValue('cae');
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: true,
        isLoading: false,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(screen.getByText('Référentiel Climat Air Énergie')).toBeInTheDocument();
    });

    it('should show ECI name for eci referentiel', () => {
      mockUseReferentielId.mockReturnValue('eci');
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: true,
        isLoading: false,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(screen.getByText('Référentiel Économie Circulaire')).toBeInTheDocument();
    });
  });

  describe('cycle labellisation', () => {
    it('should pass cycle labellisation to header', () => {
      const mockCycle = { id: 1, etoiles: 3 };
      mockUseCycleLabellisation.mockReturnValue(mockCycle);
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: true,
        isLoading: false,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(mockUseCycleLabellisation).toHaveBeenCalledWith('cae');
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      mockUseEtatLieuxHasStarted.mockReturnValue({
        started: false,
        isLoading: false,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      const h1 = screen.getByRole('heading', {
        name: 'Audit et labellisation',
      });
      expect(h1.tagName).toBe('H1');
    });
  });
});