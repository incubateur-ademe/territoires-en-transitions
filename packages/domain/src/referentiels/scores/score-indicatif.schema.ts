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

// score indicatif d'une action
export type ActionScoreIndicatif = {
  actionId: string;
  indicateurs: IndicateurAssocie[];
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
