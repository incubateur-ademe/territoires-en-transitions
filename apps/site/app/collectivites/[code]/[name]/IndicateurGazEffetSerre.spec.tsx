import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IndicateurGazEffetSerre from './IndicateurGazEffetSerre';

const { renderCard } = vi.hoisted(() => ({ renderCard: vi.fn() }));

vi.mock('./IndicateurCard', () => ({
  default: (props: { graphTitle: string }) => {
    renderCard(props);
    return <div>{props.graphTitle}</div>;
  },
}));

type Props = ComponentProps<typeof IndicateurGazEffetSerre>;
type Indicateur = NonNullable<Props['data']>[number];

const defaultData = {
  titre: 'Gaz à effet de serre',
  description: 'Description',
  titre_encadre: 'tCO2e',
  description_encadre: 'Description encadrée',
  illustration_encadre: {},
} as NonNullable<Props['defaultData']>;

const makeIndicateur = (overrides: Partial<Indicateur> = {}): Indicateur => ({
  date_valeur: '2026-01-01',
  resultat: 10,
  identifiant: 'cae_1.c',
  periodicite: 'annuelle',
  source: 'CITEPA',
  ...overrides,
});

describe('IndicateurGazEffetSerre', () => {
  beforeEach(() => renderCard.mockReset());

  it('affiche uniquement les secteurs CITEPA de la dernière année annuelle', () => {
    renderToStaticMarkup(
      <IndicateurGazEffetSerre
        defaultData={defaultData}
        data={[
          makeIndicateur({ date_valeur: '2025-01-01', resultat: 1 }),
          makeIndicateur({ resultat: 12 }),
          makeIndicateur({ identifiant: 'cae_1.d', resultat: 8 }),
          makeIndicateur({ identifiant: 'cae_1.a', resultat: 20 }),
        ]}
      />
    );

    expect(renderCard).toHaveBeenCalledOnce();
    expect(renderCard).toHaveBeenCalledWith(
      expect.objectContaining({
        graphTitle: expect.stringContaining('2026'),
        data: [
          { id: 'Résidentiel', value: 12 },
          { id: 'Tertiaire', value: 8 },
        ],
        boxTitle: '20 tCO2e',
      })
    );
  });

  it('échoue fermé si la vue annuelle reçoit une définition mensuelle', () => {
    expect(() =>
      renderToStaticMarkup(
        <IndicateurGazEffetSerre
          defaultData={defaultData}
          data={[makeIndicateur({ periodicite: 'mensuelle' })]}
        />
      )
    ).toThrow(/publication GES.*annuelle.*mensuelle/i);
  });
});
