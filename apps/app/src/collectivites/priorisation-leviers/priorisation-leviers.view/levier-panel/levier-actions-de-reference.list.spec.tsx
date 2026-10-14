import { appLabels } from '@/app/labels/catalog';
import {
  aireCovoiturageAction,
  isolationComblesAction,
} from '@/app/shared/actions-de-reference/actions-de-reference.fixture';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Preselection, PreselectionStatus } from '../../use-preselection';
import { LevierActionsDeReferenceList } from './levier-actions-de-reference.list';

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
  statusOf: (actionId: string) => PreselectionStatus
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

const renderActionsTarget = (
  statusOf: (actionId: string) => PreselectionStatus
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

  it('expose la cible de la visite sur les boutons de la première action visible', () => {
    const [targetElement] = renderActionsTarget(() => 'disponible');

    expect(targetElement?.querySelectorAll('button')).toHaveLength(2);
  });
});
