import { appLabels } from '@/app/labels/catalog';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriorisationTourIntro } from './priorisation-tour-intro';

const EXPECTED_PARTS = [
  {
    title: appLabels.priorisationVisiteReperageTitre,
    description: appLabels.priorisationVisiteReperageDescription,
  },
  {
    title: appLabels.priorisationVisiteExplorationTitre,
    description: appLabels.priorisationVisiteExplorationDescription,
  },
  {
    title: appLabels.priorisationVisiteSauvegardeTitre,
    description: appLabels.priorisationVisiteSauvegardeDescription,
  },
];

describe('PriorisationTourIntro', () => {
  it("détaille dans l'ordre les trois temps du parcours, chacun avec son explication", () => {
    render(<PriorisationTourIntro />);

    const renderedParts = screen
      .getAllByRole('listitem')
      .map((part, index) => ({
        title: within(part).getByRole('heading', { level: 3 }).textContent,
        hasExpectedDescription:
          within(part).queryByText(EXPECTED_PARTS[index].description) !== null,
      }));

    expect(renderedParts).toEqual(
      EXPECTED_PARTS.map(({ title }) => ({
        title,
        hasExpectedDescription: true,
      }))
    );
  });

  it('annonce le parcours avant de le détailler', () => {
    render(<PriorisationTourIntro />);

    expect(
      screen.queryByText(appLabels.priorisationVisiteParcoursDescription)
    ).not.toBeNull();
  });
});
