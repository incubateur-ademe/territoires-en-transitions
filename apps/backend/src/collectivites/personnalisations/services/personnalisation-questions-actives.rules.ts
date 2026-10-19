import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';

export type QuestionVisibiliteNode = {
  id: string;
  exprVisible: string | null | undefined;
  isApplicable: boolean;
};

export type ComputeMaskedQuestionIdsInput = {
  questions: QuestionVisibiliteNode[];
  reponses: PersonnalisationReponsesPayload;
  /** ids des questions référencées par une expression `exprVisible` */
  getDependencies: (exprVisible: string) => string[];
  /** évalue une expression `exprVisible` à partir des réponses fournies */
  isVisible: (
    exprVisible: string,
    reponses: PersonnalisationReponsesPayload
  ) => boolean;
  onCycle?: (questionId: string) => void;
};

/**
 * Calcule les ids des questions masquées, en propageant le masquage en
 * cascade : une question est masquée si elle n'est pas applicable à la
 * collectivité, ou si son `exprVisible` est faux une fois retirées les
 * réponses des questions elles-mêmes masquées.
 *
 * Ex. : B visible si A = OUI, C visible si B = OUI. Si A passe à NON, B est
 * masquée et sa réponse (conservée en base) ne doit plus rendre C visible.
 *
 * La réponse d'une question masquée est traitée comme absente : une
 * expression négative (`si reponse(A, OUI) alors FAUX sinon VRAI`) devient
 * donc vraie quand A est masquée, comme si A n'avait jamais été répondue.
 *
 * Une question référencée mais absente de `questions` n'est jamais masquante :
 * sa réponse brute est utilisée.
 */
export function computeMaskedQuestionIds(
  input: ComputeMaskedQuestionIdsInput
): Set<string> {
  const { questions, reponses, getDependencies, isVisible, onCycle } = input;

  const questionsById = new Map(questions.map((q) => [q.id, q] as const));
  const maskedById = new Map<string, boolean>();
  const inProgress = new Set<string>();

  const isMasked = (questionId: string): boolean => {
    const known = maskedById.get(questionId);
    if (known !== undefined) {
      return known;
    }
    const question = questionsById.get(questionId);
    if (!question) {
      return false;
    }

    inProgress.add(questionId);
    const masked = computeIsMasked(question);
    inProgress.delete(questionId);

    maskedById.set(questionId, masked);
    return masked;
  };

  const computeIsMasked = (question: QuestionVisibiliteNode): boolean => {
    if (!question.isApplicable) {
      return true;
    }
    const exprVisible = question.exprVisible?.trim();
    if (!exprVisible) {
      return false;
    }

    const maskedDependencies = new Set<string>();
    for (const dependencyId of getDependencies(exprVisible)) {
      if (inProgress.has(dependencyId)) {
        onCycle?.(question.id);
        return true;
      }
      if (isMasked(dependencyId)) {
        maskedDependencies.add(dependencyId);
      }
    }

    const reponsesEffectives = Object.fromEntries(
      Object.entries(reponses).filter(
        ([questionId]) => !maskedDependencies.has(questionId)
      )
    );
    return !isVisible(exprVisible, reponsesEffectives);
  };

  for (const question of questions) {
    isMasked(question.id);
  }

  return new Set(
    [...maskedById.entries()].filter(([, masked]) => masked).map(([id]) => id)
  );
}
