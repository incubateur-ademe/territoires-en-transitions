import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FichesListEmpty } from './fiches-list.empty';

// Mock the useCreateFicheAction hook
vi.mock(
  '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction',
  () => ({
    useCreateFicheAction: () => ({
      mutate: vi.fn(),
    }),
  })
);

describe('FichesListEmpty', () => {
  it('should render empty state with title and subtitle', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);

    render(<FichesListEmpty hasCollectivitePermission={mockHasPermission} />);

    expect(
      screen.getByText("Vous n'avez pas encore créé d'actions !")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Une fois vos actions créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères.'
      )
    ).toBeInTheDocument();
  });

  it('should show create button when user has permission', () => {
    const mockHasPermission = vi.fn((permission: string) => {
      return permission === 'plans.fiches.create';
    });

    render(<FichesListEmpty hasCollectivitePermission={mockHasPermission} />);

    const createButton = screen.getByRole('button', {
      name: 'Créer une action',
    });
    expect(createButton).toBeInTheDocument();
  });

  it('should not show create button when user lacks permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);

    render(<FichesListEmpty hasCollectivitePermission={mockHasPermission} />);

    const createButton = screen.queryByRole('button', {
      name: 'Créer une action',
    });
    expect(createButton).not.toBeInTheDocument();
  });

  it('should call hasCollectivitePermission with correct permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);

    render(<FichesListEmpty hasCollectivitePermission={mockHasPermission} />);

    expect(mockHasPermission).toHaveBeenCalledWith('plans.fiches.create');
  });
});