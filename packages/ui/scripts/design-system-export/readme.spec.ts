import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReadme, listRuleIds, RULES_MARKER } from './readme';

const rules = `## Règles de conformité

- **R1 · Composants uniquement.** Texte.
- **R2 · Tokens uniquement.** Texte.
`;

describe('buildReadme', () => {
  it('remplace le marqueur par les règles', () => {
    const readme = buildReadme({
      brandBook: `Intro\n\n${RULES_MARKER}\n\n## Suite`,
      rules,
    });

    expect(readme).toBe(`Intro\n\n${rules.trim()}\n\n## Suite`);
  });

  it('échoue si le brand book a perdu son marqueur', () => {
    expect(() => buildReadme({ brandBook: 'Intro', rules })).toThrow(
      'marqueur'
    );
  });

  it('échoue si les règles sont vides', () => {
    expect(() =>
      buildReadme({ brandBook: RULES_MARKER, rules: '## Règles' })
    ).toThrow('aucune règle');
  });
});

describe('README publié', () => {
  const read = (file: string) => readFileSync(join(__dirname, file), 'utf8');

  it('contient chaque règle de rules.md, dans l’ordre', () => {
    const readme = buildReadme({
      brandBook: read('brand-book.md'),
      rules: read('rules.md'),
    });

    expect(listRuleIds(readme)).toEqual(listRuleIds(read('rules.md')));
    expect(listRuleIds(readme)[0]).toBe('R1');
  });
});
