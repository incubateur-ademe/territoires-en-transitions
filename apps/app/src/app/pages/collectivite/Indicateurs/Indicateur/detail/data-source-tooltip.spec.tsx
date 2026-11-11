import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import { DataSourceTooltipContent } from './DataSourceTooltip';

const metadonnee = (sourceId: string, methodologie: string | null) => ({
  id: 1,
  sourceId,
  dateVersion: '2026-11-01',
  nomDonnees: sourceId.toUpperCase(),
  diffuseur: 'ADEME',
  producteur: 'ADEME',
  methodologie,
  limites: null,
});

describe('DataSourceTooltipContent', () => {
  test('SNBC 3 : affiche l’action fournie (bouton de téléchargement du tableau)', () => {
    render(
      <DataSourceTooltipContent
        metadonnee={metadonnee('snbc3', null)}
        nomSource="SNBC3"
        calculAuto={false}
        methodologieSnbc3={<button type="button">{'télécharger'}</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'télécharger' })).toBeTruthy();
    expect(
      screen.queryByText(appLabels.indicateurMethodologieSnbc3Texte)
    ).toBeNull();
  });

  test('SNBC 3 : sans action (graphe), affiche le texte statique', () => {
    render(
      <DataSourceTooltipContent
        metadonnee={metadonnee('snbc3', null)}
        nomSource="SNBC3"
        calculAuto={false}
      />
    );
    expect(
      screen.getByText(appLabels.indicateurMethodologieSnbc3Texte, {
        exact: false,
      })
    ).toBeTruthy();
  });

  test('SNBC 3 : un total calculé garde le message « calculé automatiquement »', () => {
    render(
      <DataSourceTooltipContent
        metadonnee={metadonnee('snbc3', null)}
        nomSource="SNBC3"
        calculAuto
        methodologieSnbc3={<button type="button">{'télécharger'}</button>}
      />
    );
    expect(
      screen.getByText(appLabels.indicateurCalculeAutomatiquementMessage, {
        exact: false,
      })
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('une autre source sans méthodologie n’affiche pas la ligne', () => {
    render(
      <DataSourceTooltipContent
        metadonnee={metadonnee('aldo', null)}
        nomSource="ALDO"
        calculAuto
      />
    );
    expect(
      screen.queryByText(appLabels.methodologiePerimetreLabel, {
        exact: false,
      })
    ).toBeNull();
  });
});
