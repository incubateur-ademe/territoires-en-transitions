import { appLabels } from '@/app/labels/catalog';
import {
  aireCovoiturageAction,
  isolationComblesAction,
} from '@/app/shared/actions-de-reference/actions-de-reference.fixture';
import type { ActionDeReferenceId, CategorieAction } from '@tet/domain/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Preselection, PreselectionStatus } from '../../use-preselection';
import { LevierActionsDeReferenceList } from './levier-actions-de-reference.list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/collectivite/1/priorisation',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast: vi.fn(), setToastWithAction: vi.fn() }),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 4322,
}));

vi.mock(
  '@/app/shared/actions-de-reference/action-de-reference-collectivites.panel',
  () => ({
    ActionDeReferenceCollectivitesPanel: (): null => null,
  })
);

vi.mock(
  '@/app/shared/actions-de-reference/use-action-de-reference-update-access',
  () => ({
    useActionDeReferenceUpdateAccess: () => ({ status: 'forbidden' }),
  })
);

vi.mock(
  '@/app/shared/actions-de-reference/data/use-list-actions-de-reference',
  () => ({
    useListActionsDeReference: () => ({
      status: 'loaded',
      actions: [aireCovoiturageAction, isolationComblesAction],
    }),
  })
);

const buildPreselection = (
  statusOf: (actionId: ActionDeReferenceId) => PreselectionStatus
): Preselection => ({
  isReady: true,
  actions: [],
  statusOf,
  addedToPlanOf: () => undefined,
  add: vi.fn(),
  remove: vi.fn(),
  ignore: vi.fn(),
  restore: vi.fn(),
  markAddedToPlan: vi.fn(),
  clearAddedToPlan: vi.fn(),
});

const renderWithInitialCategorie = (
  initialCategorie: CategorieAction
): void => {
  render(
    <LevierActionsDeReferenceList
      levierId="covoiturage"
      initialCategorie={initialCategorie}
      preselection={buildPreselection(() => 'disponible')}
    />
  );
};

const renderActionsTarget = (
  statusOf: (actionId: ActionDeReferenceId) => PreselectionStatus
): HTMLDivElement[] => {
  const targetElements: HTMLDivElement[] = [];
  render(
    <LevierActionsDeReferenceList
      levierId="covoiturage"
      preselection={buildPreselection(statusOf)}
      actionsRef={(element) => {
        if (element !== null) {
          targetElements.push(element);
        }
      }}
    />
  );
  return targetElements;
};

afterEach(cleanup);

describe('LevierActionsDeReferenceList', () => {
  it('expose la cible de la visite sur la liste quand toutes les actions sont ignorées', () => {
    const [targetElement] = renderActionsTarget(() => 'ignoree');

    expect(targetElement?.textContent).toContain(
      appLabels.actionsIgnorees({ count: 2 })
    );
  });

  it('expose la cible de la visite sur une seule action visible, pas sur chacune', () => {
    const targetElements = renderActionsTarget(() => 'disponible');

    expect(targetElements).toHaveLength(1);
    expect(targetElements[0]?.querySelectorAll('button')).toHaveLength(2);
  });

  it("dit qu'aucune action ne relève des catégories choisies quand le filtre ne garde rien", () => {
    renderWithInitialCategorie('gouvernance');

    expect(
      screen.getByText(appLabels.aucuneActionDeReferenceDansCategories)
    ).toBeTruthy();
  });

  it('ne mentionne pas de recherche quand le filtre de catégories ne garde rien', () => {
    renderWithInitialCategorie('gouvernance');

    expect(screen.queryByText(appLabels.actionsDeReferenceAucune)).toBeNull();
  });
});
