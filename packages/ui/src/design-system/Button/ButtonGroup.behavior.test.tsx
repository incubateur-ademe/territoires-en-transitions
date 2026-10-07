import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ButtonGroup } from './ButtonGroup';

const toDisplayGroup = ({
  label = 'Affichage',
  activeButtonId,
  onClickTable,
}: {
  label?: string;
  activeButtonId?: string | null;
  onClickTable?: () => void;
}): ReactElement => (
  <ButtonGroup
    label={label}
    activeButtonId={activeButtonId}
    buttons={[
      { id: 'liste', children: 'Liste' },
      { id: 'grille', children: 'Grille' },
      { id: 'tableau', children: 'Tableau', onClick: onClickTable },
    ]}
  />
);

const getPressedStates = (): Array<string | null> =>
  screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-pressed'));

describe('ButtonGroup', () => {
  it('expose un groupe nommé par son label', () => {
    render(toDisplayGroup({ activeButtonId: 'grille' }));

    expect(
      screen.getByRole('group', { name: 'Affichage' })
    ).toBeInTheDocument();
  });

  it("n'expose aucun groupe avec un label vide", () => {
    render(toDisplayGroup({ label: '', activeButtonId: 'grille' }));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it("n'expose aucun groupe sans label", () => {
    render(
      <ButtonGroup
        activeButtonId="grille"
        buttons={[{ id: 'grille', children: 'Grille' }]}
      />
    );

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('annonce le bouton actif comme enfoncé et les autres comme relâchés', () => {
    render(toDisplayGroup({ activeButtonId: 'grille' }));

    expect(getPressedStates()).toEqual(['false', 'true', 'false']);
  });

  it("déplace l'état enfoncé quand le bouton actif change", () => {
    const { rerender } = render(toDisplayGroup({ activeButtonId: 'grille' }));

    rerender(toDisplayGroup({ activeButtonId: 'tableau' }));

    expect(getPressedStates()).toEqual(['false', 'false', 'true']);
  });

  it("annonce tous les boutons relâchés quand aucun bouton n'est actif", () => {
    render(toDisplayGroup({ activeButtonId: null }));

    expect(getPressedStates()).toEqual(['false', 'false', 'false']);
  });

  it('annonce tous les boutons relâchés sans bouton actif fourni', () => {
    render(toDisplayGroup({}));

    expect(getPressedStates()).toEqual(['false', 'false', 'false']);
  });

  it('appelle le onClick du bouton cliqué', () => {
    const onClickTable = vi.fn();
    render(toDisplayGroup({ onClickTable }));

    fireEvent.click(screen.getByRole('button', { name: 'Tableau' }));

    expect(onClickTable).toHaveBeenCalledTimes(1);
  });
});
