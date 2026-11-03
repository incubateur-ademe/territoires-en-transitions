import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { DECLARED_ENJEUX } from './analysis-enjeux';
import { ClassificationEnjeu } from './pipeline/classification-enjeu';
import { classifyFiche } from './pipeline/classify-fiche/classify-fiche';
import { ficheClassificationSchema } from './pipeline/classify-fiche/classify-fiche.schema';

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
});

const BIODIVERSITE_SYSTEM_INSTRUCTION =
  "Instruction propre a un second enjeu, qui n'a rien du climat.";

const enjeuBiodiversite: ClassificationEnjeu = {
  systemInstruction: BIODIVERSITE_SYSTEM_INSTRUCTION,
  responseSchema: ficheClassificationSchema,
};

const toLlmAnsweringOneVolet = () => ({
  generateStructured: vi.fn(
    async (_request: { prompt: string; systemInstruction: string }) =>
      success({
        data: {
          leviers: [
            {
              levier: 'chaudieres_fioul_renovation_residentiel' as const,
              categories: [1 as const],
            },
          ],
        },
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

const mare = {
  ficheId: 1,
  titre: 'Mare',
  description: 'Restauration',
  axePaths: [['Plan biodiversite', 'Zones humides']],
};

describe('Un second enjeu branche sur le pipeline de classification', () => {
  it('voit son instruction soumise au modele, sans trace du climat', async () => {
    const llm = toLlmAnsweringOneVolet();

    await classifyFiche(llm as Pick<LlmService, 'generateStructured'>, {
      enjeu: enjeuBiodiversite,
      fiche: mare,
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

    const classification = await classifyFiche(
      llm as Pick<LlmService, 'generateStructured'>,
      { enjeu: enjeuBiodiversite, fiche: mare }
    );

    const volets = classification.success
      ? classification.data.fiche.volets
      : undefined;

    expect(volets).toEqual([
      {
        levier: 'Changement chaudières fioul + rénovation (résidentiel)',
        categorie: 'amenagement',
      },
    ]);
  });
});
