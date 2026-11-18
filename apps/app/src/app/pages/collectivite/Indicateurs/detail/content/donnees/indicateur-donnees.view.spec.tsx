import type { SousIndicateursTableState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-state.rules';
import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from '../../context/indicateur-actions.context';
import { IndicateurChartProvider } from '../../context/indicateur-chart.context';
import { IndicateurDataProvider } from '../../context/indicateur-data.context';
import { IndicateurSousIndicateursTableProvider } from '../../context/indicateur-sous-indicateurs-table.context';
import { IndicateurDonnees } from './indicateur-donnees.view';

vi.mock('../../../Indicateur/detail/IndicateurDetailChart', () => ({
  default: ({ isReadonly }: { isReadonly: boolean }) => (
    <div role="img" aria-label="graphique" data-readonly={isReadonly} />
  ),
}));
vi.mock('../../../Indicateur/detail/IndicateurValuesTabs', () => ({
  IndicateurValuesTabs: () => <div role="group" aria-label="valeurs" />,
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
  IndicateurUniteInput: () => null,
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
}: {
  collectiviteId: number | null;
  enfants: { id: number; titre: string }[];
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
  } as IndicateurDetaille);

const renderDonnees = (indicateur: IndicateurDetaille) => {
  const useSousIndicateursTable = vi.fn(() => readyState);
  render(
    <IndicateurDataProvider
      value={{ indicateur, canMutateIndicateur: true, canMutateValeur: true }}
    >
      <IndicateurChartProvider value={{ chartInfo }}>
        <IndicateurActionsProvider value={actions}>
          <IndicateurSousIndicateursTableProvider
            value={{ useSousIndicateursTable }}
          >
            <IndicateurDonnees />
          </IndicateurSousIndicateursTableProvider>
        </IndicateurActionsProvider>
      </IndicateurChartProvider>
    </IndicateurDataProvider>
  );
  return { useSousIndicateursTable };
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
