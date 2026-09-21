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
import { sanitize } from '../classify-fiches/render-fiches-text';
import {
  FicheToScore,
  renderVoletActions,
  resolveFichesByCategorie,
} from './render-volet-actions';
import {
  CATEGORIE_RANKS,
  CATEGORIES_IN_PROMPT_ORDER,
} from './volet-categories';

export const MOBILISATION_THINKING_BUDGET = 512;

export type ScoredVolet = {
  categorie: CategorieAction;
  note: Note;
  ficheIds: number[];
};

export type LevierScore = {
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

export const UNKNOWN_POPULATION_LABEL = 'inconnue';

export const calculateMobilisation = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    levierVolets,
    fichesById,
    collectiviteNom,
    population,
    signal,
  }: CalculateMobilisationInput
): Promise<Result<LevierScore, LlmError>> => {
  const { levierId, ficheIdsByCategorie } = levierVolets;

  const fichesByCategorie = resolveFichesByCategorie({
    ficheIdsByCategorie,
    fichesById,
  });

  const populationLabel =
    population === null ? UNKNOWN_POPULATION_LABEL : `${population}`;

  const completion = await llm.generateStructured({
    prompt: generatePrompt(mobilisationPrompt, {
      collectiviteNom: sanitize(collectiviteNom),
      population: populationLabel,
      levier: LEVIER_NOM_BY_ID[levierId],
      actionsParCategorie: renderVoletActions(fichesByCategorie),
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
      const fiches = fichesByCategorie[categorie];
      const isCategorieEmpty = fiches.length === 0;

      return {
        categorie,
        note: isCategorieEmpty ? 0 : notes[CATEGORIE_RANKS[categorie]],
        ficheIds: fiches.map(({ ficheId }) => ficheId),
      };
    }),
    tokens: completion.data.tokens,
  });
};
