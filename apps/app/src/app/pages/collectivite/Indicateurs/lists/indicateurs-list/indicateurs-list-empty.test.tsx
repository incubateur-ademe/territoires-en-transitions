import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  EmptyListId,
  IndicateursListEmpty,
  IndicateursListNoResults,
  validEmptyListId,
} from './indicateurs-list-empty';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    collectiviteId: 1,
    hasCollectivitePermission: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@tet/ui', async () => {
  const actual = await vi.importActual('@tet/ui');
  return {
    ...actual,
    useEventTracker: () => vi.fn(),
  };
});

vi.mock(
  '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur',
  () => ({
    default: () => <div data-testid="modale-creer-indicateur" />,
  })
);

describe('IndicateursListEmpty', () => {
  describe('when list is not filtered', () => {
    it('should render custom empty message for collectivite list', () => {
      render(
        <IndicateursListEmpty isFiltered={false} listId="collectivite" />
      );

      expect(
        screen.getByText(
          "Votre collectivité n'a pas encore d'indicateurs favoris"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Ajoutez en à cet espace en utilisant l\'icône "étoile" sur les pages indicateurs.'
        )
      ).toBeInTheDocument();
    });

    it('should render custom empty message for perso list', () => {
      render(<IndicateursListEmpty isFiltered={false} listId="perso" />);

      expect(
        screen.getByText(
          "Votre collectivité n'a pas encore d'indicateurs personnalisés"
        )
      ).toBeInTheDocument();
    });

    it('should render custom empty message for mes-indicateurs list', () => {
      render(
        <IndicateursListEmpty isFiltered={false} listId="mes-indicateurs" />
      );

      expect(
        screen.getByText("Vous n'avez aucun indicateur associé à votre nom")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Parcourez les indicateurs pour vous assigner en tant que pilote.\nCela vous facilitera le suivi et la mise à jour !'
        )
      ).toBeInTheDocument();
    });

    it('should show parcourir button for all custom empty lists', () => {
      const listIds: EmptyListId[] = [
        'collectivite',
        'perso',
        'mes-indicateurs',
      ];

      listIds.forEach((listId) => {
        const { unmount } = render(
          <IndicateursListEmpty isFiltered={false} listId={listId} />
        );

        expect(
          screen.getByRole('button', { name: 'Parcourir les indicateurs' })
        ).toBeInTheDocument();

        unmount();
      });
    });

    it('should show create button for perso list with permission', () => {
      render(<IndicateursListEmpty isFiltered={false} listId="perso" />);

      expect(
        screen.getByRole('button', { name: 'Créer un indicateur personnalisé' })
      ).toBeInTheDocument();
    });
  });

  describe('when list is filtered', () => {
    it('should render no results message', () => {
      render(<IndicateursListEmpty isFiltered={true} listId="collectivite" />);

      expect(
        screen.getByText('Aucun indicateur ne correspond à votre recherche')
      ).toBeInTheDocument();
    });
  });

  describe('when list id is not in validEmptyListId', () => {
    it('should render no results message', () => {
      render(<IndicateursListEmpty isFiltered={false} listId="autre" />);

      expect(
        screen.getByText('Aucun indicateur ne correspond à votre recherche')
      ).toBeInTheDocument();
    });
  });
});

describe('IndicateursListNoResults', () => {
  it('should render no results message', () => {
    render(<IndicateursListNoResults />);

    expect(
      screen.getByText('Aucun indicateur ne correspond à votre recherche')
    ).toBeInTheDocument();
  });

  it('should show modify filter button when setIsSettingsOpen is provided', () => {
    const mockSetIsSettingsOpen = vi.fn();

    render(
      <IndicateursListNoResults setIsSettingsOpen={mockSetIsSettingsOpen} />
    );

    expect(
      screen.getByRole('button', { name: 'Modifier le filtre' })
    ).toBeInTheDocument();
  });

  it('should not show modify filter button when setIsSettingsOpen is not provided', () => {
    render(<IndicateursListNoResults />);

    expect(
      screen.queryByRole('button', { name: 'Modifier le filtre' })
    ).not.toBeInTheDocument();
  });

  it('should call setIsSettingsOpen when modify filter button is clicked', async () => {
    const user = userEvent.setup();
    const mockSetIsSettingsOpen = vi.fn();

    render(
      <IndicateursListNoResults setIsSettingsOpen={mockSetIsSettingsOpen} />
    );

    const button = screen.getByRole('button', { name: 'Modifier le filtre' });
    await user.click(button);

    expect(mockSetIsSettingsOpen).toHaveBeenCalledWith(true);
  });
});

describe('validEmptyListId', () => {
  it('should contain expected list ids', () => {
    expect(validEmptyListId).toEqual([
      'collectivite',
      'perso',
      'mes-indicateurs',
    ]);
  });
});