import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  SNBC3_IGNORED,
  SNBC3_MAPPING,
  SNBC3_NET_EMISSIONS_IDENTIFIANT,
  SNBC3_ROAD_CONSUMPTION_IDENTIFIANT,
  SNBC3_ROAD_CONSUMPTION_REQUIRED_CODE,
  SNBC3_ZONE_HEXAGONE,
} from './snbc3-mapping';

/** Une ligne du parquet : un code, une année, pour un territoire. */
export type Snbc3Row = {
  code: string;
  annee: number;
  /** `valeur_recalee`, en MtCO2e ou en TWh ; `null` si inconnue (`pivot_absent`). */
  valeur: number | null;
  qualite: string;
};

export type Snbc3Territoire = {
  /** `code_epci` : SIREN, code EPT, ou code commune pour Paris. */
  code: string;
  niveauGeo: string;
  zone: string;
  rows: Snbc3Row[];
};

export type Snbc3Valeur = {
  identifiant: string;
  annee: number;
  /** En kteq CO2 ou en GWh. */
  objectif: number;
  objectifCommentaire: string;
};

export type BuildSnbc3ValeursError = {
  error: 'UNKNOWN_SNBC3_CODE';
  codes: string[];
};

/** MtCO2e → kteq CO2, TWh → GWh. */
const UNIT_FACTOR = 1000;

const QUALITE_RECALEE = 'ok';

type Aggregate = {
  sum: number;
  codes: Set<string>;
  hasRecalee: boolean;
  hasNonRecalee: boolean;
};

/**
 * Transforme les lignes SNBC 3 d'un territoire en valeurs d'indicateurs TeT.
 *
 * Fonction pure : la correspondance est dans `snbc3-mapping.ts`, les règles
 * dans le plan du lot 1.
 * - Un code absent de la correspondance fait échouer le territoire : c'est la
 *   protection contre une dérive du schéma de `snbc3`.
 * - Une valeur vide reste vide, jamais 0. Un indicateur dont tous les codes
 *   sont vides pour une année n'est pas écrit.
 * - `cae_1.aa` (émissions nettes) n'est calculé que dans l'Hexagone.
 */
export function buildSnbc3Valeurs(
  territoire: Snbc3Territoire
): Result<Snbc3Valeur[], BuildSnbc3ValeursError> {
  const unknownCodes = [
    ...new Set(
      territoire.rows
        .map(({ code }) => code)
        .filter((code) => !(code in SNBC3_MAPPING))
    ),
  ].sort();
  if (unknownCodes.length) {
    return failure({ error: 'UNKNOWN_SNBC3_CODE', codes: unknownCodes });
  }

  const isHexagone = territoire.zone === SNBC3_ZONE_HEXAGONE;
  const aggregates = new Map<string, Map<number, Aggregate>>();
  /**
   * Identifiants pour lesquels le territoire a au moins une ligne : les DROM,
   * sans ligne UTCATF, n'attendent donc aucun `cae_63.*`.
   */
  const expectedIdentifiants = new Set<string>();

  const add = (identifiant: string, row: Snbc3Row, sign: 1 | -1) => {
    const byAnnee = aggregates.get(identifiant) ?? new Map<number, Aggregate>();
    aggregates.set(identifiant, byAnnee);
    const aggregate = byAnnee.get(row.annee) ?? {
      sum: 0,
      codes: new Set<string>(),
      hasRecalee: false,
      hasNonRecalee: false,
    };
    byAnnee.set(row.annee, aggregate);
    aggregate.sum += sign * (row.valeur as number);
    aggregate.codes.add(row.code);
    if (row.qualite === QUALITE_RECALEE) aggregate.hasRecalee = true;
    else aggregate.hasNonRecalee = true;
  };

  for (const row of territoire.rows) {
    const mapped = SNBC3_MAPPING[row.code];
    if (mapped === SNBC3_IGNORED) continue;
    expectedIdentifiants.add(mapped.identifiant);
    if (!isDefined(row.valeur)) continue;
    add(mapped.identifiant, row, mapped.sign);
    if (isHexagone && row.code.startsWith('emi_')) {
      // Émissions nettes = brut − séquestration − captage : signe natif.
      add(SNBC3_NET_EMISSIONS_IDENTIFIANT, row, 1);
    }
  }

  const roadConsumption = aggregates.get(SNBC3_ROAD_CONSUMPTION_IDENTIFIANT);
  roadConsumption?.forEach((aggregate, annee) => {
    if (!aggregate.codes.has(SNBC3_ROAD_CONSUMPTION_REQUIRED_CODE)) {
      roadConsumption.delete(annee);
    }
  });

  const missingIdentifiants = [...expectedIdentifiants]
    .filter((identifiant) => !aggregates.get(identifiant)?.size)
    .sort();
  const recalageSource = isHexagone ? 'OREC 2021' : 'CITEPA IGT 2021';
  // Trois commentaires possibles par territoire : une chaîne partagée par
  // valeur plutôt qu'une copie.
  const commentaires = new Map<string, string>();
  const getCommentaire = (aggregate: Aggregate) => {
    const key = `${aggregate.hasRecalee}:${aggregate.hasNonRecalee}`;
    let commentaire = commentaires.get(key);
    if (commentaire === undefined) {
      commentaire = buildCommentaire(
        aggregate,
        recalageSource,
        missingIdentifiants
      );
      commentaires.set(key, commentaire);
    }
    return commentaire;
  };

  const valeurs: Snbc3Valeur[] = [];
  for (const [identifiant, byAnnee] of aggregates) {
    for (const [annee, aggregate] of byAnnee) {
      valeurs.push({
        identifiant,
        annee,
        objectif: aggregate.sum * UNIT_FACTOR,
        objectifCommentaire: getCommentaire(aggregate),
      });
    }
  }
  return success(
    valeurs.sort(
      (a, b) => a.identifiant.localeCompare(b.identifiant) || a.annee - b.annee
    )
  );
}

function isDefined(valeur: number | null): valeur is number {
  return valeur !== null && !Number.isNaN(valeur);
}

/**
 * « Trajectoire SNBC 3 recalée sur OREC 2021 - Indicateurs manquants : cae_1.j »
 *
 * Format volontairement différent de celui de la SNBC 2 : il n'est lu que par
 * les humains. Les manquants sont les identifiants du territoire dont tous les
 * codes sont vides, la liste est donc la même sur toutes ses valeurs.
 */
function buildCommentaire(
  { hasRecalee, hasNonRecalee }: Aggregate,
  recalageSource: string,
  missingIdentifiants: string[]
): string {
  const recalage =
    hasRecalee && hasNonRecalee
      ? `partiellement recalée sur ${recalageSource}`
      : hasRecalee
      ? `recalée sur ${recalageSource}`
      : 'non recalée';
  const commentaire = `Trajectoire SNBC 3 ${recalage}`;
  return missingIdentifiants.length
    ? `${commentaire} - Indicateurs manquants : ${missingIdentifiants.join(
        ', '
      )}`
    : commentaire;
}
