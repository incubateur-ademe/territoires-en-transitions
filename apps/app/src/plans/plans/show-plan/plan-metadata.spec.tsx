import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Plan } from '@tet/domain/plans';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PlanMetadata } from './plan-metadata';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('../use-list-plan-types', () => ({
  useListPlanTypes: () => ({ options: [] }),
}));

vi.mock('./plan-calendar.inline-editable-field', () => ({
  PlanCalendarInlineEditableField: () => null,
}));

vi.mock('@/app/collectivites/tags/personne-tag.dropdown', () => ({
  default: () => null,
}));

vi.mock('../components/france-icon.svg', () => ({
  default: () => null,
}));

vi.mock('@tet/ui', async (importActual) => {
  const actual = await importActual<typeof import('@tet/ui')>();
  const { createElement } = await import('react');
  return {
    ...actual,
    Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
      createElement(
        'span',
        null,
        createElement('span', { role: 'tooltip' }, label),
        children
      ),
  };
});

const mockedUseCurrentCollectivite = vi.mocked(useCurrentCollectivite);

const planWithOneBudgetedFicheOutOfThree = {
  id: 1,
  collectiviteId: 10,
  type: null,
  axes: [],
  pilotes: [],
  referents: [],
  totalFiches: 3,
  budget: {
    investissement: {
      HT: { budgetReel: { total: 200, nbFiches: 1 } },
    },
  },
} as unknown as Plan;

const renderBudgetTooltipsFor = ({
  canReadFichesRestreintes,
}: {
  canReadFichesRestreintes: boolean;
}): (string | null)[] => {
  mockedUseCurrentCollectivite.mockReturnValue({
    hasCollectivitePermission: () => canReadFichesRestreintes,
  } as unknown as ReturnType<typeof useCurrentCollectivite>);

  render(
    <PlanMetadata
      plan={planWithOneBudgetedFicheOutOfThree}
      isReadOnly
      updatePlan={vi.fn()}
    />
  );

  return screen.getAllByRole('tooltip').map((tooltip) => tooltip.textContent);
};

describe('PlanMetadata', () => {
  it("précise au non-membre que les actions en accès restreint sont exclues des budgets, y compris quand aucun budget n'est visible", () => {
    expect(
      renderBudgetTooltipsFor({ canReadFichesRestreintes: false })
    ).toEqual([
      'Le budget total est calculé sur la base de 1/3 actions.\nLes actions sans budget dépensé HT renseigné ne sont pas incluses dans ce calcul.\nLes actions en accès restreint ne sont pas incluses non plus.',
      "Aucun budget dépensé HT n'est visible pour le moment.\nLes actions en accès restreint ne sont pas incluses.",
    ]);
  });

  it("n'évoque pas les actions en accès restreint pour qui peut les lire", () => {
    expect(renderBudgetTooltipsFor({ canReadFichesRestreintes: true })).toEqual(
      [
        'Le budget total est calculé sur la base de 1/3 actions.\nLes actions sans budget dépensé HT renseigné ne sont pas incluses dans ce calcul.',
        'Complétez les budgets dépensés HT dans les actions pour voir le total ici.',
      ]
    );
  });
});
