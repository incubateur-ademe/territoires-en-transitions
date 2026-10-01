import {
  CollectiviteLocalisationTypeEnum,
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
  IdentiteCollectivite,
  TYPOLOGIES_SINOE,
} from '@tet/domain/collectivites';

/**
 * Champs interrogeables par `identite(champ, valeur)`.
 *
 * Un nom de champ ne doit pas être exactement un mot-clé du DSL (`si`, `ou`,
 * `min`…) : à longueur égale, le lexer retient le mot-clé.
 */
export type IdentiteField =
  | 'type'
  | 'soustype'
  | 'population'
  | 'localisation'
  | 'dans_aire_urbaine'
  | 'commune_membre'
  | 'sinoe';

/**
 * Le second argument d'`identite(...)` passe par la règle `primary`, qui rend un
 * nombre pour un littéral numérique et un booléen pour `vrai`/`oui` : le typer
 * `string` seul serait un mensonge, et `primary.toLowerCase()` planterait.
 */
type IdentiteEvaluator = (
  identite: IdentiteCollectivite,
  primary: string | number | boolean
) => boolean;

export function isIdentiteField(value: string): value is IdentiteField {
  // `in` traverse la chaîne de prototypes : `toString` ou `constructor` y
  // passeraient pour des champs valides et rendraient une valeur non booléenne.
  return Object.hasOwn(IDENTITE_EVALUATORS, value);
}

const LEGACY_TYPE_SYNDICAT_VALUE =
  CollectiviteSousTypeEnum.SYNDICAT.toLowerCase();

/**
 * Compatibilité ascendante des référentiels historiques (cae, eci).
 *
 * "syndicat" était à l'origine une valeur du champ `type` (l'enum SQL
 * type_collectivite valait 'EPCI' | 'commune' | 'syndicat'). Le modèle a depuis
 * séparé `type` (EPCI | commune) et `soustype` (epci_a_fiscalite_propre |
 * syndicat | pole), et les expressions nouvellement importées sont normalisées
 * en `identite(soustype, syndicat)`. Mais les règles déjà stockées en base et
 * jamais ré-importées gardent `identite(type, syndicat)`. Sans ce repli du champ
 * `type` vers le `soustype` pour cette valeur legacy, elles s'évalueraient
 * toujours à false pour un syndicat, car `type` ne vaut jamais 'syndicat'.
 */
function matchesLegacyTypeSyndicat(
  identite: IdentiteCollectivite,
  primary: string | number | boolean
): boolean {
  const value = String(primary).toLowerCase();
  return (
    value === LEGACY_TYPE_SYNDICAT_VALUE &&
    identite.soustype?.toLowerCase() === LEGACY_TYPE_SYNDICAT_VALUE
  );
}

const IDENTITE_EVALUATORS: Record<IdentiteField, IdentiteEvaluator> = {
  type: (identite, primary) =>
    identite.type.toLowerCase() === String(primary).toLowerCase() ||
    matchesLegacyTypeSyndicat(identite, primary),
  soustype: (identite, primary) =>
    identite.soustype?.toLowerCase() === String(primary).toLowerCase(),
  population: (identite, primary) =>
    identite.populationTags.includes(primary as CollectivitePopulationTypeEnum),
  localisation: (identite, primary) => identite.drom === (primary === 'DOM'),
  dans_aire_urbaine: (identite, primary) =>
    identite.dansAireUrbaine === (String(primary).toLowerCase() === 'true'),
  commune_membre: (identite, primary) => {
    // Les tranches sont celles de la commune la plus peuplée : le champ répond
    // à « au moins une commune de plus de N », et « moins de N » y lirait à
    // tort « aucune commune de plus de N ».
    if (!String(primary).startsWith('plus_de_')) {
      throw new Error(
        `identite(commune_membre, ${primary}) : seuls les seuils plus_de_* ont un sens sur la commune la plus peuplée`
      );
    }
    // Lever plutôt que répondre « non » : une identité servie sans ses communes
    // membres (score, indicateurs, établissement public territorial du Grand
    // Paris) masquerait en silence une pièce requise, alors que l'applicabilité
    // d'une pièce garde celle dont la condition lève.
    if (identite.communesMembresPopulationTags === undefined) {
      throw new Error(
        `identite(commune_membre, ${primary}) : les communes membres de la collectivité n'ont pas été chargées`
      );
    }
    return identite.communesMembresPopulationTags.includes(
      primary as CollectivitePopulationTypeEnum
    );
  },
  sinoe: (identite, primary) => {
    // Lever plutôt que répondre « non » : une identité servie sans sa typologie
    // masquerait en silence un seuil ou une cible.
    if (identite.sinoeId === undefined) {
      throw new Error(
        `identite(sinoe, ${primary}) : la typologie SINOE de la collectivité n'a pas été chargée`
      );
    }
    // `null` : collectivité sans typologie connue, qui ne répond à aucune.
    return identite.sinoeId?.toLowerCase() === String(primary).toLowerCase();
  },
};

function lower(enumObject: Record<string, string>): string[] {
  return Object.values(enumObject).map((value) => value.toLowerCase());
}

/**
 * Valeurs acceptées à l'import pour le second argument d'`identite(champ, …)`,
 * en minuscules. Le typage `Record<IdentiteField, …>` fait d'un champ oublié
 * une erreur de compilation : cette liste suit `IDENTITE_EVALUATORS`.
 */
export const IDENTITE_ALLOWED_VALUES: Record<IdentiteField, readonly string[]> =
  {
    type: lower(CollectiviteTypeEnum),
    soustype: lower(CollectiviteSousTypeEnum),
    population: lower(CollectivitePopulationTypeEnum),
    localisation: lower(CollectiviteLocalisationTypeEnum),
    dans_aire_urbaine: ['oui', 'non'],
    sinoe: TYPOLOGIES_SINOE.map(({ id }) => id),
    commune_membre: lower(CollectivitePopulationTypeEnum).filter((value) =>
      value.startsWith('plus_de_')
    ),
  };

function buildUnknownFieldErrorMessage(
  identifier: string,
  primary: string | number | boolean
): string {
  const allowedFields = Object.keys(IDENTITE_EVALUATORS).join(', ');
  return (
    `Champ d'identité "${identifier}" non reconnu dans identite(${identifier}, ${primary}). ` +
    `Champs autorisés : ${allowedFields}.`
  );
}

export function evaluateIdentite(
  identite: IdentiteCollectivite | null,
  identifier: string,
  primary: string | number | boolean
): boolean {
  if (!identite) {
    throw new Error(
      `Information ${identifier} d'identité de la collectivité non trouvée`
    );
  }

  if (!isIdentiteField(identifier)) {
    throw new Error(buildUnknownFieldErrorMessage(identifier, primary));
  }

  return IDENTITE_EVALUATORS[identifier](identite, primary);
}
