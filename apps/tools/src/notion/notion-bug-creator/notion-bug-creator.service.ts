import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  BlockObjectResponse,
  Client,
  CreatePageParameters,
  DataSourceObjectResponse,
  isFullBlock,
  isFullDatabase,
  isFullDataSource,
  isFullPage,
} from '@notionhq/client';
import { DateTime } from 'luxon';
import slugify from 'slugify';
import ConfigurationService from '../../config/configuration.service';
import {
  CrispSessionMessage,
  CrispSessionMessageContent,
  CrispSessionMessageType,
} from '../../crisp/models/get-crisp-session-messages.response';
import { CrispSession } from '../../crisp/models/get-crisp-session.response';
import { sleep } from '../../utils/sleep.utils';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';

@Injectable()
export class NotionBugCreatorService {
  private logger = new Logger(NotionBugCreatorService.name);
  private readonly notion: Client;
  private readonly dataSourceIdCache = new Map<string, string>();
  private readonly validatedTemplateDataSources = new Set<string>();

  readonly CRISP_DATA_TICKET_PREFIX = 'ticket-';
  readonly CRISP_DATA_TICKET_URL = 'ticket-url';
  readonly CRISP_EXCHANGES_CALLOUT_TEXT = 'Echanges Crisp';
  readonly CRISP_INFORMATIONS_CALLOUT_TEXT = 'Informations';
  private readonly templateBlocksPollDelaysMs = [300, 500, 1000];
  private readonly templateBlocksPollTimeoutMs = 20_000;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly trpcClientService: TrpcClientService
  ) {
    this.notion = new Client({
      auth: configurationService.get('NOTION_TOKEN'),
    });
  }

  private async resolveDataSourceId(databaseId: string): Promise<string> {
    const cached = this.dataSourceIdCache.get(databaseId);
    if (cached) {
      return cached;
    }

    const database = await this.notion.databases.retrieve({
      database_id: databaseId,
    });

    if (!isFullDatabase(database) || !database.data_sources?.length) {
      throw new InternalServerErrorException(
        `Aucune data source trouvée pour la base Notion ${databaseId}`
      );
    }

    if (database.data_sources.length > 1) {
      this.logger.warn(
        `Plusieurs data sources pour la base ${databaseId}, utilisation de la première`
      );
    }

    const dataSourceId = database.data_sources[0].id;
    this.dataSourceIdCache.set(databaseId, dataSourceId);
    return dataSourceId;
  }

  private async retrieveDataSource(
    dataSourceId: string
  ): Promise<DataSourceObjectResponse> {
    const dataSource = await this.notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });

    if (!isFullDataSource(dataSource)) {
      throw new InternalServerErrorException(
        `Réponse incomplète pour la data source Notion ${dataSourceId}`
      );
    }

    return dataSource;
  }

  private normalizeNotionId(id: string): string {
    return id.replace(/-/g, '').toLowerCase();
  }

  private async warnIfTemplateIdsMissing(
    dataSourceId: string,
    templateIds: string[]
  ): Promise<void> {
    if (this.validatedTemplateDataSources.has(dataSourceId)) {
      return;
    }

    try {
      const { templates } = await this.notion.dataSources.listTemplates({
        data_source_id: dataSourceId,
      });
      this.validatedTemplateDataSources.add(dataSourceId);
      const availableTemplateIds = new Set(
        templates.map((template) => this.normalizeNotionId(template.id))
      );
      templateIds.forEach((templateId) => {
        if (!availableTemplateIds.has(this.normalizeNotionId(templateId))) {
          this.logger.warn(
            `Template ${templateId} introuvable dans la data source ${dataSourceId}`
          );
        }
      });
    } catch (error) {
      this.logger.warn(
        `Impossible de valider les templates pour la data source ${dataSourceId}: ${error}`
      );
    }
  }

  getNotionPropertyValue(
    dataSource: DataSourceObjectResponse,
    propertyKey: string,
    propertyValue: string | number | boolean
  ) {
    const property = dataSource.properties[propertyKey];
    if (!property) {
      throw new InternalServerErrorException(
        `Property ${propertyKey} not found in notion data source ${dataSource.id}`
      );
    }

    switch (property.type) {
      case 'date':
        return {
          type: property.type,
          date: {
            start: propertyValue as string,
            end: null,
            time_zone: null,
          },
        };
      case 'number':
        return {
          type: property.type,
          number: propertyValue as number,
        };
      case 'url':
        return {
          type: property.type,
          url: propertyValue?.toString() || '',
        };
      case 'phone_number':
        return {
          type: property.type,
          phone_number: propertyValue?.toString() || '',
        };
      case 'email':
        return {
          type: property.type,
          email: propertyValue?.toString() || '',
        };
      case 'relation':
        return {
          type: property.type,
          relation: [
            {
              id: propertyValue?.toString() || '',
            },
          ],
        };
      case 'rich_text':
        return {
          type: property.type,
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: propertyValue?.toString() || '',
              },
            },
          ],
        };
      case 'title':
        return {
          type: property.type,
          title: [
            {
              type: 'text' as const,
              text: {
                content: propertyValue?.toString() || '',
              },
            },
          ],
        };
      case 'status': {
        const foundOption = property.status.options.find(
          (option) =>
            option.name.toLowerCase() === propertyValue.toString().toLowerCase()
        );
        if (!foundOption) {
          throw new BadRequestException(
            `Property ${propertyKey} does not contain option ${propertyValue}`
          );
        }
        return {
          type: property.type,
          status: {
            name: foundOption.name,
          },
        };
      }
      case 'select': {
        const foundOption = property.select.options.find(
          (option) =>
            option.name.toLowerCase() === propertyValue.toString().toLowerCase()
        );
        if (!foundOption) {
          throw new BadRequestException(
            `Property ${propertyKey} does not contain option ${propertyValue}`
          );
        }
        return {
          type: property.type,
          select: {
            name: foundOption.name,
          },
        };
      }
      default:
        throw new InternalServerErrorException(
          `Property type ${property.type} not supported for property ${propertyKey}`
        );
    }
  }

  getNotionPropertyEqualsFilter(
    dataSource: DataSourceObjectResponse,
    propertyKey: string,
    propertyValue: string | number | boolean
  ) {
    const property = dataSource.properties[propertyKey];
    if (!property) {
      throw new InternalServerErrorException(
        `Property ${propertyKey} not found in notion data source ${dataSource.id}`
      );
    }

    switch (property.type) {
      case 'date':
        return {
          property: propertyKey,
          date: {
            equals: propertyValue.toString(),
          },
        };
      case 'number':
        return {
          property: propertyKey,
          number: {
            equals: propertyValue as number,
          },
        };
      case 'url':
        return {
          property: propertyKey,
          url: {
            equals: propertyValue.toString(),
          },
        };
      case 'phone_number':
        return {
          property: propertyKey,
          phone_number: {
            equals: propertyValue.toString(),
          },
        };
      case 'email':
        return {
          property: propertyKey,
          email: {
            equals: propertyValue.toString(),
          },
        };
      case 'status': {
        const foundOption = property.status.options.find(
          (option) =>
            option.name.toLowerCase() === propertyValue.toString().toLowerCase()
        );
        if (!foundOption) {
          throw new BadRequestException(
            `Property ${propertyKey} does not contain option ${propertyValue}`
          );
        }
        return {
          property: propertyKey,
          status: {
            equals: foundOption.name,
          },
        };
      }
      case 'select': {
        const foundOption = property.select.options.find(
          (option) =>
            option.name.toLowerCase() === propertyValue.toString().toLowerCase()
        );
        if (!foundOption) {
          throw new BadRequestException(
            `Property ${propertyKey} does not contain option ${propertyValue}`
          );
        }
        return {
          property: propertyKey,
          select: {
            equals: foundOption.name,
          },
        };
      }
      default:
        throw new InternalServerErrorException(
          `Property type ${property.type} not supported for property ${propertyKey}`
        );
    }
  }

  buildCrispProperties(
    session: CrispSession,
    dataSource: DataSourceObjectResponse,
    collectiviteId: number | null,
    ticketTitle: string | null
  ): NonNullable<CreatePageParameters['properties']> {
    const properties: NonNullable<CreatePageParameters['properties']> = {
      'Email utilisateur': this.getNotionPropertyValue(
        dataSource,
        'Email utilisateur',
        session.meta.email
      ),
      'Conversation Crisp': this.getNotionPropertyValue(
        dataSource,
        'Conversation Crisp',
        session.session_url || ''
      ),
      'Date de remontée Crisp': this.getNotionPropertyValue(
        dataSource,
        'Date de remontée Crisp',
        DateTime.fromMillis(session.created_at).toISO() || ''
      ),
      Name: this.getNotionPropertyValue(
        dataSource,
        'Name',
        ticketTitle || session.meta.subject
      ),
    };

    if (collectiviteId) {
      properties['ID Collectivité'] = this.getNotionPropertyValue(
        dataSource,
        'ID Collectivité',
        collectiviteId
      );
    }

    const metadataKeys = Object.keys(session.meta.data);
    metadataKeys.forEach((metadataKey) => {
      const slugifiedMetadataKey = this.slugifyTicketPropertyKey(metadataKey);
      if (slugifiedMetadataKey.startsWith(this.CRISP_DATA_TICKET_PREFIX)) {
        const databasePropertyKey = Object.keys(dataSource.properties).find(
          (propertyKey) => {
            const slugifiedDatabasePropertyKey =
              this.slugifyTicketPropertyKey(propertyKey);
            return (
              slugifiedDatabasePropertyKey ===
              slugifiedMetadataKey.replace(this.CRISP_DATA_TICKET_PREFIX, '')
            );
          }
        );
        if (databasePropertyKey) {
          this.logger.log(
            `Found property ${metadataKey} in data source with name ${databasePropertyKey}`
          );
          const metadataValue = session.meta.data[metadataKey];
          properties[databasePropertyKey] = this.getNotionPropertyValue(
            dataSource,
            databasePropertyKey,
            metadataValue
          );
        } else {
          this.logger.warn(`Property ${metadataKey} not found in data source`);
        }
      }
    });

    return properties;
  }

  buildCreatePageParameters(
    dataSourceId: string,
    templateId: string,
    properties: NonNullable<CreatePageParameters['properties']>
  ): CreatePageParameters {
    return {
      parent: {
        type: 'data_source_id',
        data_source_id: dataSourceId,
      },
      properties,
      template: {
        type: 'template_id',
        template_id: templateId,
        timezone: 'Europe/Paris',
      },
    };
  }

  slugifyTicketPropertyKey(propertyKey: string): string {
    if (propertyKey) {
      return slugify(propertyKey.toLowerCase(), {
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
      });
    }
    return propertyKey;
  }

  findCrispExchangesCallout(
    blocks: BlockObjectResponse[]
  ): BlockObjectResponse | undefined {
    return blocks.find(
      (block) =>
        block.type === 'callout' &&
        block.callout.rich_text[0]?.plain_text ===
          this.CRISP_EXCHANGES_CALLOUT_TEXT
    );
  }

  findInformationsCallout(
    blocks: BlockObjectResponse[]
  ): BlockObjectResponse | undefined {
    return blocks.find(
      (block) =>
        block.type === 'callout' &&
        block.callout.rich_text[0]?.plain_text ===
          this.CRISP_INFORMATIONS_CALLOUT_TEXT
    );
  }

  private normalizeInfoLabel(label: string): string {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private getCrispMetadataBySuffix(
    session: CrispSession,
    suffix: string
  ): string | null {
    for (const [metadataKey, metadataValue] of Object.entries(
      session.meta.data || {}
    )) {
      const slugifiedMetadataKey = this.slugifyTicketPropertyKey(metadataKey);
      if (!slugifiedMetadataKey.startsWith(this.CRISP_DATA_TICKET_PREFIX)) {
        continue;
      }

      const metadataSuffix = slugifiedMetadataKey.slice(
        this.CRISP_DATA_TICKET_PREFIX.length
      );
      if (metadataSuffix === suffix) {
        return metadataValue?.toString() || null;
      }
    }

    return null;
  }

  buildInformationsValues(
    session: CrispSession,
    collectivitesString: string | null
  ): Record<string, string> {
    const values: Record<string, string> = {};

    if (session.meta.email) {
      values[this.normalizeInfoLabel('Email utilisateur')] = session.meta.email;
    }
    if (session.session_url) {
      values[this.normalizeInfoLabel('Conversation Crisp')] =
        session.session_url;
    }
    if (collectivitesString) {
      values[this.normalizeInfoLabel('ID Collectivité')] = collectivitesString;
    }

    const pageUrl =
      this.getCrispMetadataBySuffix(session, 'url-de-la-page') ??
      this.getCrispMetadataBySuffix(session, 'url');
    if (pageUrl) {
      values[this.normalizeInfoLabel('URL de la page')] = pageUrl;
    }

    const nuisanceLevel = this.getCrispMetadataBySuffix(
      session,
      'niveau-de-gene'
    );
    if (nuisanceLevel) {
      values[this.normalizeInfoLabel('Niveau de gêne')] = nuisanceLevel;
    }

    return values;
  }

  private buildInformationsTableCell(content: string) {
    return [
      {
        type: 'text' as const,
        text: {
          content,
        },
      },
    ];
  }

  private async listPageChildBlocks(
    pageId: string
  ): Promise<BlockObjectResponse[]> {
    const existingBlocksResponse = await this.notion.blocks.children.list({
      block_id: pageId,
    });
    return existingBlocksResponse.results.filter(isFullBlock);
  }

  private async waitForTemplateBlocks(
    pageId: string,
    options?: { pollTimeoutMs?: number }
  ): Promise<BlockObjectResponse[]> {
    const pollTimeoutMs =
      options?.pollTimeoutMs ?? this.templateBlocksPollTimeoutMs;
    const startedAt = Date.now();
    let attempt = 0;
    let blocks: BlockObjectResponse[] = [];

    while (Date.now() - startedAt < pollTimeoutMs) {
      attempt += 1;

      blocks = await this.listPageChildBlocks(pageId);

      this.logger.log(
        `Polling blocs template page ${pageId}, tentative ${attempt}, ${blocks.length} bloc(s)`
      );

      if (this.findCrispExchangesCallout(blocks)) {
        this.logger.log(
          `Callout "${
            this.CRISP_EXCHANGES_CALLOUT_TEXT
          }" trouvé après ${attempt} tentative(s), ${Date.now() - startedAt}ms`
        );
        return blocks;
      }

      const delayMs =
        this.templateBlocksPollDelaysMs[
          Math.min(attempt - 1, this.templateBlocksPollDelaysMs.length - 1)
        ];
      await sleep(delayMs);
    }

    this.logger.warn(
      `Timeout en attente du callout "${
        this.CRISP_EXCHANGES_CALLOUT_TEXT
      }" sur la page ${pageId} après ${Date.now() - startedAt}ms`
    );
    return blocks;
  }

  async createTicketFromCrispSession(
    session: CrispSession,
    messages: CrispSessionMessage[],
    ticketTitle: string | null,
    isSupport: boolean,
    checkExistingTicket = true
  ) {
    const databaseId = this.configurationService.get(
      'NOTION_BUG_SUPPORT_DATABASE_ID'
    );
    const dataSourceId = await this.resolveDataSourceId(databaseId);
    const dataSource = await this.retrieveDataSource(dataSourceId);

    const ticketTemplateId = this.configurationService.get(
      isSupport ? 'NOTION_SUPPORT_TEMPLATE_ID' : 'NOTION_BUG_TEMPLATE_ID'
    );

    const existingTickets = await this.notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: this.getNotionPropertyEqualsFilter(
        dataSource,
        'Conversation Crisp',
        session.session_url || ''
      ),
    });

    const userEmail = session.meta.email;
    let collectiviteId: number | null = null;
    let collectivitesString: string | null = null;
    if (userEmail) {
      this.logger.log(`Looking for user with email ${userEmail}`);
      const userWithPermissions = await this.trpcClientService
        .getClient()
        .users.users.getWithRolesAndPermissionsByEmail.query({
          email: userEmail,
        });

      collectivitesString =
        userWithPermissions.collectivites
          .map(
            (collectiviteAccess) =>
              `${collectiviteAccess.collectiviteId} (${collectiviteAccess.collectiviteNom})`
          )
          .join(', ') || null;
      if (userWithPermissions.collectivites.length === 1) {
        collectiviteId = userWithPermissions.collectivites[0].collectiviteId;
        this.logger.log(
          `Only one permission, extracted collectivite id ${collectiviteId}`
        );
      } else if (userWithPermissions.collectivites.length > 1) {
        this.logger.log(
          `Permissions: ${JSON.stringify(userWithPermissions.collectivites)}`
        );
        this.logger.log(
          `Multiple permissions, too risky to guess the right collectivite id`
        );
      }
    } else {
      this.logger.warn(`No email found in session, skipping user lookup`);
    }

    if (checkExistingTicket && existingTickets.results.length > 0) {
      const existingTicketResult = existingTickets.results[0];
      if (!isFullPage(existingTicketResult)) {
        throw new InternalServerErrorException(
          `Réponse incomplète pour le ticket Notion existant`
        );
      }
      this.logger.log(
        `Ticket already exists for session ${session.session_id}, returning existing ticket with url ${existingTicketResult.url}`
      );

      return { ticket: existingTicketResult, created: false };
    } else {
      await this.warnIfTemplateIdsMissing(dataSourceId, [
        this.configurationService.get('NOTION_BUG_TEMPLATE_ID'),
        this.configurationService.get('NOTION_SUPPORT_TEMPLATE_ID'),
      ]);

      const crispProperties = this.buildCrispProperties(
        session,
        dataSource,
        collectiviteId,
        ticketTitle
      );
      const notionTicket = this.buildCreatePageParameters(
        dataSourceId,
        ticketTemplateId,
        crispProperties
      );

      this.logger.log(
        `Création ticket avec data_source_id ${dataSourceId} et template_id ${ticketTemplateId}`
      );

      const createdTicketResponse = await this.notion.pages.create(
        notionTicket
      );
      if (!isFullPage(createdTicketResponse)) {
        throw new InternalServerErrorException(
          `Réponse incomplète lors de la création du ticket Notion`
        );
      }
      const createdTicket = createdTicketResponse;
      this.logger.log(
        `Ticket created for session ${session.session_id} with url ${createdTicket.url}`
      );

      try {
        const existingBlocks = await this.waitForTemplateBlocks(
          createdTicket.id
        );
        try {
          await this.fillInformationsBlock(
            existingBlocks,
            session,
            collectivitesString
          );
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'injection des informations dans le ticket ${createdTicket.id}: ${error}`
          );
        }
        try {
          this.logger.log(
            `Filling message block with ${messages.length} messages`
          );
          await this.fillMessageBlock(existingBlocks, messages);
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'injection des messages dans le ticket ${createdTicket.id}: ${error}`
          );
        }
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'attente des blocs template pour le ticket ${createdTicket.id}: ${error}`
        );
      }

      return { ticket: createdTicket, created: true };
    }
  }

  async fillInformationsBlock(
    existingBlocks: BlockObjectResponse[],
    session: CrispSession,
    collectivitesString: string | null
  ) {
    const foundInformationsBlock = this.findInformationsCallout(existingBlocks);
    if (!foundInformationsBlock) {
      this.logger.warn(
        `Informations block not found in bug, skipping informations`
      );
      return;
    }

    this.logger.log(
      `Found informations block with id ${foundInformationsBlock.id}, filling values`
    );

    const informationsValues = this.buildInformationsValues(
      session,
      collectivitesString
    );
    if (Object.keys(informationsValues).length === 0) {
      this.logger.log(`No informations values to fill, skipping`);
      return;
    }

    const existingInformationsBlockChildrenResponse =
      await this.notion.blocks.children.list({
        block_id: foundInformationsBlock.id,
      });

    const existingInformationsBlockTable =
      existingInformationsBlockChildrenResponse.results
        .filter(isFullBlock)
        .find((block) => block.type === 'table');
    if (!existingInformationsBlockTable) {
      this.logger.warn(
        `Informations block table not found in bug, skipping informations`
      );
      return;
    }

    this.logger.log(
      `Informations table block found with id ${existingInformationsBlockTable.id}`
    );

    const existingTableRowsResponse = await this.notion.blocks.children.list({
      block_id: existingInformationsBlockTable.id,
    });
    const existingTableRows = existingTableRowsResponse.results
      .filter(isFullBlock)
      .filter((block) => block.type === 'table_row');

    for (const tableRow of existingTableRows) {
      const firstCellContent = tableRow.table_row.cells[0];
      if (!firstCellContent?.length || firstCellContent[0].type !== 'text') {
        continue;
      }

      const infoLabel = this.normalizeInfoLabel(
        firstCellContent[0].text.content
      );
      const infoValue = informationsValues[infoLabel];
      if (!infoValue) {
        continue;
      }

      const updatedCells = [
        tableRow.table_row.cells[0].map((richText) => ({
          type: 'text' as const,
          text: {
            content:
              richText.type === 'text'
                ? richText.text.content
                : richText.plain_text,
          },
        })),
        this.buildInformationsTableCell(infoValue),
      ];

      await this.notion.blocks.update({
        block_id: tableRow.id,
        table_row: {
          cells: updatedCells,
        },
      });
    }
  }

  async fillMessageBlock(
    existingBlocks: BlockObjectResponse[],
    messages: CrispSessionMessage[]
  ) {
    const foundMessageBlock = this.findCrispExchangesCallout(existingBlocks);
    if (!foundMessageBlock) {
      this.logger.warn(`Message block not found in bug, skipping messages`);
    } else {
      this.logger.log(
        `Found message block with id ${foundMessageBlock.id}, filling with ${messages.length} messages`
      );

      const existingMessageBlockChildrenResponse =
        await this.notion.blocks.children.list({
          block_id: foundMessageBlock.id,
        });

      const existingMessageBlockTable =
        existingMessageBlockChildrenResponse.results
          .filter(isFullBlock)
          .find((block) => block.type === 'table');
      if (!existingMessageBlockTable) {
        this.logger.warn(
          `Message block table not found in bug, skipping messages`
        );
        return;
      } else {
        this.logger.log(
          `Table block found with id ${existingMessageBlockTable.id}`
        );

        const existingTableRowsresponse =
          await this.notion.blocks.children.list({
            block_id: existingMessageBlockTable.id,
          });
        const existingTableRows = existingTableRowsresponse.results
          .filter(isFullBlock)
          .filter((block) => block.type === 'table_row');

        let newTableRows = messages
          .filter((message) => message.type === CrispSessionMessageType.Text)
          .map((message) => {
            return {
              type: 'table_row' as const,
              table_row: {
                cells: [
                  [
                    {
                      type: 'text' as const,
                      text: {
                        content:
                          DateTime.fromMillis(message.timestamp, {
                            zone: 'Europe/Paris',
                          }).toISO() || '',
                      },
                    },
                  ],
                  [
                    {
                      type: 'text' as const,
                      text: {
                        content: message.user?.nickname || '',
                      },
                    },
                  ],
                  [
                    {
                      type: 'text' as const,
                      text: {
                        content:
                          (typeof message.content === 'string'
                            ? message.content
                            : (message.content as CrispSessionMessageContent)
                                .text) || '',
                      },
                    },
                  ],
                ],
              },
            };
          });
        // Consider only new messages
        newTableRows = newTableRows.slice(
          Math.max(existingTableRows.length - 1, 0)
        );

        if (newTableRows.length === 0) {
          return;
        }

        await this.notion.blocks.children.append({
          block_id: existingMessageBlockTable.id,
          children: newTableRows,
        });
      }
    }
  }
}
