import { describe, expect, test, vi } from 'vitest';
import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import {
  computeMaskedQuestionIds,
  QuestionVisibiliteNode,
} from './personnalisation-questions-actives.rules';

/**
 * Évaluateur minimal : `exprVisible` est de la forme `<questionId>=<valeur>`
 * (OUI → true, NON → false), visible si la réponse correspond ; préfixée par
 * `!`, visible si la réponse ne correspond pas.
 */
const parse = (exprVisible: string) => {
  const negation = exprVisible.startsWith('!');
  const [questionId, valeur] = exprVisible.replace(/^!/, '').split('=');
  return { questionId, valeur: valeur === 'OUI', negation };
};

const compute = (
  questions: QuestionVisibiliteNode[],
  reponses: PersonnalisationReponsesPayload,
  onCycle?: (questionId: string) => void
) =>
  computeMaskedQuestionIds({
    questions,
    reponses,
    getDependencies: (exprVisible) => [parse(exprVisible).questionId],
    isVisible: (exprVisible, reponsesEffectives) => {
      const { questionId, valeur, negation } = parse(exprVisible);
      return (reponsesEffectives[questionId] === valeur) !== negation;
    },
    onCycle,
  });

const question = (
  id: string,
  exprVisible?: string,
  isApplicable = true
): QuestionVisibiliteNode => ({ id, exprVisible, isApplicable });

describe('computeMaskedQuestionIds', () => {
  // A → B (visible si A = OUI) → C (visible si B = OUI)
  const chaine = [
    question('A'),
    question('B', 'A=OUI'),
    question('C', 'B=OUI'),
  ];

  test("masque en cascade l'enfant d'une question masquée malgré sa réponse conservée", () => {
    expect(compute(chaine, { A: false, B: true, C: true })).toEqual(
      new Set(['B', 'C'])
    );
  });

  test('ne masque rien quand toute la chaîne est satisfaite', () => {
    expect(compute(chaine, { A: true, B: true, C: false })).toEqual(new Set());
  });

  test('masque seulement le dernier niveau quand la condition intermédiaire est fausse', () => {
    expect(compute(chaine, { A: true, B: false, C: true })).toEqual(
      new Set(['C'])
    );
  });

  test("ne dépend pas de l'ordre des questions", () => {
    expect(
      compute([...chaine].reverse(), { A: false, B: true, C: true })
    ).toEqual(new Set(['B', 'C']));
  });

  test('utilise la réponse brute d’une question parente absente du graphe', () => {
    expect(compute([question('E', 'P=OUI')], { P: true })).toEqual(new Set());
  });

  test("masque l'enfant d'une question non applicable à la collectivité", () => {
    expect(
      compute([question('A', undefined, false), question('B', 'A=OUI')], {
        A: true,
        B: true,
      })
    ).toEqual(new Set(['A', 'B']));
  });

  test("traite la réponse d'une question masquée comme absente pour une expression négative", () => {
    // B visible sauf si A = OUI : A masquée, sa réponse OUI est ignorée
    expect(
      compute([question('A', undefined, false), question('B', '!A=OUI')], {
        A: true,
      })
    ).toEqual(new Set(['A']));
  });

  test('exclut une question prise dans un cycle et le signale', () => {
    const onCycle = vi.fn();
    const masked = compute(
      [question('X', 'Y=OUI'), question('Y', 'X=OUI')],
      { X: true, Y: true },
      onCycle
    );

    expect(onCycle).toHaveBeenCalledTimes(1);
    expect(masked).toEqual(new Set(['X', 'Y']));
  });
});
