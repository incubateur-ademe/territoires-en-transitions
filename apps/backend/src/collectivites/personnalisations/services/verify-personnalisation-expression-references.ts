import {
  PersonnalisationExpressionReferences,
  QuestionForVerification,
} from '@tet/backend/referentiels/import-referentiel/verify-referentiel-expressions.types';
import {
  DEMARCHE_FIELDS,
  isDemarcheField,
} from '@tet/backend/utils/expression-parser/evaluate-demarche';
import {
  IDENTITE_ALLOWED_VALUES,
  isIdentiteField,
} from '@tet/backend/utils/expression-parser/evaluate-identite';
import { CollectiviteSousTypeEnum } from '@tet/domain/collectivites';

/**
 * Désigne l'expression vérifiée dans les messages, par exemple
 * « l'expression cible de l'indicateur cae_6.a ».
 */
export type ExpressionLabel = string;

export type VerifyPersonnalisationExpressionReferencesOptions = {
  label: ExpressionLabel;
  questions: QuestionForVerification[];
  /** `score(...)` n'est vérifié que si la liste est fournie. */
  actionIds?: string[];
  /**
   * Accepte `identite(type, syndicat)`, forme historique des référentiels cae
   * et eci (cf. `matchesLegacyTypeSyndicat` dans `evaluate-identite.ts`).
   */
  allowLegacyTypeSyndicat?: boolean;
  /** Ajouté au message quand une question référencée est inconnue. */
  unknownQuestionHint?: string;
};

const LEGACY_TYPE_SYNDICAT_VALUE =
  CollectiviteSousTypeEnum.SYNDICAT.toLowerCase();

function verifyQuestionReference(
  reference: { questionId: string; valeur?: string },
  options: VerifyPersonnalisationExpressionReferencesOptions
): string | null {
  const { label, questions, unknownQuestionHint } = options;

  const question = questions.find((q) => q.id === reference.questionId);
  if (!question) {
    const hint = unknownQuestionHint ? `. ${unknownQuestionHint}` : '';
    return `La question "${reference.questionId}" utilisée dans ${label} n'existe pas${hint}`;
  }

  if (reference.valeur === undefined) return null;

  const valeur = reference.valeur;

  switch (question.type) {
    case 'binaire': {
      if (['OUI', 'NON'].includes(valeur.toUpperCase())) return null;
      return `La valeur "${valeur}" pour la question "${reference.questionId}" (type binaire) dans ${label} n'est pas valide. Valeurs autorisées : OUI, NON`;
    }
    case 'choix': {
      const validChoiceIds = question.choix?.map((choice) => choice.id) ?? [];
      if (validChoiceIds.includes(valeur)) return null;
      const allowedValues = validChoiceIds.length
        ? `. Valeurs autorisées : ${validChoiceIds.join(', ')}`
        : '';
      return `La valeur "${valeur}" pour la question "${reference.questionId}" (type choix) dans ${label} n'est pas valide${allowedValues}`;
    }
    case 'proportion':
      return `La valeur "${valeur}" pour la question "${reference.questionId}" (type proportion) dans ${label} n'est pas valide`;
  }
}

function verifyIdentiteReference(
  reference: { champ: string; valeur: string },
  options: VerifyPersonnalisationExpressionReferencesOptions
): string | null {
  const { label, allowLegacyTypeSyndicat } = options;

  if (!isIdentiteField(reference.champ)) {
    const allowedFields = Object.keys(IDENTITE_ALLOWED_VALUES).join(', ');
    return `Le champ d'identité "${reference.champ}" dans ${label} n'est pas valide. Champs autorisés : ${allowedFields}`;
  }

  const allowedValues = IDENTITE_ALLOWED_VALUES[reference.champ];
  const normalizedValue = reference.valeur.toLowerCase();

  if (allowedValues.includes(normalizedValue)) {
    return null;
  }

  const isLegacyTypeSyndicat =
    allowLegacyTypeSyndicat === true &&
    reference.champ === 'type' &&
    normalizedValue === LEGACY_TYPE_SYNDICAT_VALUE;

  if (isLegacyTypeSyndicat) {
    return null;
  }

  return `La valeur "${reference.valeur}" pour identite(${
    reference.champ
  }) dans ${label} n'est pas valide. Valeurs autorisées pour identite(${
    reference.champ
  }, ...) : ${allowedValues.join(', ')}`;
}

function verifyDemarcheReference(
  reference: { champ: string },
  options: VerifyPersonnalisationExpressionReferencesOptions
): string | null {
  if (isDemarcheField(reference.champ)) {
    return null;
  }
  return `Le champ de démarche "${reference.champ}" dans ${
    options.label
  } n'est pas valide. Champs autorisés : ${DEMARCHE_FIELDS.join(', ')}`;
}

function verifyScoreReference(
  reference: { actionId: string },
  actionIds: string[],
  label: ExpressionLabel
): string | null {
  if (actionIds.includes(reference.actionId)) {
    return null;
  }
  return `L'action "${reference.actionId}" référencée dans score() de ${label} n'existe pas dans le référentiel`;
}

/**
 * Vérifie que les questions, champs d'identité, champs de démarche et actions
 * référencés par une expression existent, et que les valeurs comparées sont
 * possibles. Une coquille dans une valeur ne fait pas échouer le parsing : sans
 * ce contrôle, l'expression s'importerait et vaudrait toujours faux.
 */
export function verifyPersonnalisationExpressionReferences(
  references: PersonnalisationExpressionReferences,
  options: VerifyPersonnalisationExpressionReferencesOptions
): string[] {
  const { actionIds, label } = options;

  return [
    ...references.questions.map((reference) =>
      verifyQuestionReference(reference, options)
    ),
    ...references.identiteFields.map((reference) =>
      verifyIdentiteReference(reference, options)
    ),
    ...references.demarches.map((reference) =>
      verifyDemarcheReference(reference, options)
    ),
    ...(actionIds
      ? references.scores.map((reference) =>
          verifyScoreReference(reference, actionIds, label)
        )
      : []),
  ].filter((error): error is string => error !== null);
}
