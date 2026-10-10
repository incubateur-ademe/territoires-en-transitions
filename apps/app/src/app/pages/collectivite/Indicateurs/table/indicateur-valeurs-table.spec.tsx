import { render, screen } from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PreparedData } from '../data/prepare-data';
import { IndicateurValeursTable } from './indicateur-valeurs-table';

vi.mock('@/app/indicateurs/valeurs/use-upsert-indicateur-valeur', () => ({
  useUpsertIndicateurValeur: () => ({ mutate: vi.fn() }),
}));

vi.mock('../data/use-delete-indicateur-valeur', () => ({
  useDeleteIndicateurValeur: () => ({ mutate: vi.fn() }),
}));

vi.mock('../data/use-indicateur-sources', () => ({
  useGetColorBySourceId: () => () => '#000091',
}));

describe('IndicateurValeursTable', () => {
  it('associe chaque valeur à son mois exact, y compris zéro', () => {
    const january = IndicateurPeriods.parse('mensuelle', '2026-01');
    const february = IndicateurPeriods.parse('mensuelle', '2026-02');
    const source = {
      source: 'collectivite',
      libelle: '',
      ordreAffichage: -1,
      calculAuto: false,
      metadonnees: [],
      type: 'resultat',
      valeurs: [
        {
          id: 1,
          calculAuto: false,
          periode: january,
          periodeLabel: 'janvier 2026',
          dateValeurISO: '2026-01-01T00:00:00.000Z',
          valeur: 0,
          commentaire: null,
        },
        {
          id: 2,
          calculAuto: false,
          periode: february,
          periodeLabel: 'février 2026',
          dateValeurISO: '2026-02-01T00:00:00.000Z',
          valeur: 12,
          commentaire: null,
        },
      ],
    };
    const data = {
      indicateurId: 1,
      dernierePeriodeModePrive: february,
      periodes: [january, february],
      sources: [source],
      donneesCollectivite: source,
      valeursExistantes: [],
    } as unknown as PreparedData;
    const definition = {
      id: 1,
      unite: 't',
      periodicite: 'mensuelle',
    } as ComponentProps<typeof IndicateurValeursTable>['definition'];

    render(
      <IndicateurValeursTable
        collectiviteId={42}
        definition={definition}
        data={data}
        type="resultat"
        readonly
        disableComments
      />
    );

    expect(screen.getByText('janvier 2026')).toBeDefined();
    expect(screen.getByText('février 2026')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
  });
});
