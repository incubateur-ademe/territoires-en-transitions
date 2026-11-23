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
import { IndicateurPredefiniDonnees } from './indicateur-predefini-donnees.view';

vi.mock('../../../Indicateur/detail/IndicateurDetailChart', () => ({
  default: ({ isReadonly }: { isReadonly: boolean }) => (
    <div role="img" aria-label="graphique" data-readonly={isReadonly} />
  ),
}));
vi.mock('../../../Indicateur/detail/IndicateurValuesTabs', () => ({
  IndicateurValuesTabs: () => <div role="group" aria-label="valeurs" />,
}));
vi.mock('../../content/donnees/indicateur-commentaire.input', () => ({
  IndicateurCommentaireInput: () => null,
}));
vi.mock('./indicateur-sources.select', () => ({
  IndicateurSourcesSelect: () => <div role="group" aria-label="sources" />,
}));

const toChartInfo = (sourceCount: number): IndicateurChartInfo =>
  ({
    sourceFilter: {
      availableOptions: Array.from({ length: sourceCount }, (_, id) => id),
    },
    typesSegmentation: [],
  } as unknown as IndicateurChartInfo);

const actions = {
  updateCommentaire: vi.fn(),
} as unknown as IndicateurActionsValue;

const indicateur = {
  id: 10,
  collectiviteId: null,
  identifiantReferentiel: 'cae_1.a',
  groupementId: null,
  titre: 'Émissions',
  unite: 't',
  periodicite: 'annuelle',
  commentaire: '',
  sansValeurUtilisateur: false,
  enfants: [{ id: 11, titre: 'Ménagers' }],
  ancestors: [],
} as unknown as IndicateurDetaille;

const renderDonnees = ({ sourceCount = 1 }: { sourceCount?: number } = {}) =>
  render(
    <IndicateurDataProvider
      value={{
        indicateur,
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurChartProvider value={{ chartInfo: toChartInfo(sourceCount) }}>
        <IndicateurActionsProvider value={actions}>
          <IndicateurPredefiniDonnees />
        </IndicateurActionsProvider>
      </IndicateurChartProvider>
    </IndicateurDataProvider>
  );

describe('IndicateurPredefiniDonnees', () => {
  it("garde le graphique et le tableau de valeurs du parent, même quand l'indicateur a des enfants", () => {
    renderDonnees();

    expect(screen.getByRole('img', { name: 'graphique' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'valeurs' })).toBeDefined();
    expect(
      screen.queryByRole('table', {
        name: appLabels.indicateurSousIndicateursValeurs,
      })
    ).toBeNull();
  });

  it('ne propose ni création de sous-indicateur ni saisie de l’unité', () => {
    renderDonnees();

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeNull();
    expect(screen.queryByRole('textbox', { name: /^Unité/ })).toBeNull();
  });

  it('propose le choix de la source quand plusieurs sources sont disponibles', () => {
    renderDonnees({ sourceCount: 2 });

    expect(screen.getByRole('group', { name: 'sources' })).toBeDefined();
  });

  it('ne propose pas le choix de la source quand une seule source est disponible', () => {
    renderDonnees({ sourceCount: 1 });

    expect(screen.queryByRole('group', { name: 'sources' })).toBeNull();
  });
});
