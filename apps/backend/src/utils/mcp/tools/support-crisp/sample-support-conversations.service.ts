import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { CrispMessage, CrispApiClient } from './crisp-api.client';
import { SupportCrispError } from './support-crisp.errors';
import { supportConversationsFilterSchema } from './support-crisp.input';
import { SupportConversationsService } from './support-conversations.service';
import {
  isHumanOperatorMessage,
  segmentMatchesSujet,
  spreadSample,
  SUPPORT_SEGMENT_TYPES,
  toExcerpt,
} from './support-segments.rules';

export const sampleSupportConversationsInputSchema =
  supportConversationsFilterSchema.extend({
    type: z
      .enum(SUPPORT_SEGMENT_TYPES)
      .nullish()
      .describe('Type de retour : ne garder que les conversations de ce type'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .nullish()
      .describe(
        'Conversations renvoyées, réparties sur la période (30 par défaut)'
      ),
  });
export type SampleSupportConversationsInput = z.input<
  typeof sampleSupportConversationsInputSchema
>;

export const sampleSupportConversationsOutputSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  conversations: z.number().describe('Conversations correspondant au filtre'),
  echantillon: z.array(
    z.object({
      date: z.string(),
      resolue: z.boolean(),
      segments: z.array(z.string()),
      demande: z
        .string()
        .describe("Premiers messages de l'usager, sans e-mail ni téléphone"),
      reponseSupport: z
        .string()
        .nullable()
        .describe(
          "Dernier message d'un opérateur humain ; null si seul le bot a répondu"
        ),
    })
  ),
});
export type SampleSupportConversationsOutput = z.infer<
  typeof sampleSupportConversationsOutputSchema
>;

const DEFAULT_LIMIT = 30;
const DEMANDE_MAX_LENGTH = 400;
const REPONSE_MAX_LENGTH = 250;
const MESSAGE_CONCURRENCY = 6;

/**
 * Extraits de conversations du support pour en synthétiser les retours. Les
 * e-mails et téléphones sont masqués ; ni nom ni adresse du visiteur.
 */
@Injectable()
export class SampleSupportConversationsService {
  constructor(
    private readonly supportConversationsService: SupportConversationsService,
    private readonly crispApiClient: CrispApiClient
  ) {}

  async run(
    rawInput: SampleSupportConversationsInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<SampleSupportConversationsOutput, SupportCrispError>> {
    const input = sampleSupportConversationsInputSchema.parse(rawInput);
    const loaded = await this.supportConversationsService.select(input, {
      user,
    });
    if (!loaded.success) {
      return loaded;
    }
    const { sujet, type } = input;
    const matching = loaded.data.selected.filter(
      (conversation) =>
        !type ||
        conversation.segments.some(
          (segment) =>
            segment.kind === 'classement' &&
            segment.type === type &&
            (!sujet || segmentMatchesSujet(segment, sujet))
        )
    );

    const sample = spreadSample(matching, input.limit ?? DEFAULT_LIMIT);
    const echantillon: SampleSupportConversationsOutput['echantillon'] = [];
    let index = 0;
    const worker = async () => {
      while (index < sample.length) {
        const conversation = sample[index++];
        const messages = await this.crispApiClient.listMessages(conversation);
        if (!messages.success) {
          continue;
        }
        const demande = textOf(
          messages.data.filter((message) => message.from === 'user')
        ).slice(0, 3);
        const reponse = textOf(
          messages.data.filter(
            (message) =>
              isHumanOperatorMessage(message) && message.type === 'text'
          )
        ).at(-1);
        echantillon.push({
          date: new Date(conversation.created_at).toISOString().slice(0, 10),
          resolue: conversation.state === 'resolved',
          segments: conversation.segments
            .filter((segment) => segment.kind !== 'parcours')
            .map((segment) => segment.normalized),
          demande: toExcerpt(demande.join(' / '), DEMANDE_MAX_LENGTH),
          reponseSupport: reponse
            ? toExcerpt(reponse, REPONSE_MAX_LENGTH)
            : null,
        });
      }
    };
    await Promise.all(
      Array.from({ length: MESSAGE_CONCURRENCY }, () => worker())
    );

    return success({
      dateFrom: loaded.data.dateFrom,
      dateTo: loaded.data.dateTo,
      conversations: matching.length,
      echantillon: echantillon.sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
}

const textOf = (messages: CrispMessage[]): string[] =>
  messages
    .filter(
      (message) =>
        message.type === 'text' &&
        typeof message.content === 'string' &&
        message.content.trim()
    )
    .map((message) => message.content as string);
