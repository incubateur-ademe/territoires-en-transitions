import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

/** Laisse passer le délai d'ouverture, réglé à 0 dans ces tests. */
const laisserOuvrir = () =>
  act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      })
  );

describe('Tooltip', () => {
  it('affiche la bulle au survol quand un libelle est fourni', async () => {
    render(
      <Tooltip label="Completez le diagnostic" openingDelay={0}>
        <button type="button">Valider le depot final</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'Valider le depot final' })
    );
    await laisserOuvrir();

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Completez le diagnostic'
    );
  });

  it('ne rend aucune bulle au survol quand le libelle est absent', async () => {
    render(
      <Tooltip label={undefined} openingDelay={0}>
        <button type="button">Valider le depot final</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'Valider le depot final' })
    );
    await laisserOuvrir();

    // Sans cette garde, la bulle s'ouvrait vide : seules sa fleche et ses
    // bordures restaient visibles au-dessus de l'element survole.
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('ne rend aucune bulle au survol quand le libelle est une chaine vide', async () => {
    render(
      <Tooltip label="   " openingDelay={0}>
        <button type="button">Valider le depot final</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'Valider le depot final' })
    );
    await laisserOuvrir();

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
