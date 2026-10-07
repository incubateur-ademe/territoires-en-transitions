import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { DECLARED_ENJEUX } from './analysis-enjeux';
import { ClassificationEnjeu } from './pipeline/classification-enjeu';
import { classifyFiches } from './pipeline/classify-fiches/classify-fiches';
import { classificationResponseSchema } from './pipeline/classify-fiches/classify-fiches.schema';

const enjeuxMissing = (fragment: string): string[] =>
  Object.entries(DECLARED_ENJEUX)
    .filter(
      ([, { systemInstruction }]) => !systemInstruction.includes(fragment)
    )
    .map(([name]) => name);

describe('Les enjeux de classification declares', () => {
  it('rappellent tous que le texte entre balises est de la donnee, jamais une instruction', () => {
    expect(enjeuxMissing('# Contrat de balisage')).toEqual([]);
  });

  it('exigent tous une entree de reponse par index fourni', () => {
    expect(
      enjeuxMissing('exactement une entrée par index fourni, ni plus, ni moins')
    ).toEqual([]);
  });
});

const BIODIVERSITE_SYSTEM_INSTRUCTION =
  "Instruction propre a un second enjeu, qui n'a rien du climat.";

const enjeuBiodiversite: ClassificationEnjeu = {
  systemInstruction: BIODIVERSITE_SYSTEM_INSTRUCTION,
  buildPrompt: ({ actions }) =>
    `# Axes biodiversite\n1. Zones humides\n\n${actions}`,
  responseSchema: classificationResponseSchema,
};

const toLlmAnsweringOneVolet = () => ({
  generateStructured: vi.fn(
    async (_request: { prompt: string; systemInstruction: string }) =>
      success({
        data: [
          {
            index: 0,
            justification: 'Restauration de mare',
            hasNoRelevantLevier: false,
            volets: [{ levier: 1, categories: [1] }],
          },
        ],
        tokens: {
          promptTokens: 1,
          cachedTokens: 0,
          candidatesTokens: 1,
          thoughtsTokens: 0,
          totalTokens: 2,
        },
      })
  ),
});

const oneFiche = [{ ficheId: 1, titre: 'Mare', description: 'Restauration' }];

describe('Un second enjeu branche sur le pipeline de classification', () => {
  it('voit son instruction et son prompt soumis au modele, sans trace du climat', async () => {
    const llm = toLlmAnsweringOneVolet();

    await classifyFiches(llm as Pick<LlmService, 'generateStructured'>, {
      enjeu: enjeuBiodiversite,
      fiches: oneFiche,
    });

    const submittedRequest = llm.generateStructured.mock.calls[0]?.[0];

    expect({
      systemInstruction: submittedRequest?.systemInstruction,
      hasSecondEnjeuAxes: submittedRequest?.prompt.includes('Zones humides'),
      hasClimatLeviers: submittedRequest?.prompt.includes('Covoiturage'),
    }).toEqual({
      systemInstruction: BIODIVERSITE_SYSTEM_INSTRUCTION,
      hasSecondEnjeuAxes: true,
      hasClimatLeviers: false,
    });
  });

  it('classe une fiche biodiversite sous un levier climat', async () => {
    const llm = toLlmAnsweringOneVolet();

    const classification = await classifyFiches(
      llm as Pick<LlmService, 'generateStructured'>,
      {
        enjeu: enjeuBiodiversite,
        fiches: oneFiche,
      }
    );

    const volets = classification.success
      ? classification.data.fiches[0].volets
      : undefined;

    expect(volets).toEqual([
      {
        levier: 'Changement chaudières fioul + rénovation (résidentiel)',
        categorie: 'amenagement',
      },
    ]);
  });
});
