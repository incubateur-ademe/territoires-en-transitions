import { describe, expect, it } from 'vitest';
import { classifyGridRows } from './classify-grid-rows';
import { detectTableHeader } from './detect-table-header';
import {
  isNumberedHeading,
  isOrganisationLike,
  parseAmount,
  parseDateValue,
  profileColumns,
  readColumnBlocks,
  readGridValues,
  splitSegments,
  yearsIn,
} from './profile-columns';
import { buildTextGrid } from './sheet-grid';

describe('parseAmount', () => {
  it.each([
    ['3000000', 3000000],
    ['12 000 €', 12000],
    ['1,5 k€', 1500],
    ['39 182,50€ HT', 39182.5],
    ['1.234,5', 1234.5],
    ['1,2 M€', 1200000],
    ['3 millions d’euros', 3000000],
    ['15 k€', 15000],
  ])('lit « %s »', (value, amount) => {
    expect(parseAmount(value)).toBe(amount);
  });

  it('ne lit pas un texte', () => {
    expect(parseAmount('50 % Région')).toBeNull();
    expect(parseAmount('à chiffrer')).toBeNull();
  });
});

describe('yearsIn', () => {
  it('relève chaque année citée', () => {
    expect(yearsIn('2025-2027')).toEqual([2025, 2027]);
    expect(yearsIn('Fin 2026')).toEqual([2026]);
    expect(yearsIn('12 000 €')).toEqual([]);
  });
});

describe('parseDateValue', () => {
  it('lit une date Excel et une date française', () => {
    expect(parseDateValue('2025-08-08T00:00:00.000Z')).toBe('2025-08-08');
    expect(parseDateValue('1/9/2025')).toBe('2025-09-01');
  });

  it('ne lit un numéro de série qu’à la demande', () => {
    expect(parseDateValue('47727')).toBeNull();
    expect(parseDateValue('47727', { serial: true })).toBe('2030-09-01');
  });
});

describe('isOrganisationLike', () => {
  it('reconnaît sigles, « / » et noms d’organismes', () => {
    expect(isOrganisationLike('CCPG')).toBe(true);
    expect(isOrganisationLike('Région / Interco')).toBe(true);
    expect(isOrganisationLike('Syndicat des eaux')).toBe(true);
    expect(isOrganisationLike('à définir')).toBe(true);
  });

  it('ne prend pas un intitulé en minuscules pour un sigle', () => {
    expect(isOrganisationLike('Champ texte')).toBe(false);
    expect(isOrganisationLike('Mettre en place un cadastre solaire')).toBe(
      false
    );
  });
});

describe('isNumberedHeading', () => {
  it.each([
    'Axe 1. COORDINATION DU CLS',
    'AMBITION n°2 : Pour un territoire préservé',
    'Objectif stratégique 3. Attractivité du territoire',
    '1.2 – Rénover le parc privé',
  ])('reconnaît « %s »', (value) => {
    expect(isNumberedHeading(value)).toBe(true);
  });

  it('ne prend pas un pilote pour un intitulé numéroté', () => {
    expect(isNumberedHeading('CCPG / Région')).toBe(false);
  });
});

describe('profileColumns', () => {
  const grid = buildTextGrid('Plan', [
    ['Axe', 'Action', 'Porteur', 'Statut'],
    ['Mobilité', 'Créer une ligne de bus express', 'Interco', 'En cours'],
    ['', 'Aménager des aires de covoiturage', 'Commune', 'À venir'],
    ['Habitat', 'Ouvrir un guichet unique', 'Interco', 'En cours'],
    ['', 'Former les artisans', 'CMA', 'Terminée'],
    ['', 'Repérer les logements indignes', 'Commune', 'En cours'],
  ]);
  const header = detectTableHeader(grid);
  const rows = classifyGridRows(grid, header);
  const valueAt = readGridValues(grid, rows);

  it('reporte vers le bas une case de tête vide, comme un CSV le demande', () => {
    expect(valueAt(3, 1)).toBe('Mobilité');
    expect(valueAt(6, 1)).toBe('Habitat');
  });

  it('mesure blocs, cardinalité et types de valeurs', () => {
    const [axe, action, porteur, statut] = profileColumns(
      grid,
      rows,
      header?.labels ?? [],
      valueAt
    );

    expect(axe).toMatchObject({
      blocks: [
        { rows: [2, 3], value: 'Mobilité', merged: false },
        { rows: [4, 5, 6], value: 'Habitat', merged: false },
      ],
      distinctRatio: 1,
      runsRatio: 0.4,
    });
    expect(action).toMatchObject({ runsRatio: 1, distinctValues: 5 });
    expect(porteur.organisationShare).toBe(1);
    expect(statut.statutShare).toBe(1);
  });

  it('coupe un bloc répété au changement d’un regroupement à sa gauche', () => {
    const homonyms = buildTextGrid('Plan', [
      ['Objectif', 'Fiche'],
      ['Limiter les ressources', 'Monter en compétence'],
      ['Accompagner les entreprises', 'Monter en compétence'],
    ]);
    const homonymRows = classifyGridRows(homonyms, detectTableHeader(homonyms));
    const read = readGridValues(homonyms, homonymRows);
    const segments = splitSegments(homonymRows);

    expect(readColumnBlocks(homonyms, segments, 2, read)).toHaveLength(1);
    expect(readColumnBlocks(homonyms, segments, 2, read, [1])).toHaveLength(2);
  });
});
