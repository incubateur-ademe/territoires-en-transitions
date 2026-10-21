import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { describe, expect, it } from 'vitest';
import {
  CARTOUCHE_RULE,
  DESCRIPTION_RULE,
  FIELD_ALLOCATION_EXAMPLE,
  FIELD_ALLOCATION_RULE,
  NON_ACTION_PASSAGES_RULE,
  SPREADSHEET_RULE,
  OBJECTIFS_RULE,
  PARTNER_COMMITMENTS_RULE,
  PILOTES_RULE,
  SOUS_ACTIONS_RULE,
} from '../../prompts/field-rules';
import { STRUCTURATION_SYSTEM_PROMPT } from '../../prompts/structuration.prompt';
import { buildConsolidationPrompt } from '../consolidate-actions/consolidate-actions.prompt';
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

  it('suit les règles de contenu de la structuration, sans numéroter les actions', () => {
    const extraction = buildExtractionPrompt({
      text: 'texte',
      instructions: '',
      disabledFields: [],
      currentDate: '08/06/2026',
    });
    const structuration = generatePrompt(STRUCTURATION_SYSTEM_PROMPT, {
      dateDuJour: '08/06/2026',
      regleTableur: '',
    });

    for (const rule of [
      NON_ACTION_PASSAGES_RULE,
      PARTNER_COMMITMENTS_RULE,
      FIELD_ALLOCATION_RULE,
      DESCRIPTION_RULE,
      SOUS_ACTIONS_RULE,
      OBJECTIFS_RULE,
      PILOTES_RULE,
      CARTOUCHE_RULE,
      FIELD_ALLOCATION_EXAMPLE,
    ]) {
      expect(extraction).toContain(rule);
      expect(structuration).toContain(rule);
    }
    expect(extraction).not.toContain('n.X.Y');
    expect(structuration).not.toContain(`"titre" : "n.X.Y`);
    expect(structuration).toContain('même si son sous-axe est numéroté');
    expect(extraction).not.toContain('{date_du_jour}');
  });

  it('donne à la consolidation les mêmes règles de description et de sous-actions', () => {
    const consolidation = buildConsolidationPrompt({
      renderedActionsToImprove: '|0| Action',
      text: 'texte',
      disabledFields: [],
    });

    for (const rule of [
      DESCRIPTION_RULE,
      SOUS_ACTIONS_RULE,
      CARTOUCHE_RULE,
      FIELD_ALLOCATION_EXAMPLE,
    ]) {
      expect(consolidation).toContain(rule);
    }
    expect(consolidation).not.toContain('NOTAMMENT DES DESCRIPTIONS');
  });

  it("interdit à la description ce qu'un autre champ accueille, et aux sous-actions les objectifs", () => {
    expect(DESCRIPTION_RULE).toContain('Jamais : les objectifs');
    expect(DESCRIPTION_RULE).toContain('« Référent interne »');
    expect(SOUS_ACTIONS_RULE).toContain(
      "Un objectif n'est jamais une sous-action"
    );
    expect(FIELD_ALLOCATION_RULE).toContain('un seul champ');
  });

  it('ajoute la règle des tableurs pour un tableur seulement', () => {
    const promptOf = (spreadsheet: boolean) =>
      buildExtractionPrompt({
        text: 'texte',
        instructions: '',
        disabledFields: [],
        currentDate: '08/06/2026',
        spreadsheet,
      });

    expect(promptOf(false)).not.toContain(SPREADSHEET_RULE);
    expect(promptOf(true)).toContain(SPREADSHEET_RULE);
    expect(promptOf(true)).not.toContain('{regle_tableur}');
  });

  it("donne la table des avancements d'un tableau de suivi", () => {
    const prompt = buildExtractionPrompt({
      text: 'texte',
      instructions: '',
      disabledFields: [],
      currentDate: '08/06/2026',
    });

    expect(prompt).toContain('"Non engagée", "En projet", "Non démarrée"');
    expect(prompt).toContain('"Annulée" donne "Abandonné"');
  });
});
