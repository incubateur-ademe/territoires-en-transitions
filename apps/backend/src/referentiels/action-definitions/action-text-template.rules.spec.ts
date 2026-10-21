import {
  evaluateActionTextCondition,
  renderActionTextTemplateForVariant,
  TEMPLATE_CONDITION_ALIASES,
} from './action-text-template-condition.visitor';
import {
  ActionTextTemplate,
  hasTemplateMarkup,
  listActionTextTemplateConditions,
  parseActionTextTemplate,
} from './action-text-template.rules';
import { TemplateVariant } from './action-text-variant.rules';

const METROPOLE: TemplateVariant = { localisation: 'metropole' };
const DOM: TemplateVariant = { localisation: 'dom' };

function parse(text: string): ActionTextTemplate {
  const result = parseActionTextTemplate(text);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.template;
}

function render(text: string, variant: TemplateVariant): string {
  return renderActionTextTemplateForVariant(parse(text), variant);
}

function parseError(text: string): string {
  const result = parseActionTextTemplate(text);
  if (result.success) {
    throw new Error(`« ${text} » ne devrait pas être valide`);
  }
  return result.error;
}

describe('parseActionTextTemplate / rendu', () => {
  test('un texte sans balise est rendu tel quel', () => {
    const text = '- [lien](https://example.org)\n- [CUS] autre';
    expect(hasTemplateMarkup(text)).toBe(false);
    expect(render(text, DOM)).toBe(text);
  });

  test('si / sinon en ligne', () => {
    const text =
      'La collectivité suit le {{si dom}}SAR{{sinon}}SRADDET{{/si}} en vigueur.';
    expect(render(text, METROPOLE)).toBe(
      'La collectivité suit le SRADDET en vigueur.'
    );
    expect(render(text, DOM)).toBe('La collectivité suit le SAR en vigueur.');
  });

  test('si sans sinon', () => {
    const text = 'A{{si dom}} (DOM){{/si}}.';
    expect(render(text, METROPOLE)).toBe('A.');
    expect(render(text, DOM)).toBe('A (DOM).');
  });

  test('la valeur contraire tient lieu de négation', () => {
    const text = 'A{{si metropole}} hors DOM{{/si}}';
    expect(render(text, METROPOLE)).toBe('A hors DOM');
    expect(render(text, DOM)).toBe('A');
  });

  test('imbrication', () => {
    const text =
      '{{si dom}}D{{si metropole}}jamais{{sinon}}+{{/si}}{{sinon}}M{{/si}}';
    expect(render(text, METROPOLE)).toBe('M');
    expect(render(text, DOM)).toBe('D+');
  });

  test('une balise seule sur sa ligne disparaît avec la ligne', () => {
    const text =
      '- Exemple A\n{{si dom}}\n- Exemple B (DOM)\n{{/si}}\n- Exemple C';
    expect(render(text, METROPOLE)).toBe('- Exemple A\n- Exemple C');
    expect(render(text, DOM)).toBe(
      '- Exemple A\n- Exemple B (DOM)\n- Exemple C'
    );
  });

  test('balise seule sur sa ligne avec des fins de ligne \\r\\n', () => {
    const text = '- A\r\n  {{si dom}}  \r\n- B\r\n{{/si}}\r\n- C';
    expect(render(text, METROPOLE)).toBe('- A\r\n- C');
    expect(render('- A\r\n{{si dom}}\r\n- B\r\n{{/si}}', METROPOLE)).toBe(
      '- A'
    );
    expect(render(text, DOM)).toBe('- A\r\n- B\r\n- C');
  });

  test('balise seule sur la dernière ligne : pas de retour à la ligne en trop', () => {
    const text = '- A\n{{si dom}}\n- B\n{{/si}}';
    expect(render(text, METROPOLE)).toBe('- A');
    expect(render(text, DOM)).toBe('- A\n- B');
    expect(render('- A\n{{si dom}}\n- B\n{{/si}}\n', METROPOLE)).toBe('- A\n');
  });

  test('les liens Markdown restent intacts', () => {
    const text =
      '{{si dom}}[SAR](https://example.org/sar){{sinon}}[SRADDET](https://example.org/sraddet){{/si}}';
    expect(render(text, DOM)).toBe('[SAR](https://example.org/sar)');
  });

  test('liste les conditions distinctes', () => {
    expect(
      listActionTextTemplateConditions(
        parse('{{si dom}}a{{/si}}{{si metropole}}b{{si dom}}c{{/si}}{{/si}}')
      )
    ).toEqual(['dom', 'metropole']);
  });

  test.each([
    ['{{si dom}}a', 'n’est pas fermée'],
    ['a{{sinon}}b', '{{sinon}} sans {{si'],
    ['a{{/si}}', '{{/si}} sans {{si'],
    ['{{si dom}}a{{sinon}}b{{sinon}}c{{/si}}', 'deux {{sinon}}'],
    ['{{si}}a{{/si}}', 'doit être suivie d’une condition'],
    ['{{alors}}', 'inconnue'],
    ['a {{ b', 'accolades doubles'],
    ['a }} b', 'accolades doubles'],
    ['{{si non dom}}a{{/si}}', '{{si metropole}}'],
  ])('« %s » est refusé', (text, message) => {
    expect(parseError(text)).toContain(message);
  });
});

describe('evaluateActionTextCondition', () => {
  test('alias et forme longue', () => {
    expect(evaluateActionTextCondition('dom', DOM)).toBe(true);
    expect(evaluateActionTextCondition('DOM', DOM)).toBe(true);
    expect(evaluateActionTextCondition('dom', METROPOLE)).toBe(false);
    expect(evaluateActionTextCondition('metropole', METROPOLE)).toBe(true);
    expect(
      evaluateActionTextCondition('identite(localisation, dom)', DOM)
    ).toBe(true);
    expect(
      evaluateActionTextCondition('identite(localisation, metropole)', DOM)
    ).toBe(false);
  });

  test('un alias en argument d’identite reste une valeur', () => {
    // `dom` n'y est pas remplacé par son alias
    expect(
      evaluateActionTextCondition('identite(localisation, dom)', METROPOLE)
    ).toBe(false);
  });

  test('combinaisons et / ou', () => {
    expect(evaluateActionTextCondition('dom ou metropole', DOM)).toBe(true);
    expect(evaluateActionTextCondition('dom et metropole', DOM)).toBe(false);
    expect(evaluateActionTextCondition('(dom)', DOM)).toBe(true);
  });

  test.each([
    ['domm', 'n’est pas une condition connue'],
    ['identite(population, moins_de_20000)', 'n’est pas utilisable'],
    ['identite(type, syndicat)', 'n’est pas utilisable'],
    ['identite(localisation, outremer)', 'valeur inconnue'],
    ['reponse(question_x, oui)', 'seule la fonction identite'],
    ['score(cae)', 'seule la fonction identite'],
    ['min(1, 2)', 'seule la fonction identite'],
    ['3', 'doit valoir vrai ou faux'],
    ['dom et', 'invalide'],
  ])('« %s » est refusée', (condition, message) => {
    expect(() => evaluateActionTextCondition(condition, DOM)).toThrow(message);
  });

  test('le défaut ne dépend pas de la façon de tourner la condition', () => {
    const a = parse('{{si dom}}A{{sinon}}B{{/si}}');
    const b = parse('{{si metropole}}B{{sinon}}A{{/si}}');
    expect(renderActionTextTemplateForVariant(a, METROPOLE)).toBe(
      renderActionTextTemplateForVariant(b, METROPOLE)
    );
    expect(renderActionTextTemplateForVariant(a, DOM)).toBe(
      renderActionTextTemplateForVariant(b, DOM)
    );
  });

  test('un nom d’alias n’est ni un mot-clé du DSL ni un champ d’identité', () => {
    const reserved = [
      'si',
      'alors',
      'sinon',
      'et',
      'ou',
      'non',
      'oui',
      'vrai',
      'faux',
      'min',
      'max',
      'identite',
      'reponse',
      'score',
      'referentiel',
      'demarche',
      'type',
      'soustype',
      'population',
      'localisation',
      'dans_aire_urbaine',
      'commune_membre',
      'sinoe',
    ];
    for (const alias of Object.keys(TEMPLATE_CONDITION_ALIASES)) {
      expect(reserved).not.toContain(alias);
    }
  });
});
