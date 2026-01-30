import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PersonnelPage from './personnel.page';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@tet/api/users', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../_components/header', () => ({
  default: ({
    title,
    subtitle,
    activeTab,
  }: {
    title: string;
    subtitle?: string;
    activeTab: string;
  }) => (
    <div data-testid="header">
      <div data-testid="title">{title}</div>
      {subtitle && <div data-testid="subtitle">{subtitle}</div>}
      <div data-testid="active-tab">{activeTab}</div>
    </div>
  ),
}));

vi.mock('./metrics', () => ({
  default: () => <div data-testid="metrics">Metrics</div>,
}));

vi.mock('./modules', () => ({
  default: () => <div data-testid="modules">Modules</div>,
}));

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;
const mockUseUser = useUser as ReturnType<typeof vi.fn>;

describe('PersonnelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user can mutate collectivite', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        prenom: 'Jean',
      });
      mockUseCurrentCollectivite.mockReturnValue({
        nom: 'Test Collectivité',
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'collectivites.mutate'),
      });
    });

    it('should render personalized greeting', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('title')).toHaveTextContent('Bonjour Jean');
    });

    it('should render welcome subtitle', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('subtitle')).toHaveTextContent(
        'Bienvenue sur Territoires en Transitions'
      );
    });
  });

  describe('when user cannot mutate collectivite', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        prenom: 'Marie',
      });
      mockUseCurrentCollectivite.mockReturnValue({
        nom: 'Test Collectivité',
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });
    });

    it('should render collectivite name in title', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('title')).toHaveTextContent(
        'Tableau de bord de la collectivité Test Collectivité'
      );
    });

    it('should not render subtitle', () => {
      render(<PersonnelPage />);

      expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
    });
  });

  describe('common elements', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        prenom: 'Jean',
      });
      mockUseCurrentCollectivite.mockReturnValue({
        nom: 'Test Collectivité',
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });
    });

    it('should render header with personnel tab active', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('active-tab')).toHaveTextContent('personnel');
    });

    it('should render metrics component', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('metrics')).toBeInTheDocument();
    });

    it('should render modules component', () => {
      render(<PersonnelPage />);

      expect(screen.getByTestId('modules')).toBeInTheDocument();
    });

    it('should render metrics before modules', () => {
      const { container } = render(<PersonnelPage />);

      const metrics = container.querySelector('[data-testid="metrics"]');
      const modules = container.querySelector('[data-testid="modules"]');

      expect(metrics).toBeTruthy();
      expect(modules).toBeTruthy();

      // Check order
      const parent = metrics?.parentElement;
      const children = Array.from(parent?.children || []);
      const metricsIndex = children.indexOf(metrics!);
      const modulesIndex = children.indexOf(modules!);

      expect(metricsIndex).toBeLessThan(modulesIndex);
    });
  });

  describe('permission check', () => {
    it('should call hasCollectivitePermission with collectivites.mutate', () => {
      const mockHasPermission = vi.fn().mockReturnValue(true);
      mockUseUser.mockReturnValue({ prenom: 'Test' });
      mockUseCurrentCollectivite.mockReturnValue({
        nom: 'Collectivité',
        hasCollectivitePermission: mockHasPermission,
      });

      render(<PersonnelPage />);

      expect(mockHasPermission).toHaveBeenCalledWith('collectivites.mutate');
    });
  });

  describe('layout structure', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({ prenom: 'Test' });
      mockUseCurrentCollectivite.mockReturnValue({
        nom: 'Collectivité',
        hasCollectivitePermission: vi.fn().mockReturnValue(true),
      });
    });

    it('should have correct flex layout with gap', () => {
      const { container } = render(<PersonnelPage />);

      const flexContainer = container.querySelector(
        '.flex.flex-col.gap-8.mt-8'
      );
      expect(flexContainer).toBeInTheDocument();
    });
  });
});