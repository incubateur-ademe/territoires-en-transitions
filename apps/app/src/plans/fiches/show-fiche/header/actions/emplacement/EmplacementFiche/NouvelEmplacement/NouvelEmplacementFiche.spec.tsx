import { appLabels } from '@/app/labels/catalog';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { FicheWithRelations, PlanNode } from '@tet/domain/plans';
import { fireEvent, render, screen } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import NouvelEmplacementFiche from './NouvelEmplacementFiche';

vi.mock('@/app/plans/plans/list-all-plans/data/use-list-plans', () => ({
  useListPlans: vi.fn(),
}));

vi.mock('@/app/plans/fiches/show-fiche/context/fiche-context', () => ({
  useFicheContext: () => ({ update: vi.fn() }),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 1,
}));

const PLAN_NAME = 'Plan climat';
const LEAF_AXE_NAME = 'Mobilités';

const toPlanNode = (node: Partial<PlanNode>): PlanNode => ({
  id: 1,
  nom: PLAN_NAME,
  parent: null,
  depth: 0,
  fiches: [],
  ...node,
});

const planWithLeafAxe = {
  id: 1,
  axes: [
    toPlanNode({}),
    toPlanNode({
      id: 2,
      nom: LEAF_AXE_NAME,
      parent: 1,
      depth: 1,
    }),
  ],
} as unknown as PlanListItem;

const mockedUseListPlans = vi.mocked(useListPlans);

const renderNouvelEmplacement = ({
  isLoading = false,
  plans = [],
  error = null,
}: {
  isLoading?: boolean;
  plans?: PlanListItem[];
  error?: unknown;
} = {}) => {
  mockedUseListPlans.mockReturnValue({
    plans,
    totalCount: plans.length,
    isLoading,
    error,
    refetch: vi.fn(),
  });

  render(
    <NouvelEmplacementFiche
      fiche={{ id: 1, axes: [] } as unknown as FicheWithRelations}
      onSave={vi.fn()}
    />,
    { wrapper: withNuqsTestingAdapter() }
  );
};

const clickButtonByName = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('NouvelEmplacementFiche', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  test("n'annonce pas l'absence de plan tant que les plans chargent", () => {
    renderNouvelEmplacement({ isLoading: true });

    expect(
      screen.queryByText(appLabels.ficheEmplacementAucunPlanRattacher)
    ).toBeNull();
  });

  test("annonce l'absence de plan une fois le chargement terminé", () => {
    renderNouvelEmplacement();

    expect(
      screen.getByText(appLabels.ficheEmplacementAucunPlanRattacher)
    ).toBeDefined();
  });

  test("n'annonce pas l'absence de plan quand la requête a échoué", () => {
    renderNouvelEmplacement({ error: new Error('FORBIDDEN') });

    expect(
      screen.queryByText(appLabels.ficheEmplacementAucunPlanRattacher)
    ).toBeNull();
    expect(screen.getByText(appLabels.uneErreurEstSurvenue)).toBeDefined();
  });

  test("sélectionner un axe sans sous-axe ne lève pas d'erreur", () => {
    renderNouvelEmplacement({ plans: [planWithLeafAxe] });

    clickButtonByName(PLAN_NAME);
    clickButtonByName(LEAF_AXE_NAME);

    expect(() => vi.runAllTimers()).not.toThrow();
  });
});
