import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './header';
import type { TDBViewId } from '@/app/app/paths';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@tet/ui/design-system/TabsNext/index', () => ({
  TabsTab: ({ label, isActive }: { label: string; isActive: boolean }) => (
    <div data-testid={`tab-${label}`} data-active={isActive}>
      {label}
    </div>
  ),
}));

import { useCurrentCollectivite } from '@tet/api/collectivites';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    activeTab: 'synthetique' as TDBViewId,
    title: 'Test Title',
  };

  it('should render title', () => {
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
      isSimplifiedView: false,
    });

    render(<Header {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
      isSimplifiedView: false,
    });

    render(<Header {...defaultProps} subtitle="Test Subtitle" />);

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
      isSimplifiedView: false,
    });

    render(<Header {...defaultProps} />);

    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  describe('page buttons', () => {
    it('should render page buttons when provided', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
        isSimplifiedView: false,
      });

      const pageButtons = [
        { children: 'Button 1' },
        { children: 'Button 2' },
      ];

      render(<Header {...defaultProps} pageButtons={pageButtons} />);

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('should not render buttons section when no buttons provided', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
        isSimplifiedView: false,
      });

      const { container } = render(<Header {...defaultProps} />);

      // Should not find button wrapper div
      const buttonWrapper = container.querySelector('.flex.flex-wrap.gap-3');
      expect(buttonWrapper).not.toBeInTheDocument();
    });
  });

  describe('tabs visibility', () => {
    it('should show tabs when user has collectivites.mutate permission and not simplified view', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'collectivites.mutate'),
        isSimplifiedView: false,
      });

      render(<Header {...defaultProps} />);

      expect(screen.getByTestId('tab-Tableau de bord')).toBeInTheDocument();
      expect(screen.getByTestId('tab-Mon suivi personnel')).toBeInTheDocument();
    });

    it('should not show tabs when user lacks collectivites.mutate permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
        isSimplifiedView: false,
      });

      render(<Header {...defaultProps} />);

      expect(screen.queryByTestId('tab-Tableau de bord')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-Mon suivi personnel')).not.toBeInTheDocument();
    });

    it('should not show tabs when in simplified view', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
        isSimplifiedView: true,
      });

      render(<Header {...defaultProps} />);

      expect(screen.queryByTestId('tab-Tableau de bord')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-Mon suivi personnel')).not.toBeInTheDocument();
    });

    it('should not show tabs when both lacking permission and in simplified view', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
        isSimplifiedView: true,
      });

      render(<Header {...defaultProps} />);

      expect(screen.queryByTestId('tab-Tableau de bord')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-Mon suivi personnel')).not.toBeInTheDocument();
    });
  });

  describe('tab active states', () => {
    it('should mark synthetique tab as active', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
        isSimplifiedView: false,
      });

      render(<Header {...defaultProps} activeTab="synthetique" />);

      const synthetiqueTab = screen.getByTestId('tab-Tableau de bord');
      expect(synthetiqueTab).toHaveAttribute('data-active', 'true');

      const personnelTab = screen.getByTestId('tab-Mon suivi personnel');
      expect(personnelTab).toHaveAttribute('data-active', 'false');
    });

    it('should mark personnel tab as active', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
        isSimplifiedView: false,
      });

      render(<Header {...defaultProps} activeTab="personnel" />);

      const synthetiqueTab = screen.getByTestId('tab-Tableau de bord');
      expect(synthetiqueTab).toHaveAttribute('data-active', 'false');

      const personnelTab = screen.getByTestId('tab-Mon suivi personnel');
      expect(personnelTab).toHaveAttribute('data-active', 'true');
    });
  });

  it('should call hasCollectivitePermission with correct permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    mockUseCurrentCollectivite.mockReturnValue({
      hasCollectivitePermission: mockHasPermission,
      isSimplifiedView: false,
    });

    render(<Header {...defaultProps} />);

    expect(mockHasPermission).toHaveBeenCalledWith('collectivites.mutate');
  });
});