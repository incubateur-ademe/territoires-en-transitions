import { aireCovoiturageAction } from '@/app/shared/actions-de-reference/actions-de-reference.fixture';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceSummaryCard } from './action-de-reference-summary.card';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 4322,
}));

const ADD_LABEL = 'Ajouter';
const REMOVE_LABEL = 'Retirer';

afterEach(cleanup);

describe('card-resume-mene-au-detail', () => {
  it("le titre est un lien vers la page détail de l'action", () => {
    render(
      <ActionDeReferenceSummaryCard action={aireCovoiturageAction}>
        <button type="button">{ADD_LABEL}</button>
      </ActionDeReferenceSummaryCard>
    );

    expect(
      screen
        .getByRole('link', { name: aireCovoiturageAction.titre })
        .getAttribute('href')
    ).toBe(`/collectivite/4322/actions-reference/${aireCovoiturageAction.id}`);
  });

  it('les actions de la card restent des boutons distincts du lien du titre', () => {
    render(
      <ActionDeReferenceSummaryCard action={aireCovoiturageAction}>
        <button type="button">{ADD_LABEL}</button>
        <button type="button">{REMOVE_LABEL}</button>
      </ActionDeReferenceSummaryCard>
    );

    const link = screen.getByRole('link');
    const buttons = screen.getAllByRole('button');

    expect({
      buttonLabels: buttons.map((button) => button.textContent),
      buttonsInsideLink: buttons.filter((button) => link.contains(button)),
    }).toEqual({
      buttonLabels: [ADD_LABEL, REMOVE_LABEL],
      buttonsInsideLink: [],
    });
  });
});
