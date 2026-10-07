import { describe, expect, it } from 'vitest';
import { buildPage } from '../document/document-page';
import { normalizePages } from './normalize-pages';

const pageOf = (index: number, ...texts: string[]) =>
  buildPage(
    index,
    texts.map((text) => ({ text }))
  );

describe('normalizePages', () => {
  it('remplace les ligatures et les espaces insécables', () => {
    const [page] = normalizePages([
      pageOf(0, 'Ef\uFB01cacité\u00A0énergétique'),
    ]);

    expect(page.text).toBe('Efficacité énergétique');
  });

  it('recolle un mot coupé en fin de ligne, pas un tiret de liste', () => {
    const [page] = normalizePages([
      pageOf(0, 'Le dévelop-', 'pement durable', '- Saint-', 'Martin'),
    ]);

    expect(page.lines.map((line) => line.text)).toEqual([
      'Le développement durable',
      '- Saint-',
      'Martin',
    ]);
  });

  it('retire les en-têtes et pieds répétés et les numéros de page', () => {
    const pages = Array.from({ length: 6 }, (_, index) =>
      pageOf(
        index,
        'PCAET Communauté de communes – Programme d’actions',
        `Action ${index + 1} : contenu`,
        `Page ${index + 1} / 6`
      )
    );

    const normalized = normalizePages(pages);

    expect(normalized[2].lines.map((line) => line.text)).toEqual([
      'Action 3 : contenu',
    ]);
  });

  it('garde les lignes qui ne se répètent pas', () => {
    const titres = [
      'Isoler',
      'Planter',
      'Rouler',
      'Trier',
      'Chauffer',
      'Éclairer',
    ];
    const pages = titres.map((titre, index) =>
      pageOf(index, `Fiche ${titre}`, `Contenu ${titre}`)
    );

    expect(normalizePages(pages)[0].lines).toHaveLength(2);
  });

  it('ne prend pas pour un pied de page une ligne répétée hors de la marge', () => {
    const pages = Array.from({ length: 6 }, (_, index) =>
      buildPage(
        index,
        [
          { text: `Action ${index + 1}`, y: 100 },
          { text: 'Indicateurs de suivi :', y: 400 },
        ],
        { height: 800 }
      )
    );

    expect(normalizePages(pages)[0].lines).toHaveLength(2);
  });

  it('laisse une page vide telle quelle', () => {
    const empty = pageOf(0);

    expect(normalizePages([empty])[0]).toBe(empty);
  });
});
