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
  it('montre sous chaque dépôt les EPCI qu’il couvre', () => {
    renderTable([PREMIER_GROUPE, SECOND_GROUPE, SANS_PERIMETRE]);

    const lignes = screen.getAllByRole('row').map((row) => row.textContent);
    const indexDe = (texte: string) =>
      lignes.findIndex((ligne) => ligne?.includes(texte));

    expect(indexDe('CC Castelnaudary Lauragais Audois')).toBe(
      indexDe('PCAET réglementaire 2026') + 1
    );
    expect(indexDe('CC des Terres du Lauragais')).toBe(
      indexDe('PCAET réglementaire 2026') + 2
    );
    expect(indexDe('CC Lauragais Revel Sorezois')).toBe(
      indexDe('PCAET réglementaire 2030') + 1
    );
    expect(
      within(ligneDe('CC Lauragais Revel Sorezois')).queryByRole('link')
    ).toBeNull();
  });

  it('replie un dépôt, puis tous', () => {
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
    expect(screen.getByText('CC Lauragais Revel Sorezois')).toBeInTheDocument();

    // Un groupe replié : le bouton propose de tout déplier.
    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.instructionListeToutDeplier,
      })
    );
    expect(
      screen.getByText('CC Castelnaudary Lauragais Audois')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.instructionListeToutReplier,
      })
    );
    expect(
      screen.queryByText('CC Castelnaudary Lauragais Audois')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('CC Lauragais Revel Sorezois')
    ).not.toBeInTheDocument();
  });

  it('sans dépôt groupé, ni chevron ni bouton pour tout replier', () => {
    renderTable([SANS_PERIMETRE]);

    expect(
      screen.queryByRole('button', {
        name: appLabels.instructionListeToutReplier,
      })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
