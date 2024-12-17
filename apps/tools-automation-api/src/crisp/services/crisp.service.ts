import { Injectable, Logger } from '@nestjs/common';
import Crisp from 'crisp-api';
import ConfigurationService from '../../config/configuration.service';
import { NotionBugCreatorService } from '../../notion/notion-bug-creator/notion-bug-creator.service';
import { CrispEventRequest } from '../models/crisp-event.request';
import { CrispSessionEventDataDto } from '../models/crisp-session-event-data.dto';
import { CrispSessionMessage } from '../models/get-crisp-session-messages.response';
import { CrispSession } from '../models/get-crisp-session.response';

@Injectable()
export class CrispService {
  private readonly logger = new Logger(CrispService.name);
  private readonly crispClient: Crisp;

  constructor(
    private readonly notionBugCreatorService: NotionBugCreatorService,
    private readonly configurationService: ConfigurationService
  ) {
    this.crispClient = new Crisp();
    this.crispClient.authenticateTier(
      'plugin',
      configurationService.get('CRISP_TOKEN_IDENTIFIER'),
      configurationService.get('CRISP_TOKEN_KEY')
    );
  }

  async handleSessionChange(body: CrispEventRequest<CrispSessionEventDataDto>) {
    // No need to verify crisp webhook signature because we are requesting the data from the Crisp API = no direct trust of webhook content

    const sessionId = body.data.session_id;
    const websiteId = body.website_id || body.data.website_id;
    this.logger.log(
      `Handling session change for session ${sessionId} on website ${websiteId}: ${JSON.stringify(
        body.data?.data
      )}`
    );

    const dataKeys = Object.keys(body.data.data || {});
    if (
      dataKeys.length === 1 &&
      dataKeys[0] === this.notionBugCreatorService.CRISP_DATA_TICKET_URL
    ) {
      this.logger.log(
        `Ignoring session change for session ${sessionId} on website ${websiteId} because it is the ticket URL update`
      );
      return;
    }

    const isTicketData = dataKeys.some((key) =>
      key.startsWith(this.notionBugCreatorService.CRISP_DATA_TICKET_PREFIX)
    );
    if (!isTicketData) {
      this.logger.log(
        `Session ${sessionId} on website ${websiteId} does not contain ticket data, skipping`
      );
      return;
    }

    const session: CrispSession =
      await this.crispClient.website.getConversation(websiteId, sessionId);
    if (!session.session_url) {
      // Session url are not provided by the Crisp API, we need to build it manually
      session.session_url = `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}`;
    }

    const messages: CrispSessionMessage[] =
      await this.crispClient.website.getMessagesInConversation(
        websiteId,
        sessionId
      );
    this.logger.log(
      `Found ${messages.length} messages in session ${sessionId} on website ${websiteId}`
    );

    const bugResponse =
      await this.notionBugCreatorService.createOrUpdateBugFromCrispSession(
        session,
        messages
      );

    if (
      !session.meta.data[this.notionBugCreatorService.CRISP_DATA_TICKET_URL]
    ) {
      this.logger.log(
        `Updating session ${sessionId} on website ${websiteId} with ticket URL ${
          bugResponse.url || bugResponse.id
        }`
      );
      await this.crispClient.website.updateConversationMetas(
        websiteId,
        sessionId,
        {
          data: {
            [this.notionBugCreatorService.CRISP_DATA_TICKET_URL]:
              bugResponse.url || bugResponse.id,
          },
        }
      );
    } else {
      this.logger.log(
        `Session ${sessionId} on website ${websiteId} already has ticket URL, skipping update`
      );
    }

    return { url: bugResponse.url };
  }
}
