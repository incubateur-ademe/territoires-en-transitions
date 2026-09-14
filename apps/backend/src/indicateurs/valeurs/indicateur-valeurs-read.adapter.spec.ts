import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeursBySource,
} from './indicateur-valeurs-read.adapter';
import { indicateur1 } from './tests/fixture';

function row(
  id: number,
  dateValeur: string,
  dateVersion = '2026-01-01'
): IndicateurValeurAvecMetadonnesDefinition {
  return {
    indicateurDefinition: {
      ...indicateur1,
      version: '1.0.0',
      collectiviteId: null,
      groupementId: null,
      titreCourt: null,
      precision: 2,
      participationScore: false,
      sansValeurUtilisateur: false,
      valeurCalcule: null,
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
      createdAt: '2026-01-01',
      modifiedAt: '2026-01-01',
      createdBy: null,
      modifiedBy: null,
    },
    confidentiel: false,
    indicateurValeur: {
      id,
      collectiviteId: 42,
      indicateurId: indicateur1.id,
      periodicite: 'annuelle',
      dateValeur,
      resultat: 0,
      objectif: 100,
      resultatCommentaire: null,
      objectifCommentaire: null,
      metadonneeId: id,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
      estimation: null,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
      createdBy: null,
      modifiedBy: null,
    },
    indicateurSourceMetadonnee: {
      id,
      sourceId: 'test',
      dateVersion,
      nomDonnees: null,
      diffuseur: null,
      producteur: null,
      methodologie: null,
      limites: null,
    },
  };
}

describe('Historical annual values', () => {
  it('retains distinct original dates in the same year without normalization or aggregation', () => {
    const rows = [row(1, '2025-12-31'), row(2, '2025-06-15')];
    const values = deduplicateIndicateurValeursBySource(rows);
    expect(values).toEqual(rows);
    const grouped = groupIndicateurValeursBySource(
      values.map((v) => v.indicateurValeur),
      [indicateur1],
      values.flatMap((v) =>
        v.indicateurSourceMetadonnee ? [v.indicateurSourceMetadonnee] : []
      ),
      []
    );
    expect(
      grouped[0].sources.test.valeurs.map(({ dateValeur, resultat }) => ({
        dateValeur,
        resultat,
      }))
    ).toEqual([
      { dateValeur: '2025-06-15', resultat: 0 },
      { dateValeur: '2025-12-31', resultat: 0 },
    ]);
  });

  it('keeps the first value when source versions are identical', () => {
    const first = row(1, '2025-06-15');
    expect(
      deduplicateIndicateurValeursBySource([first, row(2, '2025-06-15')])
    ).toEqual([first]);
  });

  it('replaces a duplicate only when its source version is more recent', () => {
    const latest = row(2, '2025-06-15', '2026-02-01');
    expect(
      deduplicateIndicateurValeursBySource([row(1, '2025-06-15'), latest])
    ).toEqual([latest]);
  });
});
