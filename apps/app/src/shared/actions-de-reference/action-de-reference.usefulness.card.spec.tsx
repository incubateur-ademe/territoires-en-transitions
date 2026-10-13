import { appLabels } from '@/app/labels/catalog';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceUsefulnessCard } from './action-de-reference.usefulness.card';

afterEach(cleanup);

describe('ActionDeReferenceUsefulnessCard', () => {
  it('affiche la question et les réponses Oui et Non tant qu’aucune réponse n’est donnée', () => {
    render(<ActionDeReferenceUsefulnessCard onAnswer={vi.fn()} />);

    expect(
      screen.getByText(appLabels.actionDeReferenceUtileQuestion)
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: appLabels.actionDeReferenceUtileOui })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: appLabels.actionDeReferenceUtileNon })
    ).toBeTruthy();
  });

  it('un clic sur Oui transmet la réponse « +1 » puis remplace la question par le remerciement', () => {
    const onAnswer = vi.fn();
    render(<ActionDeReferenceUsefulnessCard onAnswer={onAnswer} />);

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.actionDeReferenceUtileOui })
    );

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('+1');
    expect(
      screen.getByText(appLabels.actionDeReferenceUtileMerci)
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: appLabels.actionDeReferenceUtileOui,
      })
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: appLabels.actionDeReferenceUtileNon,
      })
    ).toBeNull();
  });

  it('un clic sur Non transmet la réponse « -1 »', () => {
    const onAnswer = vi.fn();
    render(<ActionDeReferenceUsefulnessCard onAnswer={onAnswer} />);

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.actionDeReferenceUtileNon })
    );

    expect(onAnswer).toHaveBeenCalledWith('-1');
    expect(
      screen.getByText(appLabels.actionDeReferenceUtileMerci)
    ).toBeTruthy();
  });
});
