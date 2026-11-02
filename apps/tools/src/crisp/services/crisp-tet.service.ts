import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import Crisp from 'crisp-api';
import ConfigurationService from '../../config/configuration.service';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';
import { CrispOperatorIndo } from '../models/get-crisp-operator.response';
import { CrispSessionMessage } from '../models/get-crisp-session-messages.response';
import { CrispSession } from '../models/get-crisp-session.response';
import {
  buildTetConversation,
  formatTetAnswer,
  formatTetError,
} from './build-crisp-tet-request';

/**
 * `/tet <question>` en note privée : l'assistant du backend répond, en note
 * privée, au nom de l'opérateur et sur l'utilisateur de la conversation.
 */
@Injectable()
export class CrispTetService {
  private readonly logger = new Logger(CrispTetService.name);
  private readonly crispClient: Crisp;

  constructor(
    configurationService: ConfigurationService,
    private readonly trpcClientService: TrpcClientService
  ) {
    this.crispClient = new Crisp();
    this.crispClient.authenticateTier(
      'plugin',
      configurationService.get('CRISP_TOKEN_IDENTIFIER'),
      configurationService.get('CRISP_TOKEN_KEY')
    );
  }

  /** Ne lève jamais : appelé sans attendre, la réponse prend 10 à 60 s. */
  async handleTetRequest(
    websiteId: string,
    sessionId: string,
    fingerprint: number
  ): Promise<void> {
    try {
      const messages: CrispSessionMessage[] =
        await this.crispClient.website.getMessagesInConversation(
          websiteId,
          sessionId
        );
      const conversation = buildTetConversation(messages, fingerprint);
      const operatorId = conversation?.note.user?.user_id;
      if (!conversation || !operatorId) {
        this.logger.warn(
          `/tet note ${fingerprint} not found through the Crisp API for session ${sessionId}: ignored`
        );
        return;
      }

      const [operator, session]: [CrispOperatorIndo, CrispSession] =
        await Promise.all([
          this.crispClient.website.getWebsiteOperator(websiteId, operatorId),
          this.crispClient.website.getConversation(websiteId, sessionId),
        ]);
      if (!operator?.email) {
        await this.sendNote(
          websiteId,
          sessionId,
          formatTetError("adresse e-mail de l'opérateur inconnue")
        );
        return;
      }

      await this.sendNote(websiteId, sessionId, '🔎 /tet : je cherche…');
      this.logger.log(`/tet asked in session ${sessionId} by ${operatorId}`);
      const answer = await this.trpcClientService
        .getClient()
        .assistant.askFromCrisp.mutate({
          operatorEmail: operator.email,
          question: conversation.question,
          visitorEmail: session.meta?.email || undefined,
          visitorMessages: conversation.visitorMessages,
          history: conversation.history,
        });
      await this.sendNote(websiteId, sessionId, formatTetAnswer(answer));
    } catch (error) {
      this.logger.error(
        `/tet failed for session ${sessionId} on website ${websiteId}: ${getErrorMessage(
          error
        )}`
      );
      await this.sendNote(
        websiteId,
        sessionId,
        formatTetError(getErrorMessage(error))
      ).catch((noteError: unknown) =>
        this.logger.error(
          `Could not send the /tet error note: ${getErrorMessage(noteError)}`
        )
      );
    }
  }

  private sendNote(websiteId: string, sessionId: string, content: string) {
    return this.crispClient.website.sendMessageInConversation(
      websiteId,
      sessionId,
      { type: 'note', from: 'operator', origin: 'chat', content }
    );
  }
}
