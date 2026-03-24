import {
  CibleLimiteManquante,
  ExpressionSyntaxeInvalide,
  IndicateurInconnu,
  QuestionForVerification,
  ReferentielId,
  ScoreExpressionSyntaxeInvalide,
  verifyPersonnalisationReferences,
} from '@tet/domain/referentiels';
import { ImportActionDefinitionType } from './import-action-definition.dto';
import {
  buildCibleLimiteReferences,
  buildExpressionsToVerify,
} from './verify-referentiel-expressions.builders';
import {
  buildActionId,
  combineAllErrors,
} from './verify-referentiel-expressions.helpers';
import {
  ExtractReferences,
  ExpressionToVerify,
  IndicateurDefinitionForVerification,
  IndicateurReference,
  ParseExpression,
  IndicateurCibleLimiteReference,
  VerifyResult,
} from './verify-referentiel-expressions.types';

// --- Verification functions ---

function verifySyntaxeExpression(
  expressionToVerify: ExpressionToVerify,
  parseExpression: ParseExpression
): VerifyResult {
  const result = parseExpression(expressionToVerify.expression);
  if (result.success) return { success: true };

  return {
    success: false,
    errors: [
      new ExpressionSyntaxeInvalide(
        expressionToVerify.actionId,
        expressionToVerify.ruleType,
        expressionToVerify.expression,
        result.error
      ),
    ],
  };
}

function verifySemantique(
  expressionToVerify: ExpressionToVerify,
  questions: QuestionForVerification[],
  actionIds: string[],
  extractReferences: ExtractReferences
): VerifyResult {
  const refs = extractReferences(expressionToVerify.expression);
  const errors = verifyPersonnalisationReferences(
    refs,
    questions,
    actionIds,
    expressionToVerify.actionId,
    expressionToVerify.ruleType
  );
  return errors.length ? { success: false, errors } : { success: true };
}

function verifyPersonnalisationExpressions(input: {
  expressions: ExpressionToVerify[];
  questions: QuestionForVerification[];
  actionIds: string[];
  parseExpression: ParseExpression;
  extractReferences: ExtractReferences;
}): VerifyResult {
  const { expressions, questions, actionIds, parseExpression, extractReferences } =
    input;

  const syntaxeResults = expressions.map((expressionToVerify) =>
    verifySyntaxeExpression(expressionToVerify, parseExpression)
  );

  const semantiqueResults = expressions
    .filter((_, i) => syntaxeResults[i].success)
    .map((expressionToVerify) =>
      verifySemantique(expressionToVerify, questions, actionIds, extractReferences)
    );

  return combineAllErrors([...syntaxeResults, ...semantiqueResults]);
}

function verifyScoreExpressions(input: {
  referentielId: ReferentielId;
  actions: Array<Pick<ImportActionDefinitionType, 'identifiant' | 'exprScore'>>;
  parseExpression: ParseExpression;
}): VerifyResult {
  const { referentielId, actions, parseExpression } = input;

  const results = actions
    .filter((a): a is typeof a & { exprScore: string } => Boolean(a.exprScore))
    .map((action): VerifyResult => {
      const result = parseExpression(action.exprScore);
      if (result.success) return { success: true };

      const actionId = buildActionId(referentielId, action.identifiant);
      return {
        success: false,
        errors: [
          new ScoreExpressionSyntaxeInvalide(
            actionId,
            action.exprScore,
            result.error
          ),
        ],
      };
    });

  return combineAllErrors(results);
}

function verifyIndicateursExist(
  references: IndicateurReference[],
  indicateurIdParIdentifiant: Record<string, number>
): VerifyResult {
  const seen = new Set<string>();

  const results = references.flatMap((ref) =>
    ref.indicateurs
      .filter((identifiant) => {
        if (seen.has(identifiant)) return false;
        seen.add(identifiant);
        return !indicateurIdParIdentifiant[identifiant];
      })
      .map((identifiant): VerifyResult => ({
        success: false,
        errors: [
          new IndicateurInconnu(
            ref.actionId,
            identifiant,
            ref.scoreExpression
              ? `expression "${ref.scoreExpression}"`
              : 'liste indicateurs'
          ),
        ],
      }))
  );

  return results.length
    ? combineAllErrors(results)
    : { success: true };
}

function verifyDefinitionCibleOuLimite(
  type: 'cible' | 'limite',
  refValeurs: IndicateurCibleLimiteReference[],
  indicateurDefinitions: IndicateurDefinitionForVerification[]
): VerifyResult {
  const exprField = type === 'cible' ? 'exprCible' : 'exprSeuil';

  // Pour chaque référence cible/limite utilisée dans une expression de score,
  // vérifier que l'indicateur correspondant a bien une expression cible/limite définie.
  const results = refValeurs.map((ref): VerifyResult => {
    const definition = indicateurDefinitions.find(
      (def) => def.id === ref.indicateurId
    );

    if (definition?.[exprField]) return { success: true };

    return {
      success: false,
      errors: [
        new CibleLimiteManquante(
          type,
          definition?.identifiantReferentiel ?? '',
          ref.scoreExpression,
          ref.actionId
        ),
      ],
    };
  });

  return combineAllErrors(results);
}

function verifyCibleLimiteExpressions(
  references: IndicateurReference[],
  indicateurIdParIdentifiant: Record<string, number>,
  definitions: IndicateurDefinitionForVerification[]
): VerifyResult {
  const { cible, limite } = buildCibleLimiteReferences(
    references,
    indicateurIdParIdentifiant
  );

  if (!cible.length && !limite.length) return { success: true };

  return combineAllErrors([
    verifyDefinitionCibleOuLimite('cible', cible, definitions),
    verifyDefinitionCibleOuLimite('limite', limite, definitions),
  ]);
}

// --- Orchestration ---

type VerifyReferentielExpressionsInput = {
  referentielId: ReferentielId;
  actions: Array<
    Pick<
      ImportActionDefinitionType,
      'identifiant' | 'desactivation' | 'reduction' | 'score' | 'exprScore'
    >
  >;
  questions: QuestionForVerification[];
  indicateurReferences: IndicateurReference[];
  indicateurIdParIdentifiant: Record<string, number>;
  indicateurDefinitions: IndicateurDefinitionForVerification[];
  parsePersonnalisationExpression: ParseExpression;
  parseScoreExpression: ParseExpression;
  extractReferences: ExtractReferences;
};

export function verifyReferentielExpressions(
  input: VerifyReferentielExpressionsInput
): VerifyResult {
  const {
    referentielId,
    actions,
    questions,
    indicateurReferences,
    indicateurIdParIdentifiant,
    indicateurDefinitions,
    parsePersonnalisationExpression,
    parseScoreExpression,
    extractReferences,
  } = input;

  const actionIds = actions.map((a) =>
    buildActionId(referentielId, a.identifiant)
  );

  const expressions = buildExpressionsToVerify(referentielId, actions);

  return combineAllErrors([
    // 1. Syntaxe et semantique des expressions de personnalisation (desactivation, reduction, score)
    verifyPersonnalisationExpressions({
      expressions,
      questions,
      actionIds,
      parseExpression: parsePersonnalisationExpression,
      extractReferences,
    }),
    // 2. Syntaxe des expressions de score (exprScore)
    verifyScoreExpressions({
      referentielId,
      actions,
      parseExpression: parseScoreExpression,
    }),
    // 3. Existence des indicateurs references dans les expressions de score et les listes
    verifyIndicateursExist(indicateurReferences, indicateurIdParIdentifiant),
    // 4. Presence des expressions cible/limite pour chaque indicateur utilise via cible() ou limite()
    verifyCibleLimiteExpressions(
      indicateurReferences,
      indicateurIdParIdentifiant,
      indicateurDefinitions
    ),
  ]);
}
