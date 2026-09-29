import { NotFoundException } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { LEVIER_NOM_BY_ID, LevierId } from '@tet/domain/shared';
import { describe, expect, it, Mock, vi } from 'vitest';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';
import { ScoreMobilisationService } from './score-mobilisation.service';

const collectiviteId = 7;

const mobilisationTokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const scoredLevierCompletion = success({
  data: { '1': 3, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
  tokens: mobilisationTokens,
});

const toInput = (
  volets: CalculateCollectiviteMobilisationInput['volets']
): CalculateCollectiviteMobilisationInput => ({
  enjeu: 'ges',
  collectiviteId,
  volets,
  fiches: [
    { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
    { ficheId: 2, titre: 'Aires de covoiturage', description: null },
  ],
});

type ServiceUnderTest = {
  service: ScoreMobilisationService;
  llm: { generateStructured: Mock };
};

const toServiceUnderTest = ({
  collectiviteReadFailure,
  unscoredLevierId,
}: {
  collectiviteReadFailure?: 'not_found' | Error;
  unscoredLevierId?: LevierId;
} = {}): ServiceUnderTest => {
  const collectivitesService = {
    getCollectivite: vi.fn().mockImplementation(async () => {
      if (collectiviteReadFailure === 'not_found') {
        throw new NotFoundException(`Collectivite ${collectiviteId} not found`);
      }
      if (collectiviteReadFailure instanceof Error) {
        throw collectiviteReadFailure;
      }
      return { collectivite: { nom: 'Ville de test', population: 3000 } };
    }),
  };
  const generateStructured = vi
    .fn()
    .mockImplementation(async ({ prompt }: { prompt: string }) => {
      const isPromptForUnscoredLevier =
        unscoredLevierId !== undefined &&
        prompt.includes(LEVIER_NOM_BY_ID[unscoredLevierId]);
      return isPromptForUnscoredLevier
        ? failure({ kind: 'rate_limited' })
        : scoredLevierCompletion;
    });
  const llm = { generateStructured };

  const collectivitesServiceDependency =
    collectivitesService as unknown as CollectivitesService;
  const llmDependency = llm as unknown as LlmService;
  const service = new ScoreMobilisationService(
    collectivitesServiceDependency,
    llmDependency
  );

  return { service, llm };
};

describe('daily-ct-check', () => {
  it("renvoie l'engagement d'une CT calculé à partir de ses volets et du texte de ses fiches, sans job d'analyse", async () => {
    const { service, llm } = toServiceUnderTest();

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        {
          ficheId: 1,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ])
    );

    const [{ prompt }] = llm.generateStructured.mock.calls[0];
    expect({
      result,
      promptCitesFiche: prompt.includes('Pistes cyclables'),
    }).toEqual({
      result: {
        success: true,
        data: {
          leviers: [
            {
              levierId: 'velo_transport_commun',
              volets: [
                { categorie: 'amenagement', note: 3, ficheIds: [1] },
                { categorie: 'planification', note: 0, ficheIds: [] },
                { categorie: 'financement', note: 0, ficheIds: [] },
                { categorie: 'gouvernance', note: 0, ficheIds: [] },
                { categorie: 'exemplarite', note: 0, ficheIds: [] },
                { categorie: 'sensibilisation', note: 0, ficheIds: [] },
              ],
            },
          ],
        },
      },
      promptCitesFiche: true,
    });
  });

  it("renvoie un engagement vide pour une CT qui n'a plus aucun volet", async () => {
    const { service, llm } = toServiceUnderTest();

    const result = await service.calculateCollectiviteMobilisation(toInput([]));

    expect({
      result,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      result: { success: true, data: { leviers: [] } },
      llmCalls: 0,
    });
  });

  it("n'appelle pas le LLM pour un levier dont aucune fiche ne figure parmi les textes reçus", async () => {
    const { service, llm } = toServiceUnderTest();

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        { ficheId: 99, levierId: 'covoiturage', categorie: 'amenagement' },
      ])
    );

    expect({
      result,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      result: { success: true, data: { leviers: [] } },
      llmCalls: 0,
    });
  });

  it("n'écrit pas l'engagement calculé", async () => {
    const { service } = toServiceUnderTest();

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        {
          ficheId: 1,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ])
    );

    expect({
      constructorDependencies: ScoreMobilisationService.length,
      success: result.success,
    }).toEqual({ constructorDependencies: 2, success: true });
  });

  it("renvoie leviers_not_scored quand un levier n'a pas pu être noté", async () => {
    const { service } = toServiceUnderTest({ unscoredLevierId: 'covoiturage' });

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        {
          ficheId: 1,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
        { ficheId: 2, levierId: 'covoiturage', categorie: 'amenagement' },
      ])
    );

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'leviers_not_scored',
        collectiviteId,
        unscored: [{ levierId: 'covoiturage', kind: 'rate_limited' }],
      },
    });
  });

  it('renvoie collectivite_not_found pour une CT introuvable', async () => {
    const { service, llm } = toServiceUnderTest({
      collectiviteReadFailure: 'not_found',
    });

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        {
          ficheId: 1,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ])
    );

    expect({
      result,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      result: {
        success: false,
        error: { kind: 'collectivite_not_found', collectiviteId },
      },
      llmCalls: 0,
    });
  });

  it("renvoie collectivite_read_failed quand la lecture de la CT échoue pour une autre raison qu'une absence", async () => {
    const connectionLost = new Error('database connection lost');
    const { service, llm } = toServiceUnderTest({
      collectiviteReadFailure: connectionLost,
    });

    const result = await service.calculateCollectiviteMobilisation(
      toInput([
        {
          ficheId: 1,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ])
    );

    expect({
      result,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      result: {
        success: false,
        error: { kind: 'collectivite_read_failed', collectiviteId },
        cause: connectionLost,
      },
      llmCalls: 0,
    });
  });
});
