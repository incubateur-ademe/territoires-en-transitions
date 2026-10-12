import type { CollectiviteCurrent } from '@tet/api/collectivites';
import { cleanup, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActionDeReferenceFiche } from './actions-de-reference.contract';
import { LinkedFichesList } from './linked-fiches.list';

const EMPTY_MESSAGE = "Aucune collectivité n'a encore partagé d'action liée.";

vi.mock('@/app/plans/fiches/components/card/fiche.card', () => ({
  FicheCard: ({
    ficheAction,
    link,
  }: {
    ficheAction: { titre: string };
    link: string | undefined;
  }): JSX.Element =>
    link === undefined ? (
      <span>{ficheAction.titre}</span>
    ) : (
      <a href={link}>{ficheAction.titre}</a>
    ),
}));

afterEach(cleanup);

const toFiche = ({
  id,
  collectiviteId,
  titre,
  restreint,
}: Pick<
  ActionDeReferenceFiche,
  'id' | 'collectiviteId' | 'titre' | 'restreint'
>): ActionDeReferenceFiche =>
  ({ id, collectiviteId, titre, restreint } as ActionDeReferenceFiche);

const renderList = (fiches: readonly ActionDeReferenceFiche[]): void => {
  render(
    <LinkedFichesList
      fiches={fiches}
      currentCollectivite={{} as CollectiviteCurrent}
      currentUserId="user-1"
    />
  );
};

describe('linked-fiches-vides', () => {
  it("dit qu'aucune collectivité n'a partagé d'action liée", () => {
    renderList([]);

    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeNull();
  });
});

describe('linked-fiches-listees', () => {
  it("n'affiche pas le message d'absence quand une fiche est liée", () => {
    renderList([
      toFiche({
        id: 34,
        collectiviteId: 12,
        titre: 'Tiers-financement',
        restreint: false,
      }),
    ]);

    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });

  it('affiche une entrée par fiche liée', () => {
    renderList([
      toFiche({
        id: 34,
        collectiviteId: 12,
        titre: 'Fiche A',
        restreint: false,
      }),
      toFiche({
        id: 35,
        collectiviteId: 13,
        titre: 'Fiche B',
        restreint: null,
      }),
    ]);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('mène à la page de la fiche, dans sa collectivité, quand elle est publique', () => {
    renderList([
      toFiche({
        id: 34,
        collectiviteId: 12,
        titre: 'Tiers-financement',
        restreint: false,
      }),
    ]);

    expect(
      screen
        .getByRole('link', { name: 'Tiers-financement' })
        .getAttribute('href')
    ).toContain('/collectivite/12/actions/34');
  });

  it('montre une fiche restreinte sans lien vers sa page', () => {
    renderList([
      toFiche({
        id: 34,
        collectiviteId: 12,
        titre: 'Fiche confidentielle',
        restreint: true,
      }),
    ]);

    expect({
      isTitleShown: screen.queryByText('Fiche confidentielle') !== null,
      links: screen.queryAllByRole('link'),
    }).toEqual({ isTitleShown: true, links: [] });
  });
});
