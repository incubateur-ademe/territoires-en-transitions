import { z } from 'zod';
import { IndicateurSourceMetadonnee } from '../../indicateurs';

export const scoreIndicatifTypeEnum = {
  FAIT: 'fait',
  PROGRAMME: 'programme',
} as const;

export const scoreIndicatifTypeEnumSchema = z.enum(scoreIndicatifTypeEnum);

export const scoreIndicatifTypeEnumValues = [
  scoreIndicatifTypeEnum.FAIT,
  scoreIndicatifTypeEnum.PROGRAMME,
] as const;

export type ScoreIndicatifType =
  (typeof scoreIndicatifTypeEnum)[keyof typeof scoreIndicatifTypeEnum];

// type de calcul du score indicatif, déduit des fonctions utilisées par la formule
export const typeCalculScoreIndicatifEnum = {
  PRESENCE_ABSENCE: 'presence_absence',
  VALEUR_CIBLE_SEUIL: 'valeur_cible_seuil',
  PROGRESSION_SNBC: 'progression_snbc',
  REDUCTION: 'reduction',
} as const;

export type TypeCalculScoreIndicatif =
  (typeof typeCalculScoreIndicatifEnum)[keyof typeof typeCalculScoreIndicatifEnum];

/**
 * Type de calcul du score indicatif et données ayant servi au calcul, pour
 * l'affichage (et la persistance dans les snapshots)
 */
export const calculScoreIndicatifSchema = z.discriminatedUnion('type', [
  // `est_suivi(...)`
  z.object({
    type: z.literal(typeCalculScoreIndicatifEnum.PRESENCE_ABSENCE),
  }),
  // `cible(...)` et/ou `limite(...)`
  z.object({
    type: z.literal(typeCalculScoreIndicatifEnum.VALEUR_CIBLE_SEUIL),
    identifiantReferentiel: z.string(),
    cible: z.number().nullable(),
    seuil: z.number().nullable(),
  }),
  // `progression_snbc(...)`
  z.object({
    type: z.literal(typeCalculScoreIndicatifEnum.PROGRESSION_SNBC),
    identifiantReferentiel: z.string(),
    anneeDepart: z.number(),
    // objectif snbc à l'année de départ
    objectifSnbcDepart: z.number().nullable(),
    // dépendent de la valeur `fait` sélectionnée (`null` si aucune)
    anneeUtilisee: z.number().nullable(),
    valeurUtilisee: z.number().nullable(),
    // objectif snbc à l'année de la valeur utilisée
    objectifSnbc: z.number().nullable(),
  }),
  // `reduction(...)`
  z.object({
    type: z.literal(typeCalculScoreIndicatifEnum.REDUCTION),
    identifiantReferentiel: z.string(),
    anneeDepart: z.number(),
    resultatDepart: z.number().nullable(),
    anneeCible: z.number(),
    reductionCible: z.number(),
    // dépendent de la valeur `fait` sélectionnée (`null` si aucune)
    anneeUtilisee: z.number().nullable(),
    valeurUtilisee: z.number().nullable(),
    // valeur attendue à l'année de la valeur utilisée
    valeurCible: z.number().nullable(),
  }),
]);

export type CalculScoreIndicatif = z.infer<typeof calculScoreIndicatifSchema>;

// score indicatif d'une action
export type ActionScoreIndicatif = {
  actionId: string;
  indicateurs: IndicateurAssocie[];
  // `null` si la formule ne correspond à aucun type de calcul connu
  calcul: CalculScoreIndicatif | null;
  fait: ScoreIndicatif | null;
  programme: ScoreIndicatif | null;
};

// indicateur associé à une action/formule de calcul
export type IndicateurAssocie = {
  actionId: string;
  indicateurId: number;
  identifiantReferentiel: string;
  titre: string;
  unite: string;
  optional?: boolean;
  // false si la collectivité a déclaré cet indicateur non applicable : sa
  // valeur doit alors être ignorée (traitée comme 0) dans le calcul du score
  isApplicable: boolean;
};

// score indicatif programmé ou fait
type ScoreIndicatif = {
  score: number;
  valeursUtilisees: Pick<
    ValeurUtilisee,
    | 'indicateurId'
    | 'dateValeur'
    | 'sourceLibelle'
    | 'sourceMetadonnee'
    | 'valeur'
  >[];
};

// valeur utilisée par le calcul
export type ValeurUtilisee = {
  actionId: string;
  indicateurId: number;
  indicateurValeurId: number;
  valeur: number;
  dateValeur: string;
  typeScore: ScoreIndicatifType;
  sourceLibelle: string | null;
  sourceMetadonnee: IndicateurSourceMetadonnee | null;
};

// valeurs pouvant être utilisées pour le calcul
export type ScoreIndicatifActionValeurUtilisable = {
  actionId: string;
  indicateurs: {
    indicateurId: number;
    identifiantReferentiel: string;
    unite: string;
    titre: string;
    // sélection actuelle
    selection: Record<
      ScoreIndicatifType,
      {
        id: number;
        annee: number;
        source: string;
        valeur: number;
      } | null
    >;
    sources: {
      source: string;
      libelle: string | null;
      ordreAffichage: number;
      fait: ValeurUtilisable[];
      programme: ValeurUtilisable[];
    }[];
  }[];
};

// une valeur pouvant être utilisée pour le calcul
type ValeurUtilisable = {
  id: number;
  valeur: number;
  dateValeur: string;
  annee: number;
  utilisee: boolean;
};

// Schéma Zod pour les valeurs utilisées dans le payload
const scoreIndicatifPayloadValeurSchema = z.object({
  indicateurId: z.number(),
  identifiantReferentiel: z.string(),
  valeur: z.number(),
  dateValeur: z.string(),
  sourceLibelle: z.string().nullable(),
  sourceMetadonnee: z
    .object({
      sourceId: z.string(),
      dateVersion: z.string(),
    })
    .nullable(),
});

/**
 * Données du score indicatif incluant valeurs réalisées et programmées pour une
 * action donnée et destinées à être sauvegardées dans un snapshot
 */
export const scoreIndicatifPayloadSchema = z.object({
  unite: z.string(),
  // optionnel : absent des snapshots antérieurs
  calcul: calculScoreIndicatifSchema.nullish(),
  fait: z
    .object({
      score: z.number(),
      valeursUtilisees: z.array(scoreIndicatifPayloadValeurSchema),
    })
    .nullable(),
  programme: z
    .object({
      score: z.number(),
      valeursUtilisees: z.array(scoreIndicatifPayloadValeurSchema),
    })
    .nullable(),
});

export type ScoreIndicatifPayload = z.infer<typeof scoreIndicatifPayloadSchema>;
