import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { Result, success } from '@tet/backend/utils/result.type';
import { CategorieAction, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import {
  MOBILISATION_SYSTEM_INSTRUCTION,
  mobilisationPrompt,
} from '../../prompts/mobilisation.prompt';
import {
  mobilisationResponseSchema,
  Note,
} from './calculate-mobilisation.schema';
import { LevierVolets } from './group-volets-by-levier';
import { FicheToScore, renderVoletActions } from './render-volet-actions';
import {
  CATEGORIES_IN_PROMPT_ORDER,
  toCategorieRank,
} from './volet-categories';

export const MOBILISATION_THINKING_BUDGET = 512;

export type ScoredVolet = {
  categorie: CategorieAction;
  note: Note;
  ficheIds: number[];
};

export type LevierMobilisation = {
  levierId: LevierVolets['levierId'];
  volets: ScoredVolet[];
  tokens: TokenUsage;
};

export type CalculateMobilisationInput = {
  levierVolets: LevierVolets;
  fichesById: Map<number, FicheToScore>;
  collectiviteNom: string;
  population: number | null;
  signal?: AbortSignal;
};

export const POPULATION_INCONNUE = 'inconnue';

export const calculateMobilisation = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    levierVolets,
    fichesById,
    collectiviteNom,
    population,
    signal,
  }: CalculateMobilisationInput
): Promise<Result<LevierMobilisation, LlmError>> => {
  const { levierId, ficheIdsByCategorie } = levierVolets;

  const completion = await llm.generateStructured({
    prompt: generatePrompt(mobilisationPrompt, {
      collectiviteNom,
      population: population === null ? POPULATION_INCONNUE : `${population}`,
      levier: LEVIER_NOM_BY_ID[levierId],
      actionsParCategorie: renderVoletActions({
        ficheIdsByCategorie,
        fichesById,
      }),
    }),
    systemInstruction: MOBILISATION_SYSTEM_INSTRUCTION,
    schema: mobilisationResponseSchema,
    thinkingBudget: MOBILISATION_THINKING_BUDGET,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  const notes = completion.data.data;

  return success({
    levierId,
    volets: CATEGORIES_IN_PROMPT_ORDER.map((categorie) => {
      const ficheIds = ficheIdsByCategorie[categorie];
      const rank = `${toCategorieRank(categorie)}` as keyof typeof notes;

      return {
        categorie,
        note: ficheIds.length === 0 ? 0 : notes[rank],
        ficheIds,
      };
    }),
    tokens: completion.data.tokens,
  });
};
