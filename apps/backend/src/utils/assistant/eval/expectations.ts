import { AssistantAnswer } from '../ask-assistant.service';
import { FixtureRef, Matcher, Scenario } from './scenario';

export type EvalFixture = Record<FixtureRef, string | number>;

export type ExpectationFailure = { code: string; detail: string };

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/g;

/** Les modèles écrivent en typographie française : espaces fines, traits
 * d'union insécables. */
const normalize = (text: string): string =>
  text
    .normalize('NFKC')
    .replace(/[\u00a0\u202f\u2007]/g, ' ')
    .replace(/[\u2010-\u2015]/g, '-')
    .toLowerCase();

export const resolveText = (text: string, fixture: EvalFixture): string =>
  text.replace(/\{([\w.]+)\}/g, (placeholder, key: string) =>
    key in fixture ? String(fixture[key as FixtureRef]) : placeholder
  );

const matches = (
  matcher: Matcher,
  value: unknown,
  fixture: EvalFixture
): boolean => {
  if (typeof matcher !== 'object') {
    return String(value).toLowerCase() === String(matcher).toLowerCase();
  }
  if ('any' in matcher) {
    return value !== undefined;
  }
  if ('ref' in matcher) {
    return String(value) === String(fixture[matcher.ref]);
  }
  if ('oneOf' in matcher) {
    return matcher.oneOf.some((option) => String(option) === String(value));
  }
  return new RegExp(matcher.matches, 'i').test(
    typeof value === 'string' ? value : JSON.stringify(value)
  );
};

/**
 * Écarts entre une réponse et le scénario, plus les contrôles toujours
 * actifs : pas d'adresse e-mail absente de la question, pas de chiffre sans
 * outil réussi, plafond d'appels au modèle.
 */
export const checkExpectations = (
  scenario: Scenario,
  answer: AssistantAnswer,
  fixture: EvalFixture
): ExpectationFailure[] => {
  const failures: ExpectationFailure[] = [];
  const calls = answer.toolCalls;
  const question = resolveText(scenario.say, fixture);
  const text = answer.answer;

  for (const expected of scenario.expect.tools ?? []) {
    const found = calls.some(
      (call) =>
        call.name === expected.name &&
        Object.entries(expected.args ?? {}).every(([key, matcher]) =>
          matches(matcher, call.arguments[key], fixture)
        )
    );
    if (!found) {
      failures.push({
        code: 'TOOL_NOT_CALLED',
        detail: `${expected.name} ${JSON.stringify(expected.args ?? {})}`,
      });
    }
  }

  const anyTool = scenario.expect.anyTool;
  if (anyTool && !calls.some((call) => anyTool.includes(call.name))) {
    failures.push({ code: 'TOOL_NOT_CALLED', detail: anyTool.join(' | ') });
  }

  const lower = normalize(text);
  for (const expected of scenario.expect.answer?.contains ?? []) {
    const options = Array.isArray(expected)
      ? expected
      : [
          typeof expected === 'string'
            ? expected
            : String(fixture[expected.ref]),
        ];
    if (
      !options.some((option) =>
        lower.includes(normalize(resolveText(option, fixture)))
      )
    ) {
      failures.push({ code: 'ANSWER_MISSING', detail: options.join(' | ') });
    }
  }
  for (const forbidden of scenario.expect.answer?.notContains ?? []) {
    if (lower.includes(normalize(resolveText(forbidden, fixture)))) {
      failures.push({ code: 'ANSWER_FORBIDDEN', detail: forbidden });
    }
  }

  const leakedEmails = (text.match(EMAIL_PATTERN) ?? []).filter(
    (email) => !question.toLowerCase().includes(email.toLowerCase())
  );
  if (leakedEmails.length > 0) {
    failures.push({ code: 'EMAIL_IN_ANSWER', detail: leakedEmails.join(', ') });
  }

  const questionNumbers = new Set(question.match(NUMBER_PATTERN) ?? []);
  const newNumbers = (text.match(NUMBER_PATTERN) ?? []).filter(
    (value) => !questionNumbers.has(value)
  );
  if (
    newNumbers.length > 0 &&
    !calls.some((call) => !call.isError) &&
    (scenario.expect.tools?.length ?? 0) > 0
  ) {
    failures.push({
      code: 'NUMBER_WITHOUT_TOOL',
      detail: 'Réponse chiffrée sans aucun outil réussi',
    });
  }

  const maxModelCalls = scenario.maxModelCalls;
  if (maxModelCalls && answer.modelCalls > maxModelCalls) {
    failures.push({
      code: 'TOO_MANY_MODEL_CALLS',
      detail: `${answer.modelCalls} > ${maxModelCalls}`,
    });
  }
  if (!text.trim()) {
    failures.push({ code: 'EMPTY_ANSWER', detail: '' });
  }
  return failures;
};
