import { Etoile } from '@tet/domain/referentiels';
import {
  RenderResult,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StartAuditForm } from './start-audit.form';

const AUDIT_TYPE_LEGEND = "Quel type d'audit souhaitez-vous demander ?";

const AUDIT_TYPE_NAMES = [
  'Audit COT sans labellisation',
  'Audit COT avec labellisation',
  'Audit de labellisation',
];

const renderForm = (props: {
  canAskCOTLabellisation: boolean;
  labellisable?: boolean;
  maximumPossibleStarToRequest: Etoile;
}): RenderResult =>
  render(
    <StartAuditForm
      canAskCOTLabellisation={props.canAskCOTLabellisation}
      labellisable={props.labellisable ?? true}
      maximumPossibleStarToRequest={props.maximumPossibleStarToRequest}
      isPending={false}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />
  );

describe('StartAuditForm', () => {
  it("collectivité non-COT : ne rend aucun choix de type d'audit", () => {
    renderForm({ canAskCOTLabellisation: false, maximumPossibleStarToRequest: 5 });
    expect(
      screen.queryByRole('group', { name: AUDIT_TYPE_LEGEND })
    ).toBeNull();
  });

  it("collectivité COT : rend exactement les trois types d'audit", () => {
    renderForm({ canAskCOTLabellisation: true, maximumPossibleStarToRequest: 5 });
    const group = screen.getByRole('group', { name: AUDIT_TYPE_LEGEND });
    expect(within(group).getAllByRole('radio')).toHaveLength(
      AUDIT_TYPE_NAMES.length
    );
    AUDIT_TYPE_NAMES.forEach((name) => {
      expect(within(group).getByRole('radio', { name })).toBeDefined();
    });
  });

  it("collectivité COT non labellisable : seul l'audit COT seul reste activable", () => {
    renderForm({
      canAskCOTLabellisation: true,
      labellisable: false,
      maximumPossibleStarToRequest: 5,
    });
    const group = screen.getByRole('group', { name: AUDIT_TYPE_LEGEND });
    expect(
      within(group).getByRole('radio', { name: 'Audit COT sans labellisation' })
    ).toHaveProperty('disabled', false);
    expect(
      within(group).getByRole('radio', { name: 'Audit COT avec labellisation' })
    ).toHaveProperty('disabled', true);
    expect(
      within(group).getByRole('radio', { name: 'Audit de labellisation' })
    ).toHaveProperty('disabled', true);
  });

  it("présélectionne l'étoile-objectif dans le sélecteur d'étoile", () => {
    renderForm({ canAskCOTLabellisation: false, maximumPossibleStarToRequest: 3 });
    expect(screen.getByText('troisième étoile')).toBeDefined();
  });

  it.each<[Etoile, number[]]>([
    [2, [2]],
    [3, [2, 3]],
    [4, [2, 3, 4]],
    [5, [2, 3, 4, 5]],
  ])(
    'étoile-objectif %i : le sélecteur propose exactement les étoiles %j',
    (maximumPossibleStarToRequest, expectedStars) => {
      const { container } = renderForm({
        canAskCOTLabellisation: false,
        maximumPossibleStarToRequest,
      });
      const trigger = container.querySelector('[data-test="target-star"]');
      if (!trigger) {
        throw new Error("sélecteur d'étoile introuvable");
      }
      fireEvent.click(trigger);

      const renderedStars = [2, 3, 4, 5].filter((star) =>
        document.querySelector(`[data-test="${star}"]`)
      );
      expect(renderedStars).toEqual(expectedStars);
    }
  );
});
