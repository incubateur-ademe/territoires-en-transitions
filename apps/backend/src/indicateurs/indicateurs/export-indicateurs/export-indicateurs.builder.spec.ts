import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import { IndicateurValeurAvecMetadonnesDefinition } from '../../valeurs/indicateur-valeur.table';
import { buildConsolidatedSheet } from './export-indicateurs.builder';

/**
 * Construit une valeur minimale pour le builder : seuls `dateValeur`,
 * `resultat`, `objectif`, l'id de définition et la source sont lus.
 */
function makeValeur(params: {
  indicateurId: number;
  annee: number;
  resultat?: number | null;
  objectif?: number | null;
  sourceId?: string;
}): IndicateurValeurAvecMetadonnesDefinition {
  const { indicateurId, annee, resultat, objectif, sourceId } = params;
  return {
    indicateur_valeur: {
      dateValeur: `${annee}-01-01`,
      resultat: resultat ?? null,
      objectif: objectif ?? null,
    },
    indicateur_definition: { id: indicateurId },
    indicateur_source_metadonnee: sourceId
      ? { id: 1, sourceId, dateVersion: `${annee}-01-01` }
      : null,
  } as unknown as IndicateurValeurAvecMetadonnesDefinition;
}

const parent = {
  id: 1,
  identifiantReferentiel: 'cae_1',
  titre: 'Indicateur test',
  unite: 'kg',
  pilotes: [],
  services: [],
  commentaire: 'Commentaire collectivité',
  enfants: [],
};

const SOURCE_COL = 8; // colonne "Source" (après les 7 colonnes fixes)

function getSheet(valeurs: IndicateurValeurAvecMetadonnesDefinition[]) {
  const workbook = new Workbook();
  buildConsolidatedSheet(
    workbook,
    [parent],
    valeurs,
    new Map([['rare', 'RARE']])
  );
  const ws = workbook.getWorksheet(1);
  if (!ws) throw new Error('Worksheet not found');
  return ws;
}

describe('buildConsolidatedSheet — sources open-data', () => {
  it('ajoute une ligne par source open-data en plus de la ligne collectivité', () => {
    const ws = getSheet([
      // saisie collectivité
      makeValeur({ indicateurId: 1, annee: 2022, resultat: 100, objectif: 120 }),
      // open-data (source "rare")
      makeValeur({
        indicateurId: 1,
        annee: 2022,
        resultat: 90,
        sourceId: 'rare',
      }),
    ]);

    // 1 en-tête + 1 ligne collectivité + 1 ligne open-data
    expect(ws.rowCount).toBe(3);

    const collectiviteRow = ws.getRow(2).values as unknown[];
    expect(collectiviteRow[SOURCE_COL]).toBe('Collectivité');
    expect(collectiviteRow[7]).toBe('Commentaire collectivité');

    const openDataRow = ws.getRow(3).values as unknown[];
    // Le libellé lisible de la source remplace l'identifiant technique.
    expect(openDataRow[SOURCE_COL]).toBe('RARE');
    // Les métadonnées (commentaire, pilote…) ne concernent que la collectivité.
    expect(openDataRow[7]).toBe('');
  });

  it('inclut les années présentes uniquement en open-data dans les colonnes', () => {
    const ws = getSheet([
      makeValeur({ indicateurId: 1, annee: 2020, resultat: 10 }),
      makeValeur({
        indicateurId: 1,
        annee: 2030,
        resultat: 42,
        objectif: 50,
        sourceId: 'rare',
      }),
    ]);

    const headerValues = ws.getRow(1).values as unknown[];
    // Libellé : année en premier.
    expect(headerValues).toContain('2020 Résultat');
    expect(headerValues).toContain('2030 Résultat');
    expect(headerValues).toContain('2030 Objectif');
  });

  it("ne crée pas de colonne pour un type/année sans aucune valeur", () => {
    const ws = getSheet([
      // Uniquement des résultats (aucun objectif nulle part) → aucune colonne Objectif.
      makeValeur({ indicateurId: 1, annee: 2020, resultat: 10 }),
      makeValeur({ indicateurId: 1, annee: 2021, resultat: 20 }),
    ]);

    const headerValues = (ws.getRow(1).values as unknown[]).filter(
      (v) => typeof v === 'string'
    ) as string[];
    expect(headerValues).toContain('2020 Résultat');
    expect(headerValues).toContain('2021 Résultat');
    expect(headerValues.some((h) => h.includes('Objectif'))).toBe(false);
  });

  it("n'ajoute aucune ligne open-data quand il n'y en a pas", () => {
    const ws = getSheet([
      makeValeur({ indicateurId: 1, annee: 2022, resultat: 100 }),
    ]);

    // 1 en-tête + 1 ligne collectivité uniquement
    expect(ws.rowCount).toBe(2);
    expect((ws.getRow(2).values as unknown[])[SOURCE_COL]).toBe('Collectivité');
  });
});
