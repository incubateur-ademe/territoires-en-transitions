import { failure, success } from '@tet/backend/utils/result.type';
import { createHash, randomBytes } from 'crypto';
import { parquetWriteBuffer } from 'hyparquet-writer';
import {
  getSnbc3ReleasePath,
  Snbc3ArtifactReader,
  Snbc3Commit,
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

/** Dépôt `snbc3` en mémoire : chaque `publish` ajoute un commit. */
export class FixtureSnbc3ArtifactReader extends Snbc3ArtifactReader {
  private readonly commits = new Map<
    string,
    { date: string; files: Map<string, Uint8Array> }
  >();

  publish({
    sha = randomSnbc3Sha(),
    date = new Date().toISOString(),
    version = '2.1',
    parquet,
    workbook = new Uint8Array(randomBytes(64)),
    withWorkbook = true,
    methodologie = new Uint8Array(randomBytes(64)),
    withMethodologie = true,
  }: {
    sha?: string;
    date?: string;
    version?: string;
    parquet: Uint8Array;
    workbook?: Uint8Array;
    withWorkbook?: boolean;
    methodologie?: Uint8Array;
    withMethodologie?: boolean;
  }) {
    const releasePath = getSnbc3ReleasePath(version);
    const contents: [string, Uint8Array][] = [
      [SNBC3_PARQUET_FILE, parquet],
      ...(withWorkbook
        ? [[SNBC3_FIXTURE_WORKBOOK, workbook] as [string, Uint8Array]]
        : []),
      ...(withMethodologie
        ? [[SNBC3_FIXTURE_METHODOLOGIE, methodologie] as [string, Uint8Array]]
        : []),
    ];
    // Champs du `manifest.json` de `snbc3`.
    const manifest = {
      version,
      fichiers: contents.map(([nom, content]) => ({
        nom,
        octets: content.byteLength,
        sha256: createHash('sha256').update(content).digest('hex'),
      })),
    };
    const files = new Map<string, Uint8Array>([
      ...contents.map(
        ([name, content]) => [`${releasePath}/${name}`, content] as const
      ),
      [
        `${releasePath}/manifest.json`,
        new Uint8Array(Buffer.from(JSON.stringify(manifest))),
      ],
    ]);
    this.commits.set(sha, { date, files });
    return { sha, date, version };
  }

  protected async resolveCommit(commit: string) {
    const found = this.commits.get(commit);
    return found
      ? success<Snbc3Commit>({ sha: commit, date: found.date })
      : failure('SNBC3_ARTIFACT_NOT_FOUND' as const);
  }

  protected async readFile(sha: string, path: string) {
    return success(this.commits.get(sha)?.files.get(path) ?? null);
  }
}
