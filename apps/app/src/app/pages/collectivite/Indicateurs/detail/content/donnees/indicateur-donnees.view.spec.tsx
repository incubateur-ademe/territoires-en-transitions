import type { SousIndicateursTableState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-state.rules';
import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from '../../context/indicateur-actions.context';
import { IndicateurChartProvider } from '../../context/indicateur-chart.context';
import { IndicateurDataProvider } from '../../context/indicateur-data.context';
import { IndicateurNouveauSousIndicateurProvider } from '../../context/indicateur-nouveau-sous-indicateur.context';
import { IndicateurSousIndicateursTableProvider } from '../../context/indicateur-sous-indicateurs-table.context';
import { IndicateurDonnees } from './indicateur-donnees.view';

vi.mock('../../../Indicateur/detail/IndicateurDetailChart', () => ({
  default: ({ isReadonly }: { isReadonly: boolean }) => (
    <div role="img" aria-label="graphique" data-readonly={isReadonly} />
  ),
}));
vi.mock('../../../Indicateur/detail/IndicateurValuesTabs', () => ({
  IndicateurValuesTabs: ({ actions }: { actions?: ReactNode }) => (
    <div role="group" aria-label="valeurs">
      {actions}
    </div>
  ),
}));
vi.mock('./indicateur-sous-indicateurs-chart.view', () => ({
  IndicateurSousIndicateursChart: () => (
    <div role="img" aria-label="graphique des sous-indicateurs" />
  ),
}));
vi.mock('./indicateur-commentaire.input', () => ({
  IndicateurCommentaireInput: () => null,
}));
vi.mock('./indicateur-unite.input', () => ({
  IndicateurUniteInput: ({ parentTitre }: { parentTitre?: string }) => (
    <div role="group" aria-label="unité" data-parent={parentTitre} />
  ),
}));
vi.mock('./thematiques-indicateur.input', () => ({
  ThematiquesIndicateurInput: () => null,
}));

const chartInfo = {
  sourceFilter: { availableOptions: [] },
  typesSegmentation: [],
} as unknown as IndicateurChartInfo;

const actions = {
  updateUnite: vi.fn(),
  updateCommentaire: vi.fn(),
} as unknown as IndicateurActionsValue;

const readyState: SousIndicateursTableState = {
  status: 'ready',
  collectiviteId: 1,
  data: {
    columns: [{ dateValeur: '2022-01-01' }],
    rows: [
      {
        rowKey: '10/11',
        parentRowKey: null,
        isExpandable: false,
        indicateurId: 11,
        label: 'Ménagers',
        color: 'primary-9',
        depth: 0,
        cells: [
          {
            dateValeur: '2022-01-01',
            resultat: { status: 'value', valeur: 5 },
            objectif: { status: 'empty' },
          },
        ],
      },
    ],
    hasTotalRow: true,
    totalCells: [
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'value', valeur: 5 },
        objectif: { status: 'empty' },
      },
    ],
  },
};

const toIndicateur = ({
  collectiviteId,
  enfants,
  ancestors = [],
}: {
  collectiviteId: number | null;
  enfants: { id: number; titre: string }[];
  ancestors?: { id: number; titre: string }[];
}): IndicateurDetaille =>
  ({
    id: 10,
    collectiviteId,
    identifiantReferentiel: null,
    groupementId: null,
    titre: 'Déchets',
    unite: 't',
    periodicite: 'annuelle',
    commentaire: '',
    sansValeurUtilisateur: false,
    enfants,
    ancestors,
  } as IndicateurDetaille);

const renderDonnees = (indicateur: IndicateurDetaille) => {
  const createSousIndicateur = vi.fn();
  const useSousIndicateursTable = vi.fn(() => readyState);
  render(
    <IndicateurDataProvider
      value={{ indicateur, canMutateIndicateur: true, canMutateValeur: true }}
    >
      <IndicateurChartProvider value={{ chartInfo }}>
        <IndicateurActionsProvider value={actions}>
          <IndicateurSousIndicateursTableProvider
            value={{
              useSousIndicateursTable,
              useSaveSousIndicateurValeur: () => vi.fn(),
              useDeclareSousIndicateursPeriodes: () => vi.fn(),
              useDeleteSousIndicateursPeriode: () => vi.fn(),
              useDetachSousIndicateur: () => vi.fn(),
              useCreateSousIndicateur: () => createSousIndicateur,
              useRenameSousIndicateur: () => vi.fn(),
              useUpdateSousIndicateursCumul: () => vi.fn(),
              useIndicateurPeriodeCommentaires: () => ({
                isReady: true,
                commentairesOf: () => ({ resultat: '', objectif: '' }),
                save: vi.fn(),
              }),
            }}
          >
            <IndicateurNouveauSousIndicateurProvider
              value={{
                id: null,
                onCreated: vi.fn(),
                onNameEditingEnd: vi.fn(),
              }}
            >
              <IndicateurDonnees />
            </IndicateurNouveauSousIndicateurProvider>
          </IndicateurSousIndicateursTableProvider>
        </IndicateurActionsProvider>
      </IndicateurChartProvider>
    </IndicateurDataProvider>
  );
  return { useSousIndicateursTable, createSousIndicateur };
};

const sousIndicateursTable = {
  name: appLabels.indicateurSousIndicateursValeurs,
};
const valeursDuParent = { name: 'valeurs' };
const graphiqueDuParent = { name: 'graphique' };
const graphiqueDesSousIndicateurs = { name: 'graphique des sous-indicateurs' };

describe('IndicateurDonnees : tableau des valeurs', () => {
  it('affiche le graphique et le tableau des sous-indicateurs à la place de ceux du parent pour un perso qui a des enfants', () => {
    const { useSousIndicateursTable } = renderDonnees(
      toIndicateur({
        collectiviteId: 1,
        enfants: [{ id: 11, titre: 'Ménagers' }],
      })
    );

    expect(screen.getByRole('table', sousIndicateursTable)).toBeDefined();
    expect(screen.queryByRole('group', valeursDuParent)).toBeNull();
    expect(useSousIndicateursTable).toHaveBeenCalledWith(10);
    expect(screen.getByRole('img', graphiqueDesSousIndicateurs)).toBeDefined();
    expect(screen.queryByRole('img', graphiqueDuParent)).toBeNull();
  });

  it("propose le résultat récent en mode privé sous le tableau des sous-indicateurs d'un perso qui a des enfants", () => {
    renderDonnees(
      toIndicateur({
        collectiviteId: 1,
        enfants: [{ id: 11, titre: 'Ménagers' }],
      })
    );

    expect(
      screen.getByRole('checkbox', { name: 'Résultat récent en mode privé' })
    ).toBeDefined();
  });

  it("propose de créer le premier sous-indicateur sous le tableau d'un perso sans enfant, nommé Sous-indicateur 1", () => {
    const { createSousIndicateur } = renderDonnees(
      toIndicateur({ collectiviteId: 1, enfants: [] })
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    );

    expect(createSousIndicateur).toHaveBeenCalledWith(
      { parentId: 10, titre: 'Sous-indicateur 1' },
      expect.anything()
    );
  });

  it("range la création du premier sous-indicateur avec les valeurs d'un perso sans enfant, comme le fait le tableau des sous-indicateurs", () => {
    renderDonnees(toIndicateur({ collectiviteId: 1, enfants: [] }));

    expect(
      within(screen.getByRole('group', valeursDuParent)).getByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeDefined();
  });

  it('ne propose pas de créer un sous-indicateur pour un indicateur prédéfini', () => {
    renderDonnees(
      toIndicateur({
        collectiviteId: null,
        enfants: [{ id: 11, titre: 'Ménagers' }],
      })
    );

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeNull();
  });

  it("transmet à l'unité le titre du parent le plus proche d'un sous-indicateur", () => {
    renderDonnees(
      toIndicateur({
        collectiviteId: 1,
        enfants: [],
        ancestors: [
          { id: 1, titre: 'Pollution' },
          { id: 2, titre: 'Déchets' },
        ],
      })
    );

    expect(
      screen.getByRole('group', { name: 'unité' }).getAttribute('data-parent')
    ).toBe('Déchets');
  });

  it("ne transmet aucun parent à l'unité d'un perso qui n'est le sous-indicateur d'aucun indicateur", () => {
    renderDonnees(toIndicateur({ collectiviteId: 1, enfants: [] }));

    expect(
      screen.getByRole('group', { name: 'unité' }).hasAttribute('data-parent')
    ).toBe(false);
  });

  it('garde le graphique et le tableau de valeurs du parent pour un perso sans enfant', () => {
    const { useSousIndicateursTable } = renderDonnees(
      toIndicateur({ collectiviteId: 1, enfants: [] })
    );

    expect(screen.getByRole('group', valeursDuParent)).toBeDefined();
    expect(screen.queryByRole('table', sousIndicateursTable)).toBeNull();
    expect(useSousIndicateursTable).not.toHaveBeenCalled();
    expect(screen.getByRole('img', graphiqueDuParent)).toBeDefined();
    expect(screen.queryByRole('img', graphiqueDesSousIndicateurs)).toBeNull();
  });

  it('garde le graphique et le tableau de valeurs du parent pour un indicateur prédéfini qui a des enfants', () => {
    const { useSousIndicateursTable } = renderDonnees(
      toIndicateur({
        collectiviteId: null,
        enfants: [{ id: 11, titre: 'Ménagers' }],
      })
    );

    expect(screen.getByRole('group', valeursDuParent)).toBeDefined();
    expect(screen.queryByRole('table', sousIndicateursTable)).toBeNull();
    expect(useSousIndicateursTable).not.toHaveBeenCalled();
    expect(screen.getByRole('img', graphiqueDuParent)).toBeDefined();
    expect(screen.queryByRole('img', graphiqueDesSousIndicateurs)).toBeNull();
  });
});
