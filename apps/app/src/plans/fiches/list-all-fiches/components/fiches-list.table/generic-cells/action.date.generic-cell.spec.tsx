import { render, screen } from '@testing-library/react';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { describe, expect, it, vi } from 'vitest';
import { ActionDateGenericCell } from './action.date.generic-cell';

// cast de mock : seuls les champs lus par le rendu de la cellule importent ici
const buildAction = (overrides: Partial<FicheWithRelationsAndCollectivite>) =>
  ({
    id: 1,
    statut: null,
    dateFin: null,
    ameliorationContinue: null,
    ...overrides,
  } as unknown as FicheWithRelationsAndCollectivite);

describe('ActionDateGenericCell', () => {
  it('affiche la date de fin quand la fiche ne se répète pas', () => {
    render(
      <ActionDateGenericCell
        action={buildAction({ dateFin: '2027-12-31' })}
        canUpdate={true}
        updateAction={vi.fn()}
      />
    );

    expect(screen.getByText('31/12/2027')).toBeTruthy();
  });

  it("n'affiche pas une date de fin périmée quand l'action se répète tous les ans, même si dateFin est encore renseignée en base", () => {
    render(
      <ActionDateGenericCell
        action={buildAction({
          dateFin: '2027-12-31',
          ameliorationContinue: true,
        })}
        canUpdate={true}
        updateAction={vi.fn()}
      />
    );

    expect(screen.queryByText('31/12/2027')).toBeNull();
    expect(screen.getByText('Action se répète tous les ans')).toBeTruthy();
  });
});
