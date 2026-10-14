import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndicateurValeursTableSourceRow } from './indicateur-valeurs-table-source.row';

afterEach(cleanup);

const renderEmptySource = (source: string, readonly: boolean) =>
  render(
    <table>
      <tbody>
        <IndicateurValeursTableSourceRow
          row={{
            key: source,
            source: {
              source,
              libelle: source,
              ordreAffichage: 0,
              metadonnees: [],
              calculAuto: false,
              type: 'resultat',
              valeurs: [],
            },
          }}
          periodes={[IndicateurPeriodes.fromYear(2020)]}
          readonly={readonly}
          showAddPeriodeColumn={false}
          getColorBySourceId={() => 'blue'}
          onSave={vi.fn()}
        />
      </tbody>
    </table>
  );

describe('IndicateurValeursTableSourceRow — données manquantes', () => {
  it.each([false, true])(
    'signale une donnée ouverte indisponible sans proposer de saisie (lecture seule : %s)',
    (readonly) => {
      renderEmptySource('insee', readonly);

      expect(
        screen.getByRole('cell', { name: 'Donnée indisponible' })
      ).toBeTruthy();
      expect(screen.queryByText('Non renseigné')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
    }
  );

  it('conserve le libellé de saisie pour les données de la collectivité en lecture seule', () => {
    renderEmptySource('collectivite', true);

    expect(screen.getByRole('cell', { name: 'Non renseigné' })).toBeTruthy();
    expect(screen.queryByText('Donnée indisponible')).toBeNull();
  });

  it('permet toujours de renseigner les données de la collectivité', () => {
    renderEmptySource('collectivite', false);

    expect(
      screen.getByRole('button', { name: 'Ajouter une donnée' })
    ).toBeTruthy();
    expect(screen.queryByText('Donnée indisponible')).toBeNull();
  });
});
