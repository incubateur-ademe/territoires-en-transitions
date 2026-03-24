import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { regleTypeEnumValues } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ImportActionDefinitionType } from './import-action-definition.dto';
import { buildActionId } from './verify-referentiel-expressions.helpers';
import {
  ExpressionToVerify,
  IndicateurReference,
  IndicateurCibleLimiteReference,
} from './verify-referentiel-expressions.types';

export function buildExpressionsToVerify(
  referentielId: ReferentielId,
  actions: Array<
    Pick<
      ImportActionDefinitionType,
      'identifiant' | 'desactivation' | 'reduction' | 'score'
    >
  >
): ExpressionToVerify[] {
  return actions.flatMap((action) => {
    const actionId = buildActionId(referentielId, action.identifiant);
    return regleTypeEnumValues
      .filter((ruleType): ruleType is typeof ruleType & string =>
        Boolean(action[ruleType])
      )
      .map((ruleType) => ({
        actionId,
        ruleType,
        expression: String(action[ruleType]),
      }));
  });
}

type ExtractIndicateurs = (
  expression: string
) => ReferencedIndicateur[] | null;

export function buildIndicateurReferences(input: {
  referentielId: ReferentielId;
  actions: Array<
    Pick<
      ImportActionDefinitionType,
      'identifiant' | 'exprScore' | 'indicateurs'
    >
  >;
  extractIndicateurs: ExtractIndicateurs;
}): IndicateurReference[] {
  const { referentielId, actions, extractIndicateurs } = input;

  return actions.flatMap((action): IndicateurReference[] => {
    const actionId = buildActionId(referentielId, action.identifiant);

    const scoreRef = action.exprScore
      ? buildScoreIndicateurReference(actionId, action.exprScore, extractIndicateurs)
      : [];

    const listeRef = action.indicateurs
      ? [{ actionId, scoreExpression: null, indicateursExpression: null, indicateurs: action.indicateurs }]
      : [];

    return [...scoreRef, ...listeRef];
  });
}

function buildScoreIndicateurReference(
  actionId: string,
  exprScore: string,
  extractIndicateurs: ExtractIndicateurs
): IndicateurReference[] {
  const indicateursExpression = extractIndicateurs(exprScore);
  if (!indicateursExpression) return [];

  return [{
    actionId,
    scoreExpression: exprScore,
    indicateursExpression,
    indicateurs: indicateursExpression.map((ind) => ind.identifiant),
  }];
}

export function buildCibleLimiteReferences(
  references: IndicateurReference[],
  indicateurIdParIdentifiant: Record<string, number>
): { cible: IndicateurCibleLimiteReference[]; limite: IndicateurCibleLimiteReference[] } {
  const refsWithExpr = references.filter(
    (ref): ref is IndicateurReference & { scoreExpression: string } =>
      Boolean(ref.scoreExpression)
  );

  const allIndicateurCibleLimiteReferences = refsWithExpr.flatMap((ref) =>
    (ref.indicateursExpression ?? [])
      .filter((ind) => indicateurIdParIdentifiant[ind.identifiant] !== undefined)
      .map((ind) => ({
        refValeur: {
          indicateurId: indicateurIdParIdentifiant[ind.identifiant],
          actionId: ref.actionId,
          scoreExpression: ref.scoreExpression,
        },
        tokens: ind.tokens,
      }))
  );

  return {
    cible: allIndicateurCibleLimiteReferences
      .filter((r) => r.tokens.includes('cible'))
      .map((r) => r.refValeur),
    limite: allIndicateurCibleLimiteReferences
      .filter((r) => r.tokens.includes('limite'))
      .map((r) => r.refValeur),
  };
}
