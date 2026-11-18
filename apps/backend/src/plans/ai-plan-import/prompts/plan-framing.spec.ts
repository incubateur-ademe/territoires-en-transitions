import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import { buildSecteursPrompt } from '../pipeline/classify-secteurs/classify-secteurs.prompt';
import { buildConsolidationPrompt } from '../pipeline/consolidate-actions/consolidate-actions.prompt';
import { buildEnrichmentPrompt } from '../pipeline/enrich-sous-actions/enrich-sous-actions.prompt';
import { buildExtractionPrompt } from '../pipeline/extract-actions/extract-actions.prompt';
import { buildQualitativeReviewPrompt } from '../pipeline/qualitative-review/qualitative-review.prompt';
import {
  describePlanType,
  framePlanKind,
  framePlanScope,
} from './plan-framing';
import { REPERAGE_PLAN_KIND, REPERAGE_PROMPT } from './reperage.prompt';
import {
  STRUCTURATION_PLAN_SCOPE,
  STRUCTURATION_SYSTEM_PROMPT,
} from './structuration.prompt';

const buildPrompts = (planTypeLabel: string | undefined) => ({
  extraction: buildExtractionPrompt({
    text: 'texte',
    instructions: '',
    disabledFields: [],
    currentDate: '08/06/2026',
    planTypeLabel,
  }),
  structuration: generatePrompt(STRUCTURATION_SYSTEM_PROMPT, {
    cadrage: framePlanScope(STRUCTURATION_PLAN_SCOPE, planTypeLabel),
    dateDuJour: '08/06/2026',
    regleTableur: '',
  }),
  reperage: generatePrompt(REPERAGE_PROMPT, {
    cadrage: framePlanKind(REPERAGE_PLAN_KIND, planTypeLabel),
    extraits: 'extraits',
  }),
  consolidation: buildConsolidationPrompt({
    renderedActionsToImprove: 'actions',
    text: 'texte',
    disabledFields: [],
    planTypeLabel,
  }),
  enrichment: buildEnrichmentPrompt({
    renderedSousActions: 'sous-actions',
    text: 'texte',
    disabledFields: [],
    planTypeLabel,
  }),
  qualitativeReview: buildQualitativeReviewPrompt({
    renderedActions: 'actions',
    planTypeLabel,
  }),
});

describe('describePlanType', () => {
  it.each([
    { name: 'sans type', planType: undefined },
    { name: 'PCAET', planType: { ...PCAET_PLAN_TYPE_KEY, detail: null } },
    {
      name: 'type « Autre »',
      planType: {
        categorie: 'Plans thématiques',
        type: 'Autre thématique',
        detail: null,
      },
    },
  ])('ne donne aucun libellé : $name', ({ planType }) => {
    expect(describePlanType(planType)).toBeUndefined();
  });

  it('reprend le type et son détail', () => {
    expect(
      describePlanType({
        categorie: 'Plans thématiques',
        type: 'Plan Mobilité',
        detail: null,
      })
    ).toBe('Plan Mobilité');
    expect(
      describePlanType({
        categorie: 'Plans thématiques',
        type: 'Plan Energies',
        detail: 'dont TEPOS',
      })
    ).toBe('Plan Energies (dont TEPOS)');
  });
});

describe('cadrage des prompts par type de plan', () => {
  // Les références d'éval sont des PCAET : sans libellé, chaque prompt doit
  // rester celui sur lequel il a été évalué.
  it('garde le cadrage d’origine sans libellé de type', () => {
    const prompts = buildPrompts(undefined);

    expect(prompts.extraction).toContain(
      'Vous êtes un agent d’extraction documentaire spécialisé dans les plans d’actions de transition écologique des collectivités, y compris les PCAET.'
    );
    expect(prompts.structuration).toContain(
      "Vous êtes un agent d'extraction documentaire spécialisé dans les plans d'actions de transition écologique des collectivités (PCAET, plans climat, plans de transition)."
    );
    expect(prompts.reperage).toContain(
      "d'un document de plan d'actions d'une collectivité (PCAET, plan climat, plan de transition)."
    );
    expect(prompts.consolidation).toContain(
      'Vous êtes un agent d’extraction documentaire spécialisé dans les plans d’actions de transition écologique des collectivités, y compris les PCAET.'
    );
    expect(prompts.enrichment).toContain(
      "Vous êtes un agent d'enrichissement documentaire spécialisé dans les plans d'actions de transition écologique des collectivités, y compris les PCAET."
    );
    expect(prompts.qualitativeReview).toContain(
      "Vous êtes un auditeur qualité spécialisé dans les plans d'actions de transition écologique."
    );
    for (const prompt of Object.values(prompts)) {
      expect(prompt).not.toContain('{cadrage}');
    }
  });

  it('nomme le type du plan et ne parle plus de PCAET dans la phrase de rôle', () => {
    const prompts = buildPrompts('Plan Mobilité');

    for (const prompt of Object.values(prompts)) {
      expect(prompt).toContain('plan de type « Plan Mobilité »');
      expect(prompt).not.toContain('{cadrage}');
      expect(prompt).not.toContain('y compris les PCAET');
      expect(prompt).not.toContain('(PCAET, plan');
    }
  });

  it('ne remplace pas un « {cadrage} » écrit dans le document', () => {
    const prompt = buildExtractionPrompt({
      text: 'Le {cadrage} du plan',
      instructions: '',
      disabledFields: [],
      currentDate: '08/06/2026',
      planTypeLabel: 'Plan Mobilité',
    });

    expect(prompt).toContain('Le {cadrage} du plan');
  });

  it('nomme le type dans le prompt des effets attendus, hors PCAET seulement', () => {
    const input = {
      renderedActions: 'actions',
      text: 'texte',
      effetsAttendus: [{ id: 1, nom: 'Effet', notice: null }],
    };

    expect(
      buildSecteursPrompt({
        ...input,
        withSecteurs: false,
        planTypeLabel: 'Plan Mobilité',
      })
    ).toContain('un plan d’action territorial de type « Plan Mobilité »');
    expect(buildSecteursPrompt({ ...input, withSecteurs: true })).toContain(
      'un plan climat-air-énergie territorial (PCAET)'
    );
  });
});
