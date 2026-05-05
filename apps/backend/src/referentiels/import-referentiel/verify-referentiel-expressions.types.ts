import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { regleTypeEnumValues } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ImportActionDefinition } from './import-action-definition.dto';

type RegleType = (typeof regleTypeEnumValues)[number];

export type PersonnalisationExpressionReferences = {
  questions: Array<{ questionId: string; valeur?: string }>;
  identiteFields: Array<{ champ: string; valeur: string }>;
  scores: Array<{ actionId: string }>;
};

export type QuestionForVerification = {
  id: string;
  type: 'binaire' | 'choix' | 'proportion';
  choix?: Array<{
    id: string;
    ordonnancement: number | null;
    formulation: string | null;
  }> | null;
};

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
  referencedIndicateurs: ReferencedIndicateur[] | null;
};

export type IndicateurCibleLimiteReference = {
  indicateurId: number;
  actionId: string;
  scoreExpression: string;
};

export type ParseExpression = (
  expression: string
) => { success: true } | { success: false; error: string };

export type VerifyReferentielExpressionsInput = {
  referentielId: ReferentielId;
  actions: Array<
    Pick<
      ImportActionDefinition,
      'identifiant' | 'desactivation' | 'reduction' | 'score' | 'exprScore'
    >
  >;
  questions: QuestionForVerification[];
  indicateurReferences: IndicateurReference[];
  indicateurIdByIdentifiant: Record<string, number>;
  indicateurDefinitions: IndicateurDefinitionForVerification[];
  parsePersonnalisationExpression: ParseExpression;
  parseScoreExpression: ParseExpression;
};
