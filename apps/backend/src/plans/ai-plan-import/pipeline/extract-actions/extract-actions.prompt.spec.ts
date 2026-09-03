import { describe, expect, it } from 'vitest';
import { buildExtractionPrompt } from './extract-actions.prompt';

describe('buildExtractionPrompt', () => {
  it('interpole le texte, les instructions et la date du jour', () => {
    const prompt = buildExtractionPrompt({
      text: 'TEXTE_SOURCE_MARQUEUR',
      instructions: 'INSTRUCTIONS_MARQUEUR',
      disabledFields: [],
      currentDate: '08/06/2026',
    });

    expect(prompt).toContain('TEXTE_SOURCE_MARQUEUR');
    expect(prompt).toContain('INSTRUCTIONS_MARQUEUR');
    expect(prompt).toContain('08/06/2026');
    expect(prompt).not.toContain('{texte_pdf_a_analyser}');
    expect(prompt).not.toContain('{instructions}');
    expect(prompt).not.toContain('{date_du_jour}');
  });

  it('n ajoute pas de directive d ignorance sans champ désactivé', () => {
    const prompt = buildExtractionPrompt({
      text: 'texte',
      instructions: '',
      disabledFields: [],
      currentDate: '08/06/2026',
    });

    expect(prompt).not.toContain('INSTRUCTION PRIORITAIRE');
  });

  it('préfixe la directive d ignorance pour les champs désactivés', () => {
    const prompt = buildExtractionPrompt({
      text: 'texte',
      instructions: '',
      disabledFields: ['budget', 'statut'],
      currentDate: '08/06/2026',
    });

    expect(prompt).toContain('INSTRUCTION PRIORITAIRE');
    expect(prompt).toContain('- "budget"');
    expect(prompt).toContain('- "statut"');
    expect(prompt.indexOf('INSTRUCTION PRIORITAIRE')).toBeLessThan(
      prompt.indexOf('agent d’extraction documentaire')
    );
  });
});
