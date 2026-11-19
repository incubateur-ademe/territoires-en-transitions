import '@testing-library/jest-dom/vitest';

import { appLabels } from '@/app/labels/catalog';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import type { DemarcheListItem } from './use-filter-demarches-pcaet';

const demarche = (
  overrides: Partial<DemarcheListItem> & Pick<DemarcheListItem, 'id' | 'titre'>
): DemarcheListItem => ({
  collectiviteId: 1,
  status: DemarchePcaetStatusEnum.EN_ELABORATION,
  createdAt: '2026-11-12T00:00:00.000Z',
  launchedAt: null,
  modifiedAt: '2026-11-12T00:00:00.000Z',
  pilotes: [],
  ...overrides,
});

const PREMIER_GROUPE = demarche({
  id: 1,
  titre: 'PCAET réglementaire 2026',
  collectivitesCouvertes: [
    { id: 11, nom: 'CC Castelnaudary Lauragais Audois' },
    { id: 12, nom: 'CC des Terres du Lauragais' },
  ],
});
const SECOND_GROUPE = demarche({
  id: 2,
  titre: 'PCAET réglementaire 2030',
  collectivitesCouvertes: [{ id: 13, nom: 'CC Lauragais Revel Sorezois' }],
});
const SANS_PERIMETRE = demarche({
  id: 3,
  titre: 'PCAET du Pays Lauragais 2020-2026',
  status: DemarchePcaetStatusEnum.PUBLIE,
});

const renderTable = (demarches: DemarcheListItem[]) =>
  render(
    <DemarchesPcaetTable
      ariaLabel="Démarches PCAET"
      demarches={demarches}
      sort="creation"
      direction="desc"
      trierPar={() => undefined}
      statuts={[]}
      setStatuts={() => undefined}
      statutOptions={[]}
      getDetailUrl={({ id }) => `/demarches/${id}`}
      etatVide={{ title: appLabels.demarcheListeAucunResultat }}
    />
  );

const ligneDe = (texte: string): HTMLElement => {
  const ligne = screen.getByText(texte).closest('tr');
  if (ligne === null) {
    throw new Error(`Aucune ligne ne contient « ${texte} ».`);
  }
  return ligne;
};

describe('DemarchesPcaetTable', () => {
  it('liste sous le titre de chaque dépôt les EPCI qu’il couvre', () => {
    renderTable([PREMIER_GROUPE, SECOND_GROUPE, SANS_PERIMETRE]);

    const premier = within(ligneDe(PREMIER_GROUPE.titre));
    expect(
      premier.getByText(appLabels.demarcheListeResumeCouvertes({ count: 2 }))
    ).toBeInTheDocument();
    expect(
      premier.getByText('CC Castelnaudary Lauragais Audois')
    ).toBeInTheDocument();
    expect(premier.getByText('CC des Terres du Lauragais')).toBeInTheDocument();
    expect(
      premier.queryByText('CC Lauragais Revel Sorezois')
    ).not.toBeInTheDocument();
    expect(
      within(ligneDe(SECOND_GROUPE.titre)).getByText(
        'CC Lauragais Revel Sorezois'
      )
    ).toBeInTheDocument();
    // Un EPCI couvert n'est pas une ligne : le tableau garde une ligne par dépôt.
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(premier.getAllByRole('link')).toHaveLength(1);
  });

  it('replie un dépôt en gardant son décompte', () => {
    renderTable([PREMIER_GROUPE, SECOND_GROUPE, SANS_PERIMETRE]);

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.demarcheListeReplierGroupe({
          titre: PREMIER_GROUPE.titre,
        }),
      })
    );
    expect(
      screen.queryByText('CC Castelnaudary Lauragais Audois')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(appLabels.demarcheListeResumeCouvertes({ count: 2 }))
    ).toBeInTheDocument();
    expect(screen.getByText('CC Lauragais Revel Sorezois')).toBeInTheDocument();
  });

  it('garde replié un dépôt archivé tant qu’on ne le déplie pas', () => {
    const archive = demarche({
      ...SECOND_GROUPE,
      status: DemarchePcaetStatusEnum.ARCHIVE,
    });
    renderTable([PREMIER_GROUPE, archive]);

    expect(
      screen.queryByText('CC Lauragais Revel Sorezois')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('CC Castelnaudary Lauragais Audois')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.demarcheListeDeplierGroupe({ titre: archive.titre }),
      })
    );
    expect(screen.getByText('CC Lauragais Revel Sorezois')).toBeInTheDocument();
  });

  it('sans dépôt groupé, aucun chevron', () => {
    renderTable([SANS_PERIMETRE]);

    expect(
      screen.queryByRole('button', { expanded: true })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
