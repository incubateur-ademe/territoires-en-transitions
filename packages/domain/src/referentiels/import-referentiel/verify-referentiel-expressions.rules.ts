import {
  CollectiviteLocalisationTypeEnum,
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
} from '../../collectivites/identite-collectivite.schema';
import {
  ChampIdentiteInvalide,
  QuestionInconnue,
  ScoreActionInconnue,
  ValeurIdentiteInvalide,
  ValeurIncoherente,
  VerifyExpressionError,
} from './verify-referentiel-expressions.rules-errors';

export type QuestionForVerification = {
  id: string;
  type: 'binaire' | 'choix' | 'proportion';
  choix?: Array<{
    id: string;
    ordonnancement: number | null;
    formulation: string | null;
  }> | null;
};

const VALEURS_IDENTITE_PAR_CHAMP: Record<string, string[]> = {
  type: [
    ...Object.values(CollectiviteTypeEnum),
    ...Object.values(CollectiviteSousTypeEnum),
  ].map((v) => v.toLowerCase()),
  population: Object.values(CollectivitePopulationTypeEnum).map((v) =>
    v.toLowerCase()
  ),
  localisation: Object.values(CollectiviteLocalisationTypeEnum).map((v) =>
    v.toLowerCase()
  ),
  dans_aire_urbaine: ['oui', 'non'],
};

export type PersonnalisationExpressionReferences = {
  questions: Array<{ questionId: string; valeur?: string }>;
  identiteFields: Array<{ champ: string; valeur: string }>;
  scores: Array<{ actionId: string }>;
};

export function verifyPersonnalisationReferences(
  refs: PersonnalisationExpressionReferences,
  questions: QuestionForVerification[],
  actionIds: string[],
  actionId: string,
  ruleType: string
): VerifyExpressionError[] {
  const questionErrors = refs.questions.map((ref) =>
    verifyQuestion(ref, questions, actionId, ruleType)
  );
  const identiteErrors = refs.identiteFields.map((ref) =>
    verifyIdentite(ref, actionId, ruleType)
  );
  const scoreErrors = refs.scores.map((ref) =>
    verifyScore(ref, actionIds, actionId, ruleType)
  );

  return [...questionErrors, ...identiteErrors, ...scoreErrors].filter(
    (error): error is VerifyExpressionError => error !== null
  );
}

export function verifyQuestion(
  ref: { questionId: string; valeur?: string },
  questions: QuestionForVerification[],
  actionId: string,
  ruleType: string
): VerifyExpressionError | null {
  const question = questions.find((q) => q.id === ref.questionId);
  if (!question) {
    return new QuestionInconnue(actionId, ruleType, ref.questionId);
  }

  if (ref.valeur === undefined) return null;

  const valeur = ref.valeur;

  switch (question.type) {
    case 'binaire': {
      if (['OUI', 'NON'].includes(valeur.toUpperCase())) return null;
      return new ValeurIncoherente(
        actionId, ruleType, ref.questionId, 'binaire', valeur, ['OUI', 'NON']
      );
    }
    case 'choix': {
      const choixValides = question.choix?.map((c) => c.id) ?? [];
      if (choixValides.includes(valeur)) return null;
      return new ValeurIncoherente(
        actionId, ruleType, ref.questionId, 'choix', valeur, choixValides
      );
    }
    case 'proportion':
      return new ValeurIncoherente(
        actionId, ruleType, ref.questionId, 'proportion', valeur
      );
  }
}

export function verifyIdentite(
  ref: { champ: string; valeur: string },
  actionId: string,
  ruleType: string
): VerifyExpressionError | null {
  const valeursParChamp = VALEURS_IDENTITE_PAR_CHAMP[ref.champ];
  if (!valeursParChamp) {
    return new ChampIdentiteInvalide(actionId, ruleType, ref.champ);
  }

  if (!valeursParChamp.includes(ref.valeur.toLowerCase())) {
    return new ValeurIdentiteInvalide(
      actionId, ruleType, ref.champ, ref.valeur, valeursParChamp
    );
  }

  return null;
}

export function verifyScore(
  ref: { actionId: string },
  actionIds: string[],
  actionId: string,
  ruleType: string
): VerifyExpressionError | null {
  if (!actionIds.includes(ref.actionId)) {
    return new ScoreActionInconnue(actionId, ruleType, ref.actionId);
  }
  return null;
}
