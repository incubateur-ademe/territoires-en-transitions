import { levierIdEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION as prompt } from './classify-fiche.prompt';
import { ficheClassificationSchema } from './classify-fiche.schema';

const RESOLVED_EXAMPLE_ANSWER = /^→ `(\{.*\})`$/gm;

describe('FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION', () => {
  it.each(levierIdEnumValues)('définit le levier %s', (levierId) => {
    expect(prompt).toContain(`- \`${levierId}\` — `);
  });

  it('décrit les six catégories', () => {
    [
      '**1 — Aménagement & infrastructures.**',
      '**2 — Réglementation & planification.**',
      '**3 — Financement & fiscalité.**',
      '**4 — Gouvernance & partenariats.**',
      '**5 — Exemplarité interne.**',
      '**6 — Sensibilisation & accompagnement.**',
    ].forEach((categorie) => expect(prompt).toContain(categorie));
  });

  it('pose le contrat de balisage de la fiche', () => {
    expect(prompt).toContain('# Contrat de balisage');
    expect(prompt).toContain('`<fiche nonce="…">`');
    expect(prompt).toContain('`</fiche>`');
  });

  it('demande une réponse sans justification', () => {
    expect(prompt).toContain(
      '{"leviers": [{"levier": "<code>", "categories": [<entiers de 1 à 6>]}]}'
    );
    expect(prompt).not.toContain('justification');
  });

  it('contient les 24 exemples résolus', () => {
    expect([...prompt.matchAll(RESOLVED_EXAMPLE_ANSWER)]).toHaveLength(24);
  });

  it('donne pour chaque exemple une réponse conforme au schéma de sortie', () => {
    const answers = [...prompt.matchAll(RESOLVED_EXAMPLE_ANSWER)].map(
      ([, json]) => ficheClassificationSchema.safeParse(JSON.parse(json))
    );

    expect(answers.filter(({ success }) => !success)).toEqual([]);
  });

  it('ne se termine pas par un saut de ligne', () => {
    expect(prompt.endsWith('\n')).toBe(false);
  });
});
