import { success } from '@tet/backend/utils/result.type';
import { createHash, randomBytes } from 'crypto';
import { parquetWriteBuffer } from 'hyparquet-writer';
import {
  Snbc3ArtifactReader,
  Snbc3ReleaseSource,
  SNBC3_MANIFEST_FILE,
  SNBC3_PARQUET_FILE,
} from './snbc3-artifact.reader';
import { SNBC3_MAPPING } from './snbc3-mapping';

export const SNBC3_FIXTURE_ANNEES = [2020, 2021, 2022];
export const SNBC3_CODES = Object.keys(SNBC3_MAPPING);

/**
 * Valeur par défaut d'un code, en MtCO2e ou TWh : (rang + 1) / 1000, soit un
 * nombre entier de kteq ou de GWh une fois importée, plus 0,1 par année.
 * La séquestration des forêts et les captages sont négatifs, comme dans `snbc3`.
 */
export const getSnbc3DefaultValeur = (code: string, annee: number) => {
  const base = (SNBC3_CODES.indexOf(code) + 1) / 1000 + (annee - 2020) / 10_000;
  return ['emi_UTCATF_for', 'emi_UTCATF_solfor'].includes(code) ||
    code.startsWith('emi_CSC_')
    ? -base
    : base;
};

export type Snbc3TerritoireFixture = {
  code: string;
  niveauGeo?: 'EPCI' | 'EPT' | 'COMMUNE';
  zone?: string;
  /** `null` pour une valeur inconnue (`pivot_absent`) ; défaut : `getSnbc3DefaultValeur`. */
  valeur?: (code: string, annee: number) => number | null | undefined;
};

/** Mini `resultats_territorialises.parquet`, aux colonnes du contrat `snbc3`. */
export function buildSnbc3Parquet(
  territoires: Snbc3TerritoireFixture[],
  {
    withoutColumn,
    columnTypes = {},
  }: {
    withoutColumn?: string;
    /** Type d'écriture d'une colonne, pour sortir du contrat. */
    columnTypes?: Record<string, 'STRING' | 'INT64' | 'DOUBLE' | 'FLOAT'>;
  } = {}
): Uint8Array {
  const columns: Record<string, (string | number | bigint | null)[]> = {
    code_epci: [],
    nom_epci: [],
    niveau_geo: [],
    zone: [],
    code_traj_supra: [],
    annee: [],
    valeur_recalee: [],
    qualite: [],
  };
  for (const territoire of territoires) {
    const zone = territoire.zone ?? 'HEXAGONE';
    const codes = SNBC3_CODES.filter(
      (code) => zone === 'HEXAGONE' || !code.startsWith('emi_UTCATF_')
    );
    for (const code of codes) {
      for (const annee of SNBC3_FIXTURE_ANNEES) {
        const override = territoire.valeur?.(code, annee);
        const valeur =
          override === undefined
            ? getSnbc3DefaultValeur(code, annee)
            : override;
        columns.code_epci.push(territoire.code);
        columns.nom_epci.push(`Territoire ${territoire.code}`);
        columns.niveau_geo.push(territoire.niveauGeo ?? 'EPCI');
        columns.zone.push(zone);
        columns.code_traj_supra.push(code);
        columns.annee.push(BigInt(annee));
        columns.valeur_recalee.push(valeur);
        columns.qualite.push(
          valeur === null
            ? 'pivot_absent'
            : code.startsWith('emi_CSC_')
            ? 'pass_through_sans_recalage'
            : 'ok'
        );
      }
    }
  }

  const types: Record<string, 'STRING' | 'INT64' | 'DOUBLE' | 'FLOAT'> = {
    annee: 'INT64',
    valeur_recalee: 'DOUBLE',
    ...columnTypes,
  };
  return new Uint8Array(
    parquetWriteBuffer({
      columnData: Object.entries(columns)
        .filter(([name]) => name !== withoutColumn)
        .map(([name, data]) => ({
          name,
          data,
          type: types[name] ?? 'STRING',
          nullable: true,
        })),
    })
  );
}

export const randomSnbc3Sha = () => randomBytes(20).toString('hex');

export const SNBC3_FIXTURE_WORKBOOK = 'Trajectoire GES de référence-V2.xlsx';
export const SNBC3_FIXTURE_METHODOLOGIE =
  'ADEME-Methodo-Outil-trajectoire-référence-V2.pdf';

export const sha256Hex = (content: Uint8Array) =>
  createHash('sha256').update(content).digest('hex');

/**
 * `manifest.json` au format écrit par `main.py release` de `snbc3`, pour les
 * fichiers donnés (champs lus par l'import seulement).
 */
export const buildSnbc3Manifest = ({
  version,
  commit,
  datePublication,
  fichiers,
}: {
  version: string;
  commit: string;
  datePublication: string;
  fichiers: [string, Uint8Array][];
}) => ({
  version,
  date_publication: datePublication,
  code: { commit, branche: 'main', modifications_non_commitees: false },
  fichiers: fichiers.map(([nom, content]) => ({
    nom,
    octets: content.byteLength,
    sha256: sha256Hex(content),
  })),
});

export type Snbc3PublishedRelease = {
  version: string;
  commit: string;
  datePublication: string;
};

/**
 * Releases `snbc3` en mémoire, par version : republier une version la
 * remplace, comme une release GitHub réécrite.
 */
export class FixtureSnbc3ArtifactReader extends Snbc3ArtifactReader {
  private readonly releases = new Map<string, Map<string, Uint8Array>>();

  publish({
    version = '2.1',
    commit = randomSnbc3Sha(),
    datePublication = new Date().toISOString(),
    parquet,
    workbook = new Uint8Array(randomBytes(64)),
    withWorkbook = true,
    methodologie = new Uint8Array(randomBytes(64)),
    withMethodologie = true,
  }: {
    version?: string;
    commit?: string;
    datePublication?: string;
    parquet: Uint8Array;
    workbook?: Uint8Array;
    withWorkbook?: boolean;
    methodologie?: Uint8Array;
    withMethodologie?: boolean;
  }): Snbc3PublishedRelease {
    const contents: [string, Uint8Array][] = [
      [SNBC3_PARQUET_FILE, parquet],
      ...(withWorkbook
        ? [[SNBC3_FIXTURE_WORKBOOK, workbook] as [string, Uint8Array]]
        : []),
      ...(withMethodologie
        ? [[SNBC3_FIXTURE_METHODOLOGIE, methodologie] as [string, Uint8Array]]
        : []),
    ];
    const manifest = buildSnbc3Manifest({
      version,
      commit,
      datePublication,
      fichiers: contents,
    });
    this.releases.set(
      version,
      new Map<string, Uint8Array>([
        ...contents,
        [
          SNBC3_MANIFEST_FILE,
          new Uint8Array(Buffer.from(JSON.stringify(manifest))),
        ],
      ])
    );
    return { version, commit, datePublication };
  }

  protected async openRelease(version: string) {
    const files = this.releases.get(version);
    if (!files) return success(null);
    const source: Snbc3ReleaseSource = {
      readManifest: async () => success(files.get(SNBC3_MANIFEST_FILE) ?? null),
      readFile: async ({ nom }) => success(files.get(nom) ?? null),
    };
    return success(source);
  }
}
