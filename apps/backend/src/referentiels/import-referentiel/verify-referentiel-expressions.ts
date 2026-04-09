import { extractReferencesFromExpression } from '@tet/backend/collectivites/personnalisations/services/personnalisation-expression-reference-extractor';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import {
  CollectiviteLocalisationTypeEnum,
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
  regleTypeEnumValues,
} from '@tet/domain/collectivites';
import { ActionQuestion, ReferentielId } from '@tet/domain/referentiels';
import { ImportActionDefinitionType } from './import-action-definition.dto';
import {
  ExpressionToVerify,
  IndicateurCibleLimiteReference,
  IndicateurDefinitionForVerification,
  IndicateurReference,
  ParseExpression,
  PersonnalisationExpressionReferences,
  QuestionForVerification,
  VerifyReferentielExpressionsInput,
} from './verify-referentiel-expressions.types';

const ALLOWED_IDENTITY_VALUES_BY_FIELD: Record<string, string[]> = {
  type: Object.values(CollectiviteTypeEnum).map((value) => value.toLowerCase()),
  soustype: Object.values(CollectiviteSousTypeEnum).map((value) =>
    value.toLowerCase()
  ),
  population: Object.values(CollectivitePopulationTypeEnum).map((value) =>
    value.toLowerCase()
  ),
  localisation: Object.values(CollectiviteLocalisationTypeEnum).map((value) =>
    value.toLowerCase()
  ),
  dans_aire_urbaine: ['oui', 'non'],
};

const REGLE_TYPE_LABELS: Record<string, string> = {
  score: 'score',
  desactivation: 'désactivation',
  reduction: 'réduction',
};

const LEGACY_TYPE_SYNDICAT_VALUE =
  CollectiviteSousTypeEnum.SYNDICAT.toLowerCase();

function getRuleTypeLabel(ruleType: string): string {
  return REGLE_TYPE_LABELS[ruleType] ?? ruleType;
}

const REFERENTIELS_WITH_LEGACY_TYPE_SYNDICAT: Set<ReferentielId> = new Set([
  'cae',
  'eci',
]);

export function normalizeTypeSyndicatExpressions(input: {
  referentielId: ReferentielId;
  expression: string;
}): string {
  const { referentielId, expression } = input;
  if (!REFERENTIELS_WITH_LEGACY_TYPE_SYNDICAT.has(referentielId)) {
    return expression;
  }
  /**
   * On remplace identite(type, syndicat) par identite(soustype, syndicat) pour les référentiels qui ont le sous-type syndicat
   * pour assurer la compatibilité avec les expressions de personnalisation existantes.
   */
  return expression.replaceAll(
    'identite(type, syndicat)',
    'identite(soustype, syndicat)'
  );
}

export function buildActionId(
  referentielId: ReferentielId,
  identifiant: string
): string {
  return `${referentielId}_${identifiant}`;
}

function buildExpressionsToVerify(
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

type ExtractIndicateurs = (expression: string) => ReferencedIndicateur[] | null;

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

    const scoreReference = action.exprScore
      ? buildScoreIndicateurReference(
          actionId,
          action.exprScore,
          extractIndicateurs
        )
      : [];

    const listReference = action.indicateurs
      ? [
          {
            actionId,
            scoreExpression: null,
            referencedIndicateurs: action.indicateurs.map((identifiant) => ({
              identifiant,
              optional: false,
              tokens: [],
            })),
          },
        ]
      : [];

    return [...scoreReference, ...listReference];
  });
}

function buildScoreIndicateurReference(
  actionId: string,
  scoreExpression: string,
  extractIndicateurs: ExtractIndicateurs
): IndicateurReference[] {
  const referencedIndicateurs = extractIndicateurs(scoreExpression);
  if (!referencedIndicateurs) return [];

  return [
    {
      actionId,
      scoreExpression,
      referencedIndicateurs,
    },
  ];
}

export function buildQuestionActionRelations(input: {
  referentielId: ReferentielId;
  actions: Array<
    Pick<
      ImportActionDefinitionType,
      'identifiant' | 'desactivation' | 'reduction' | 'score'
    >
  >;
}): ActionQuestion[] {
  const { referentielId, actions } = input;
  const seen = new Set<string>();

  return actions.flatMap((action) => {
    const actionId = buildActionId(referentielId, action.identifiant);

    return regleTypeEnumValues.flatMap((ruleType) => {
      const expression = action[ruleType];
      if (!expression) return [];

      const references = extractReferencesFromExpression(expression);
      return references.questions
        .filter(({ questionId }) => {
          const key = `${actionId}:${questionId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(({ questionId }) => ({ actionId, questionId }));
    });
  });
}

function buildCibleLimiteReferences(
  references: IndicateurReference[],
  indicateurIdByIdentifiant: Record<string, number>
): {
  cible: IndicateurCibleLimiteReference[];
  limite: IndicateurCibleLimiteReference[];
} {
  const referencesWithScoreExpression = references.filter(
    (
      reference
    ): reference is IndicateurReference & { scoreExpression: string } =>
      Boolean(reference.scoreExpression)
  );

  const allCibleLimiteReferences = referencesWithScoreExpression.flatMap(
    (reference) =>
      (reference.referencedIndicateurs ?? [])
        .filter(
          (indicateur) =>
            indicateurIdByIdentifiant[indicateur.identifiant] !== undefined
        )
        .map((indicateur) => ({
          referenceValue: {
            indicateurId: indicateurIdByIdentifiant[indicateur.identifiant],
            actionId: reference.actionId,
            scoreExpression: reference.scoreExpression,
          },
          tokens: indicateur.tokens,
        }))
  );

  return {
    cible: allCibleLimiteReferences
      .filter((reference) => reference.tokens.includes('cible'))
      .map((reference) => reference.referenceValue),
    limite: allCibleLimiteReferences
      .filter((reference) => reference.tokens.includes('limite'))
      .map((reference) => reference.referenceValue),
  };
}

function verifyQuestionReference(
  reference: { questionId: string; valeur?: string },
  questions: QuestionForVerification[],
  actionId: string,
  ruleType: string
): string | null {
  const question = questions.find((q) => q.id === reference.questionId);
  if (!question) {
    return `La question "${
      reference.questionId
    }" utilisée dans l'expression de ${getRuleTypeLabel(
      ruleType
    )} de l'action ${actionId} n'existe pas`;
  }

  if (reference.valeur === undefined) return null;

  const valeur = reference.valeur;

  switch (question.type) {
    case 'binaire': {
      if (['OUI', 'NON'].includes(valeur.toUpperCase())) return null;
      return `La valeur "${valeur}" pour la question "${
        reference.questionId
      }" (type binaire) dans l'expression de ${getRuleTypeLabel(
        ruleType
      )} de l'action ${actionId} n'est pas valide. Valeurs autorisées : OUI, NON`;
    }
    case 'choix': {
      const validChoiceIds = question.choix?.map((choice) => choice.id) ?? [];
      if (validChoiceIds.includes(valeur)) return null;
      const allowedValues = validChoiceIds.length
        ? `. Valeurs autorisées : ${validChoiceIds.join(', ')}`
        : '';
      return `La valeur "${valeur}" pour la question "${
        reference.questionId
      }" (type choix) dans l'expression de ${getRuleTypeLabel(
        ruleType
      )} de l'action ${actionId} n'est pas valide${allowedValues}`;
    }
    case 'proportion':
      return `La valeur "${valeur}" pour la question "${
        reference.questionId
      }" (type proportion) dans l'expression de ${getRuleTypeLabel(
        ruleType
      )} de l'action ${actionId} n'est pas valide`;
  }
}

function buildIdentiteFieldHint(champ: string): string {
  const values = ALLOWED_IDENTITY_VALUES_BY_FIELD[champ];
  if (!values) {
    return '';
  }
  return `Valeurs autorisées pour identite(${champ}, ...) : ${values.join(
    ', '
  )}`;
}

function verifyIdentiteReference(input: {
  reference: { champ: string; valeur: string };
  actionId: string;
  ruleType: string;
  referentielId: ReferentielId;
}): string | null {
  const { reference, actionId, ruleType, referentielId } = input;

  const allowedValues = ALLOWED_IDENTITY_VALUES_BY_FIELD[reference.champ];
  if (!allowedValues) {
    const allowedFields = Object.keys(ALLOWED_IDENTITY_VALUES_BY_FIELD).join(
      ', '
    );
    return `Le champ d'identité "${
      reference.champ
    }" dans l'expression de ${getRuleTypeLabel(
      ruleType
    )} de l'action ${actionId} n'est pas valide. Champs autorisés : ${allowedFields}`;
  }

  const normalizedValue = reference.valeur.toLowerCase();

  if (allowedValues.includes(normalizedValue)) {
    return null;
  }

  const isLegacyTypeSyndicat =
    reference.champ === 'type' &&
    normalizedValue === LEGACY_TYPE_SYNDICAT_VALUE &&
    REFERENTIELS_WITH_LEGACY_TYPE_SYNDICAT.has(referentielId);

  if (isLegacyTypeSyndicat) {
    return null;
  }

  return `La valeur "${reference.valeur}" pour identite(${
    reference.champ
  }) dans l'expression de ${getRuleTypeLabel(
    ruleType
  )} de l'action ${actionId} n'est pas valide. ${buildIdentiteFieldHint(
    reference.champ
  )}`;
}

function verifyScoreReference(
  reference: { actionId: string },
  actionIds: string[],
  actionId: string,
  ruleType: string
): string | null {
  if (!actionIds.includes(reference.actionId)) {
    return `L'action "${
      reference.actionId
    }" référencée dans score() de l'expression de ${getRuleTypeLabel(
      ruleType
    )} de l'action ${actionId} n'existe pas dans le référentiel`;
  }
  return null;
}

function verifyPersonnalisationReferences(input: {
  references: PersonnalisationExpressionReferences;
  questions: QuestionForVerification[];
  actionIds: string[];
  actionId: string;
  ruleType: string;
  referentielId: ReferentielId;
}): string[] {
  const {
    references,
    questions,
    actionIds,
    actionId,
    ruleType,
    referentielId,
  } = input;

  const questionErrors = references.questions
    .map((reference) =>
      verifyQuestionReference(reference, questions, actionId, ruleType)
    )
    .filter((error): error is string => error !== null);

  const identiteErrors = references.identiteFields
    .map((reference) =>
      verifyIdentiteReference({ reference, actionId, ruleType, referentielId })
    )
    .filter((error): error is string => error !== null);

  const scoreErrors = references.scores
    .map((reference) =>
      verifyScoreReference(reference, actionIds, actionId, ruleType)
    )
    .filter((error): error is string => error !== null);

  return [...questionErrors, ...identiteErrors, ...scoreErrors];
}

function verifyPersonnalisationExpressions(input: {
  expressions: ExpressionToVerify[];
  questions: QuestionForVerification[];
  actionIds: string[];
  parseExpression: ParseExpression;
  referentielId: ReferentielId;
}): string[] {
  const { expressions, questions, actionIds, parseExpression, referentielId } =
    input;

  const { syntaxErrors, validExpressions } = expressions.reduce<{
    syntaxErrors: string[];
    validExpressions: ExpressionToVerify[];
  }>(
    (accumulator, expressionToVerify) => {
      const result = parseExpression(expressionToVerify.expression);
      if (result.success) {
        accumulator.validExpressions.push(expressionToVerify);
      } else {
        accumulator.syntaxErrors.push(
          `L'expression de ${expressionToVerify.ruleType} "${expressionToVerify.expression}" de l'action ${expressionToVerify.actionId} contient une erreur de syntaxe : ${result.error}`
        );
      }
      return accumulator;
    },
    { syntaxErrors: [], validExpressions: [] }
  );

  const semanticErrors = validExpressions.flatMap((expressionToVerify) => {
    const references = extractReferencesFromExpression(
      expressionToVerify.expression
    );
    return verifyPersonnalisationReferences({
      references,
      questions,
      actionIds,
      actionId: expressionToVerify.actionId,
      ruleType: expressionToVerify.ruleType,
      referentielId,
    });
  });

  return [...syntaxErrors, ...semanticErrors];
}

function verifyScoreExpressions(input: {
  referentielId: ReferentielId;
  actions: Array<Pick<ImportActionDefinitionType, 'identifiant' | 'exprScore'>>;
  parseExpression: ParseExpression;
}): string[] {
  const { referentielId, actions, parseExpression } = input;

  return actions
    .filter((action): action is typeof action & { exprScore: string } =>
      Boolean(action.exprScore)
    )
    .flatMap((action) => {
      const result = parseExpression(action.exprScore);
      if (result.success) return [];

      const actionId = buildActionId(referentielId, action.identifiant);
      return [
        `L'expression de score "${action.exprScore}" de l'action ${actionId} contient une erreur de syntaxe : ${result.error}`,
      ];
    });
}

function verifyIndicateursExist(
  references: IndicateurReference[],
  indicateurIdByIdentifiant: Record<string, number>
): string[] {
  const seen = new Set<string>();

  return references.flatMap((reference) => {
    const identifiants = (reference.referencedIndicateurs ?? []).map(
      (indicateur) => indicateur.identifiant
    );

    return identifiants
      .filter((identifiant) => {
        if (seen.has(identifiant)) return false;
        seen.add(identifiant);
        return !indicateurIdByIdentifiant[identifiant];
      })
      .map((identifiant) => {
        const source = reference.scoreExpression
          ? `expression "${reference.scoreExpression}"`
          : 'liste indicateurs';
        return `L'indicateur "${identifiant}" référencé dans ${source} de l'action ${reference.actionId} n'existe pas`;
      });
  });
}

function verifyDefinitionCibleOrLimite(
  type: 'cible' | 'limite',
  references: IndicateurCibleLimiteReference[],
  indicateurDefinitions: IndicateurDefinitionForVerification[]
): string[] {
  const expressionField = type === 'cible' ? 'exprCible' : 'exprSeuil';

  return references.flatMap((reference) => {
    const definition = indicateurDefinitions.find(
      (definition) => definition.id === reference.indicateurId
    );

    if (definition?.[expressionField]) return [];

    return [
      `L'expression ${type} manquante pour l'indicateur "${
        definition?.identifiantReferentiel ?? ''
      }" utilisé dans l'expression "${reference.scoreExpression}" de l'action ${
        reference.actionId
      }`,
    ];
  });
}

function verifyCibleLimiteExpressions(
  references: IndicateurReference[],
  indicateurIdByIdentifiant: Record<string, number>,
  definitions: IndicateurDefinitionForVerification[]
): string[] {
  const { cible, limite } = buildCibleLimiteReferences(
    references,
    indicateurIdByIdentifiant
  );

  if (!cible.length && !limite.length) return [];

  return [
    ...verifyDefinitionCibleOrLimite('cible', cible, definitions),
    ...verifyDefinitionCibleOrLimite('limite', limite, definitions),
  ];
}

export function verifyReferentielExpressions(
  input: VerifyReferentielExpressionsInput
): string[] {
  const {
    referentielId,
    actions,
    questions,
    indicateurReferences,
    indicateurIdByIdentifiant,
    indicateurDefinitions,
    parsePersonnalisationExpression,
    parseScoreExpression,
  } = input;

  const actionIds = actions.map((action) =>
    buildActionId(referentielId, action.identifiant)
  );

  const expressions = buildExpressionsToVerify(referentielId, actions);

  return [
    // 1. Syntax and semantics of personalisation expressions (desactivation, reduction, score)
    ...verifyPersonnalisationExpressions({
      expressions,
      questions,
      actionIds,
      parseExpression: parsePersonnalisationExpression,
      referentielId,
    }),
    // 2. Syntax of score expressions (exprScore)
    ...verifyScoreExpressions({
      referentielId,
      actions,
      parseExpression: parseScoreExpression,
    }),
    // 3. Existence of referenced indicators in score expressions and lists
    ...verifyIndicateursExist(indicateurReferences, indicateurIdByIdentifiant),
    // 4. Presence of cible/limite expressions for each indicator used via cible() or limite()
    ...verifyCibleLimiteExpressions(
      indicateurReferences,
      indicateurIdByIdentifiant,
      indicateurDefinitions
    ),
  ];
}
