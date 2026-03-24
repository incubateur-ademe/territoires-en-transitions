import { regleTypeEnumValues } from '@tet/domain/collectivites';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import {
  PersonnalisationExpressionReferences,
  VerifyExpressionError,
} from '@tet/domain/referentiels';

export type VerifyResult =
  | { success: true }
  | { success: false; errors: VerifyExpressionError[] };

type RegleType = (typeof regleTypeEnumValues)[number];

export type ParseExpression = (
  expression: string
) => { success: true } | { success: false; error: string };

export type ExtractReferences = (
  expression: string
) => PersonnalisationExpressionReferences;

export type IndicateurDefinitionForVerification = {
  id: number;
  identifiantReferentiel: string | null;
  exprCible: string | null;
  exprSeuil: string | null;
};

export type ExpressionToVerify = {
  actionId: string;
  ruleType: RegleType;
  expression: string;
};

export type IndicateurReference = {
  actionId: string;
  scoreExpression: string | null;
  indicateursExpression: ReferencedIndicateur[] | null;
  indicateurs: string[];
};

export type IndicateurCibleLimiteReference = {
  indicateurId: number;
  actionId: string;
  scoreExpression: string;
};
