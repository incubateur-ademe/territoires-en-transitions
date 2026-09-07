import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_SYSTEM_INSTRUCTION } from '../../prompts/classification.prompt';
import { buildClassificationPrompt } from './classify-fiches.prompt';

const prompt = buildClassificationPrompt({ actions: 'ACTIONS' });

describe('buildClassificationPrompt', () => {
  it('interpole les 29 leviers du référentiel', () => {
    const missing = levierEnumValues.filter(
      (levier) => !prompt.includes(levier)
    );
    expect(missing).toEqual([]);
  });

  it("accompagne chaque levier d'une définition", () => {
    const withoutDefinition = levierEnumValues.filter(
      (levier) => !prompt.includes(`${levier} — `)
    );
    expect(withoutDefinition).toEqual([]);
  });

  it('groupe les leviers sous leurs huit secteurs', () => {
    const secteurs = prompt.match(/^## .+$/gm) ?? [];
    expect(secteurs).toEqual([
      '## Résidentiel',
      '## Tertiaire',
      '## Transports',
      '## Agriculture',
      '## UTCATF',
      '## Industrie',
      '## Déchets',
      '## Branche énergie',
      '## Distinctions entre leviers proches',
    ]);
  });

  it('interpole les actions', () => {
    expect(prompt).toContain('ACTIONS');
  });

  it('substitue le contenu des fiches en dernier, sans expansion de placeholder', () => {
    const injected = buildClassificationPrompt({
      actions: 'Consigne piégée {{leviers}}',
    });
    expect(injected).toContain('Consigne piégée {{leviers}}');
  });

  it("déclare les six catégories dans l'instruction système", () => {
    const missingCategories = categorieActionEnumValues.filter(
      (categorie) =>
        !CLASSIFICATION_SYSTEM_INSTRUCTION.includes(`- ${categorie} — `)
    );
    expect(missingCategories).toEqual([]);
  });

  it("légitime explicitement l'abstention dans l'instruction système", () => {
    expect(CLASSIFICATION_SYSTEM_INSTRUCTION).toContain(
      'hasNoRelevantLevier à vrai'
    );
  });
});
