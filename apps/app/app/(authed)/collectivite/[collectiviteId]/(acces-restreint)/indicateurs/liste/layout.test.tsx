import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Layout from './layout';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock(
  '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur',
  () => ({
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="modale-creer-indicateur">Modal</div> : null,
  })
);

import { useCurrentCollectivite } from '@tet/api/collectivites';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;

describe('Layout (Indicateurs Liste)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render title', () => {
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(false),
    });

    render(<Layout tabs={<div>Tabs content</div>} />);

    expect(screen.getByText("Listes d'indicateurs")).toBeInTheDocument();
  });

  it('should render tabs prop', () => {
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(false),
    });

    render(<Layout tabs={<div data-testid="tabs-content">Tabs</div>} />);

    expect(screen.getByTestId('tabs-content')).toBeInTheDocument();
  });

  describe('create button', () => {
    it('should show create button when user has permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation(
            (perm: string) => perm === 'indicateurs.indicateurs.create'
          ),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.getByRole('button', { name: 'Créer un indicateur' })
      ).toBeInTheDocument();
    });

    it('should not show create button when user lacks permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(
        screen.queryByRole('button', { name: 'Créer un indicateur' })
      ).not.toBeInTheDocument();
    });

    it('should have correct data-test attribute', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      const button = screen.getByRole('button', {
        name: 'Créer un indicateur',
      });
      expect(button).toHaveAttribute('data-test', 'create-perso');
    });

    it('should open modal when clicked', async () => {
      const user = userEvent.setup();
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      const button = screen.getByRole('button', {
        name: 'Créer un indicateur',
      });
      await user.click(button);

      expect(screen.getByTestId('modale-creer-indicateur')).toBeInTheDocument();
    });

    it('should not show modal initially', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(screen.queryByTestId('modale-creer-indicateur')).not.toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should have correct flex layout classes', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });

      const { container } = render(<Layout tabs={<div>Tabs</div>} />);

      const headerDiv = container.querySelector(
        '.flex.justify-between.max-sm\\:flex-col'
      );
      expect(headerDiv).toBeInTheDocument();
    });

    it('should call hasCollectivitePermission with correct permission', () => {
      const mockHasPermission = vi.fn().mockReturnValue(false);
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: mockHasPermission,
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      expect(mockHasPermission).toHaveBeenCalledWith(
        'indicateurs.indicateurs.create'
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });

      render(<Layout tabs={<div>Tabs</div>} />);

      const heading = screen.getByRole('heading', {
        name: "Listes d'indicateurs",
      });
      expect(heading.tagName).toBe('H2');
    });
  });
});