import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { CrispApiClient } from './crisp-api.client';
import { SupportCrispError } from './support-crisp.errors';
import { summarizeConversation } from './support-segments.rules';

export const listUserSupportConversationsInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .describe("E-mail de l'usager, tel qu'il figure dans le contexte"),
});
export type ListUserSupportConversationsInput = z.infer<
  typeof listUserSupportConversationsInputSchema
>;

const summarySchema = z.object({
  date: z.string(),
  resolue: z.boolean(),
  segments: z.array(z.string()),
  demande: z.string(),
  reponseSupport: z.string().nullable(),
  incomplet: z
    .boolean()
    .describe(
      'Messages illisibles dans Crisp : demande et réponse inconnues, pas absentes'
    ),
});

export const listUserSupportConversationsOutputSchema = z.object({
  conversations: z
    .number()
    .describe("Conversations de l'usager trouvées dans Crisp"),
  nonLues: z
    .number()
    .describe(
      "Conversations parmi les plus récentes que Crisp n'a pas renvoyées"
    ),
  historique: z
    .array(summarySchema)
    .describe(
      "Les plus récentes d'abord ; la conversation en cours en fait partie"
    ),
});
export type ListUserSupportConversationsOutput = z.infer<
  typeof listUserSupportConversationsOutputSchema
>;

const MAX_CONVERSATIONS = 10;
const CONCURRENCY = 3;

/**
 * Historique des échanges d'un usager avec le support, dans Crisp. Réservé
 * aux comptes support (`utils.mcp.read`) ; l'e-mail n'est pas renvoyé.
 */
@Injectable()
export class ListUserSupportConversationsService {
  constructor(
    private readonly crispApiClient: CrispApiClient,
    private readonly permissionService: PermissionService
  ) {}

  async run(
    input: ListUserSupportConversationsInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListUserSupportConversationsOutput, SupportCrispError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }
    if (!this.crispApiClient.isConfigured()) {
      return failure('CRISP_NOT_CONFIGURED');
    }

    const ids = await this.crispApiClient.listPeopleSessionIds(input.email);
    if (!ids.success) {
      return ids;
    }

    const historique: (ListUserSupportConversationsOutput['historique'][number] & {
      createdAt: number;
    })[] = [];
    let nonLues = 0;
    const queue = ids.data.slice(0, MAX_CONVERSATIONS);
    let index = 0;
    const worker = async () => {
      while (index < queue.length) {
        const sessionId = queue[index++];
        const conversation = await this.crispApiClient.getConversation(
          sessionId
        );
        if (!conversation.success) {
          nonLues += 1;
          continue;
        }
        const messages = await this.crispApiClient.listMessages(
          conversation.data
        );
        historique.push({
          ...summarizeConversation(
            conversation.data,
            messages.success ? messages.data : []
          ),
          incomplet: !messages.success,
          createdAt: conversation.data.created_at,
        });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    return success({
      conversations: ids.data.length,
      nonLues,
      historique: historique
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ createdAt: _createdAt, ...summary }) => summary),
    });
  }
}
