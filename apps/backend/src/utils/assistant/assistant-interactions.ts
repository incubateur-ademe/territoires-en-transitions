import { LlmToolCall } from '@tet/backend/utils/llm/llm-chat';
import {
  PROPOSE_CHOICES_TOOL,
  proposeChoicesInputSchema,
} from '@tet/backend/utils/mcp/tools/propose-choices/propose-choices.tool';
import { PREPARE_SEGMENT_TAGGING_TOOL } from '@tet/backend/utils/mcp/tools/support-crisp/prepare-segment-tagging.tool';
import {
  PrepareSegmentTaggingOutput,
  prepareSegmentTaggingOutputSchema,
} from '@tet/backend/utils/mcp/tools/support-crisp/prepare-segment-tagging.service';

/** Question et réponses cliquables affichées sous la réponse. */
export type AssistantSuggestions = { question: string; options: string[] };

/** Écriture préparée par l'assistant, que l'utilisateur confirme d'un clic. */
export type AssistantPendingAction = {
  kind: 'add_segment';
  actionToken: string;
} & Pick<
  PrepareSegmentTaggingOutput,
  | 'segment'
  | 'segmentExistant'
  | 'conversations'
  | 'dejaTaguees'
  | 'dateFrom'
  | 'dateTo'
  | 'expireA'
>;

export const readProposedChoices = (
  call: LlmToolCall
): AssistantSuggestions | null => {
  if (call.name !== PROPOSE_CHOICES_TOOL) {
    return null;
  }
  const parsed = proposeChoicesInputSchema.safeParse(call.arguments);
  return parsed.success ? parsed.data : null;
};

/**
 * Repli : gpt-oss écrit parfois les arguments de `propose_choices` en texte
 * au lieu d'appeler l'outil. Une réponse qui n'est que ce JSON devient des
 * choix cliquables.
 */
export const readChoicesFromText = (
  text: string | null | undefined
): AssistantSuggestions | null => {
  const trimmed = text
    ?.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  if (!trimmed?.startsWith('{')) {
    return null;
  }
  try {
    const parsed = proposeChoicesInputSchema.safeParse(JSON.parse(trimmed));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/**
 * Sort le jeton d'un ajout de segment préparé : il part dans la réponse pour
 * le bouton de confirmation, le modèle n'en voit qu'une mention (il est long
 * et ne lui sert à rien).
 */
export const extractPendingAction = (
  call: LlmToolCall,
  resultText: string
): { action: AssistantPendingAction; textForModel: string } | null => {
  if (call.name !== PREPARE_SEGMENT_TAGGING_TOOL) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(resultText);
  } catch {
    return null;
  }
  const parsed = prepareSegmentTaggingOutputSchema.safeParse(json);
  if (!parsed.success) {
    return null;
  }
  const { actionToken, ...rest } = parsed.data;
  if (!actionToken) {
    return null;
  }
  return {
    action: {
      kind: 'add_segment',
      actionToken,
      segment: rest.segment,
      segmentExistant: rest.segmentExistant,
      conversations: rest.conversations,
      dejaTaguees: rest.dejaTaguees,
      dateFrom: rest.dateFrom,
      dateTo: rest.dateTo,
      expireA: rest.expireA,
    },
    textForModel: JSON.stringify({
      ...rest,
      confirmation:
        "Bouton de confirmation affiché à l'utilisateur sous ta réponse.",
    }),
  };
};
