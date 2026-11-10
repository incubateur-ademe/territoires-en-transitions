import { failure, Result, success } from '@tet/backend/utils/result.type';
import { parquetMetadata, parquetRead } from 'hyparquet';
import { Snbc3Territoire } from './build-snbc3-valeurs';

/** Seules colonnes lues : le contrat est `docs/resultats_territorialises.md` de `snbc3`. */
export const SNBC3_COLUMNS = [
  'code_epci',
  'niveau_geo',
  'zone',
  'code_traj_supra',
  'annee',
  'valeur_recalee',
  'qualite',
] as const;

type Snbc3Column = (typeof SNBC3_COLUMNS)[number];

/**
 * Types physiques attendus des colonnes lues : chaînes en `BYTE_ARRAY`, année
 * entière (lue par `Number`, 32 ou 64 bits), valeur en flottant 64 bits.
 */
const SNBC3_COLUMN_TYPES: Record<Snbc3Column, readonly string[]> = {
  code_epci: ['BYTE_ARRAY'],
  niveau_geo: ['BYTE_ARRAY'],
  zone: ['BYTE_ARRAY'],
  code_traj_supra: ['BYTE_ARRAY'],
  annee: ['INT64', 'INT32'],
  valeur_recalee: ['DOUBLE'],
  qualite: ['BYTE_ARRAY'],
};

/**
 * Lignes décodées à la fois. hyparquet décode un groupe de lignes d'un bloc,
 * et la release V2.1 n'en a que 3, de ~860 000 lignes : on lit par tranches, pour éviter
 * un pic mémoire trop important.
 */
const SLICE_ROWS = 100_000;

export type ReadSnbc3ParquetError = {
  error: 'SNBC3_PARQUET_SCHEMA_INVALID';
  /** Écart au contrat, pour les logs. */
  message: string;
};

export type Snbc3TerritoireSummary = Omit<Snbc3Territoire, 'rows'>;

/**
 * Contenu du parquet en colonnes typées pour limiter l'occupation mémoire lors
 * de la lecture : les lignes d'un territoire ne sont matérialisées qu'au moment
 * de le traiter (`getTerritoire`).
 */
export class Snbc3ParquetTable {
  constructor(
    readonly territoires: readonly Snbc3TerritoireSummary[],
    private readonly rowIndexes: readonly number[][],
    private readonly codes: readonly string[],
    private readonly qualites: readonly string[],
    private readonly codeIndexes: Uint8Array,
    private readonly qualiteIndexes: Uint8Array,
    private readonly annees: Int16Array,
    /** `NaN` pour une valeur inconnue. */
    private readonly valeurs: Float64Array
  ) {}

  getTerritoire(index: number): Snbc3Territoire {
    return {
      ...this.territoires[index],
      rows: this.rowIndexes[index].map((i) => ({
        code: this.codes[this.codeIndexes[i]],
        annee: this.annees[i],
        valeur: Number.isNaN(this.valeurs[i]) ? null : this.valeurs[i],
        qualite: this.qualites[this.qualiteIndexes[i]],
      })),
    };
  }
}

/** Index stockés sur un octet : 66 codes et 5 qualités dans le contrat actuel. */
const DICTIONARY_MAX_SIZE = 256;

/**
 * Index d'une chaîne dans un dictionnaire construit au fil de la lecture.
 * `null` quand le dictionnaire est plein : le parquet sort du contrat.
 */
const dictionary = () => {
  const values: string[] = [];
  const indexes = new Map<string, number>();
  return {
    values,
    indexOf(value: string): number | null {
      let index = indexes.get(value);
      if (index === undefined) {
        if (values.length >= DICTIONARY_MAX_SIZE) return null;
        index = values.length;
        indexes.set(value, index);
        values.push(value);
      }
      return index;
    },
  };
};

/** Lit `resultats_territorialises.parquet` et regroupe ses lignes par territoire. */
export async function readSnbc3Parquet(
  parquet: Uint8Array
): Promise<Result<Snbc3ParquetTable, ReadSnbc3ParquetError>> {
  // hyparquet lit un ArrayBuffer : pas de copie quand la vue le couvre en entier.
  const file = (
    parquet.byteOffset === 0 && parquet.byteLength === parquet.buffer.byteLength
      ? parquet.buffer
      : parquet.buffer.slice(
          parquet.byteOffset,
          parquet.byteOffset + parquet.byteLength
        )
  ) as ArrayBuffer;
  const metadata = parquetMetadata(file);
  const columns = new Set(metadata.schema.map(({ name }) => name));
  const missingColumns = SNBC3_COLUMNS.filter((c) => !columns.has(c));
  if (missingColumns.length) {
    return failure({
      error: 'SNBC3_PARQUET_SCHEMA_INVALID',
      message: `colonnes manquantes : ${missingColumns.join(', ')}`,
    });
  }
  const wrongTypes = metadata.schema.flatMap(({ name, type }) => {
    const expected = SNBC3_COLUMN_TYPES[name as Snbc3Column] as
      | readonly string[]
      | undefined;
    return expected && !(type && expected.includes(type))
      ? [`${name} en ${type ?? 'groupe'} au lieu de ${expected.join(' ou ')}`]
      : [];
  });
  if (wrongTypes.length) {
    return failure({
      error: 'SNBC3_PARQUET_SCHEMA_INVALID',
      message: `types inattendus : ${wrongTypes.join(', ')}`,
    });
  }

  const rowCount = Number(metadata.num_rows);
  const codeIndexes = new Uint8Array(rowCount);
  const qualiteIndexes = new Uint8Array(rowCount);
  const annees = new Int16Array(rowCount);
  const valeurs = new Float64Array(rowCount);
  const codes = dictionary();
  const qualites = dictionary();
  /** Colonne dont le dictionnaire a débordé : la lecture s'arrête. */
  let overflowColumn = null as string | null;
  const territoires: Snbc3TerritoireSummary[] = [];
  const rowIndexes: number[][] = [];
  const territoireIndexes = new Map<string, number>();

  for (let rowStart = 0; rowStart < rowCount; rowStart += SLICE_ROWS) {
    const rowEnd = Math.min(rowCount, rowStart + SLICE_ROWS);
    await parquetRead({
      file,
      metadata,
      columns: [...SNBC3_COLUMNS],
      rowStart,
      rowEnd,
      rowFormat: 'array',
      onComplete: (rows) => {
        for (const [offset, row] of rows.entries()) {
          const [codeEpci, niveauGeo, zone, code, annee, valeur, qualite] =
            row as [
              string,
              string,
              string,
              string,
              bigint,
              number | null,
              string
            ];
          const i = rowStart + offset;
          let territoireIndex = territoireIndexes.get(codeEpci);
          if (territoireIndex === undefined) {
            territoireIndex = territoires.length;
            territoireIndexes.set(codeEpci, territoireIndex);
            territoires.push({ code: codeEpci, niveauGeo, zone });
            rowIndexes.push([]);
          }
          const codeIndex = codes.indexOf(code);
          const qualiteIndex = qualites.indexOf(qualite);
          if (codeIndex === null || qualiteIndex === null) {
            overflowColumn = codeIndex === null ? 'code_traj_supra' : 'qualite';
            return;
          }
          rowIndexes[territoireIndex].push(i);
          codeIndexes[i] = codeIndex;
          qualiteIndexes[i] = qualiteIndex;
          annees[i] = Number(annee);
          valeurs[i] = valeur ?? Number.NaN;
        }
      },
    });
    if (overflowColumn) {
      return failure({
        error: 'SNBC3_PARQUET_SCHEMA_INVALID',
        message: `plus de ${DICTIONARY_MAX_SIZE} valeurs distinctes dans ${overflowColumn}`,
      });
    }
  }

  return success(
    new Snbc3ParquetTable(
      territoires,
      rowIndexes,
      codes.values,
      qualites.values,
      codeIndexes,
      qualiteIndexes,
      annees,
      valeurs
    )
  );
}
