import { getErrorMessage } from '@/backend/utils/get-error-message';
import { AirtableService } from '@/tools/airtable/airtable.service';
import { CrispMessageReceivedEventDataDto } from '@/tools/crisp/models/crisp-message-received-event-data.dto';
import { CrispOperatorIndo } from '@/tools/crisp/models/get-crisp-operator.response';
import { Injectable, Logger } from '@nestjs/common';
import Crisp from 'crisp-api';
import { DateTime } from 'luxon';
import ConfigurationService from '../../config/configuration.service';
import { NotionBugCreatorService } from '../../notion/notion-bug-creator/notion-bug-creator.service';
import { CrispEventRequest } from '../models/crisp-event.request';
import { CrispSessionMessage } from '../models/get-crisp-session-messages.response';
import { CrispSession } from '../models/get-crisp-session.response';

@Injectable()
export class CrispService {
  private readonly logger = new Logger(CrispService.name);
  private readonly crispClient: Crisp;

  private readonly TICKET_REGEXP =
    /^ticket(?:\s*(\d*)([jh]))?(?:\s*\:\s*(.*))?/i;
  private readonly DEFAULT_TICKET_DAYS = 2;

  private readonly FEEDBACK_REGEXP = /^feedback(?:\s*(\d*)([jh]))?/i;
  private readonly DEFAULT_FEEDBACK_DAYS = 2;

  constructor(
    private readonly notionBugCreatorService: NotionBugCreatorService,
    private readonly configurationService: ConfigurationService,
    private readonly airtableService: AirtableService
  ) {
    this.crispClient = new Crisp();
    this.crispClient.authenticateTier(
      'plugin',
      configurationService.get('CRISP_TOKEN_IDENTIFIER'),
      configurationService.get('CRISP_TOKEN_KEY')
    );
  }

  async getSessionMessages(
    sessionId: string,
    websiteId: string,
    delay: number,
    delayUnit: 'j' | 'h'
  ): Promise<{
    filteredMessages: CrispSessionMessage[];
    allMessages: CrispSessionMessage[];
  }> {
    const allMessages: CrispSessionMessage[] =
      await this.crispClient.website.getMessagesInConversation(
        websiteId,
        sessionId
      );
    this.logger.log(
      `Found ${allMessages.length} messages in session ${sessionId} on website ${websiteId}`
    );
    let startTime = DateTime.now().setZone('Europe/Paris');

    if (delayUnit === 'j') {
      startTime = startTime.minus({ days: delay }).startOf('day');
    } else if (delayUnit === 'h') {
      startTime = startTime.minus({ hours: delay });
    }
    const filteredMessages = allMessages.filter(
      (message) =>
        message.type === 'text' && message.timestamp >= startTime.toMillis()
    );
    this.logger.log(
      `Filtered messages in session ${sessionId} on website ${websiteId} to ${filteredMessages.length} messages (start time ${startTime})`
    );

    return { filteredMessages, allMessages };
  }

  async handleMessageReceived(
    body: CrispEventRequest<CrispMessageReceivedEventDataDto>
  ) {
    // No need to verify crisp webhook signature because we are requesting the data from the Crisp API = no direct trust of webhook content

    const messageId = body.data.fingerprint;
    const sessionId = body.data.session_id;
    const websiteId = body.website_id || body.data.website_id;
    this.logger.log(
      `Handling message ${body.data.type} (identifiant ${messageId}) received from ${body.data.from} for session ${sessionId} on website ${websiteId}: `
    );

    if (body.data.from !== 'operator' || body.data.type !== 'note') {
      this.logger.log(
        `Ignoring message received for session ${sessionId} on website ${websiteId} because it's not from an operator`
      );
      return;
    } else {
      this.logger.log(
        `Note received for session ${sessionId} on website ${websiteId} from operator: ${JSON.stringify(
          body.data
        )}`
      );
    }

    const content = body.data.content?.trim() || '';
    const ticketMatch = content.match(this.TICKET_REGEXP);
    const feedbackMatch = content.match(this.FEEDBACK_REGEXP);
    if (ticketMatch) {
      return await this.handleTicketCreationRequest(
        websiteId,
        sessionId,
        messageId,
        ticketMatch
      );
    } else if (feedbackMatch) {
      return await this.handleFeedbackCreationRequest(
        websiteId,
        sessionId,
        messageId,
        feedbackMatch
      );
    } else {
      this.logger.log(
        `Ignoring message received for session ${sessionId} on website ${websiteId} because it doesn't match ticket or feedback`
      );

      return {
        type: 'none',
      };
    }
  }

  async handleTicketCreationRequest(
    websiteId: string,
    sessionId: string,
    messageId: number,
    ticketMatch: RegExpMatchArray
  ) {
    try {
      const delay =
        ticketMatch.length >= 1 && ticketMatch[1]
          ? parseInt(ticketMatch[1])
          : this.DEFAULT_TICKET_DAYS;
      const delayUnit: 'j' | 'h' =
        ticketMatch.length >= 2 && ticketMatch[2]
          ? (ticketMatch[2].toLowerCase() as 'j' | 'h')
          : 'j';

      const ticketTitle = ticketMatch.length >= 3 ? ticketMatch[3] : null;

      this.logger.log(
        `Ticket found in message received for session ${sessionId} on website ${websiteId}: ${ticketMatch[0]} (delay ${delay}${delayUnit}, title ${ticketTitle})`
      );

      const session: CrispSession =
        await this.crispClient.website.getConversation(websiteId, sessionId);

      // Session url are not provided by the Crisp API, we need to build it manually
      // Besides, we add a query parameter so that the url is unique for a note
      session.session_url = `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}?message=${messageId}`;

      const { filteredMessages, allMessages } = await this.getSessionMessages(
        sessionId,
        websiteId,
        delay,
        delayUnit
      );

      const { bug, created } =
        await this.notionBugCreatorService.createBugFromCrispSession(
          session,
          filteredMessages,
          ticketTitle
        );

      if (created) {
        this.logger.log(
          `Sending ticket note for session ${sessionId} on website ${websiteId} with ticket URL ${
            bug.url || bug.id
          }`
        );
        await this.crispClient.website.sendMessageInConversation(
          websiteId,
          sessionId,
          {
            type: 'note',
            from: 'operator',
            origin: 'chat',
            content: `Url du ticket: ${bug.url || bug.id}`,
          }
        );
      } else {
        this.logger.log(
          `Ticket already exists for session ${sessionId} on website ${websiteId}: ${bug.url}, do not send note`
        );
      }

      return { type: 'ticket', url: bug.url, created };
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error creating ticket from session ${sessionId} on website ${websiteId}: ${getErrorMessage(
          error
        )}`
      );

      await this.crispClient.website.sendMessageInConversation(
        websiteId,
        sessionId,
        {
          type: 'note',
          from: 'operator',
          origin: 'chat',
          content: `Error creating ticket: ${getErrorMessage(error)}`,
        }
      );
    }
  }

  async handleFeedbackCreationRequest(
    websiteId: string,
    sessionId: string,
    messageId: number,
    feedbackMatch: RegExpMatchArray
  ) {
    try {
      const delay =
        feedbackMatch.length >= 1 && feedbackMatch[1]
          ? parseInt(feedbackMatch[1])
          : this.DEFAULT_FEEDBACK_DAYS;
      const delayUnit: 'j' | 'h' =
        feedbackMatch.length >= 2 && feedbackMatch[2]
          ? (feedbackMatch[2].toLowerCase() as 'j' | 'h')
          : 'j';

      this.logger.log(
        `Feedback found in message received for session ${sessionId} on website ${websiteId}: ${feedbackMatch[0]} (delay ${delay}${delayUnit})`
      );

      const session: CrispSession =
        await this.crispClient.website.getConversation(websiteId, sessionId);
      // Session url are not provided by the Crisp API, we need to build it manually
      // Besides, we add a query parameter so that the url is unique for a note
      session.session_url = `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}?message=${messageId}`;

      const { filteredMessages, allMessages } = await this.getSessionMessages(
        sessionId,
        websiteId,
        delay,
        delayUnit
      );

      // Retrieve operator email from Crisp API
      const operator = allMessages.findLast(
        (message) => message.from === 'operator' && message.user
      )?.user;
      if (operator) {
        if (operator.user_id && !operator.email) {
          this.logger.log(
            `Retrieving operator ${operator.user_id} email from Crisp API`
          );
          const operatorInfo: CrispOperatorIndo =
            await this.crispClient.website.getWebsiteOperator(
              websiteId,
              operator.user_id
            );
          this.logger.log(
            `Operator ${operator.user_id} info: ${JSON.stringify(operatorInfo)}`
          );
          operator.email = operatorInfo.email;
        } else {
          this.logger.log(
            `Operator ${operator.user_id} email already retrieved: ${operator.email}`
          );
        }
      } else {
        this.logger.log(
          `No operator found in messages for session ${sessionId} on website ${websiteId}`
        );
      }

      const { feedback, created } =
        await this.airtableService.createFeedbackFromCrispSession(
          session,
          filteredMessages,
          operator
        );

      if (created) {
        this.logger.log(
          `Sending feedback note for session ${sessionId} on website ${websiteId} with feedback URL ${
            feedback.url || feedback.id
          }`
        );
        await this.crispClient.website.sendMessageInConversation(
          websiteId,
          sessionId,
          {
            type: 'note',
            from: 'operator',
            origin: 'chat',
            content: `Url du feedback: ${feedback.url || feedback.id}`,
          }
        );
      } else {
        this.logger.log(
          `Feedback already exists for session ${sessionId} on website ${websiteId}: ${feedback.url}, do not send note`
        );
      }

      return { type: 'feedback', url: feedback.url, created };
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error creating feedback from session ${sessionId} on website ${websiteId}: ${getErrorMessage(
          error
        )}`
      );

      await this.crispClient.website.sendMessageInConversation(
        websiteId,
        sessionId,
        {
          type: 'note',
          from: 'operator',
          origin: 'chat',
          content: `Error creating feedback: ${getErrorMessage(error)}`,
        }
      );
    }
  }
}
