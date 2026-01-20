import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Client } from '@notionhq/client';
import {
  AppendBlockChildrenResponse,
  BlockObjectRequest,
  BlockObjectResponse,
  CreatePageParameters,
  GetDatabaseResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { cloneDeep } from 'es-toolkit';
import { DateTime } from 'luxon';
import slugify from 'slugify';
import ConfigurationService from '../../config/configuration.service';
import {
  CrispSessionMessage,
  CrispSessionMessageContent,
  CrispSessionMessageType,
} from '../../crisp/models/get-crisp-session-messages.response';
import { CrispSession } from '../../crisp/models/get-crisp-session.response';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';

export type PropertyValueType = CreatePageParameters['properties'][string];

type TemplateProperties = Pick<CreatePageParameters, 'icon' | 'properties'>;

@Injectable()
export class NotionBugCreatorService {
  private logger = new Logger(NotionBugCreatorService.name);
  private readonly notion: Client;

  readonly TEMPLATE_PROPERTIES_TO_COPY = [
    'Statut',
    'Personnes associées',
    'Epic (Roadmap)',
    'Cycle',
  ];

  readonly CRISP_DATA_TICKET_PREFIX = 'ticket-';
  readonly CRISP_DATA_TICKET_URL = 'ticket-url';

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly trpcClientService: TrpcClientService
  ) {
    this.notion = new Client({
      auth: configurationService.get('NOTION_TOKEN'),
    });
  }

  getNotionPropertyValue(
    database: GetDatabaseResponse,
    propertyKey: string,
    propertyValue: string | number | boolean
  ) {
    const property = database.properties[propertyKey];
    if (!property) {
      throw new InternalServerErrorException(
        `Property ${propertyKey} not found in notion database ${database.id}`
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
    database: GetDatabaseResponse,
    propertyKey: string,
    propertyValue: string | number | boolean
  ) {
    const property = database.properties[propertyKey];
    if (!property) {
      throw new InternalServerErrorException(
        `Property ${propertyKey} not found in notion database ${database.id}`
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

  async getTemplateProperties(templateId: string): Promise<TemplateProperties> {
    const templatePage = (await this.notion.pages.retrieve({
      page_id: templateId,
    })) as PageObjectResponse;

    const templateProperties: TemplateProperties = {
      icon:
        templatePage.icon &&
        templatePage.icon?.type !== 'custom_emoji' &&
        templatePage.icon?.type !== 'file'
          ? templatePage.icon
          : null,
      properties: {},
    };

    this.TEMPLATE_PROPERTIES_TO_COPY.forEach((propertyKey) => {
      const property = templatePage.properties[propertyKey];
      if (property) {
        if (property.type === 'status' && property.status?.name) {
          templateProperties.properties[propertyKey] = {
            type: property.type,
            status: {
              name: property.status.name,
            },
          };
        } else if (property.type === 'people') {
          templateProperties.properties[propertyKey] = {
            type: property.type,
            people: property.people.map((person) => ({
              id: person.id,
            })),
          };
        } else if (
          property.type === 'rollup' &&
          property.rollup.function === 'show_original' &&
          property.rollup.type === 'array'
        ) {
          const relationIds = property.rollup.array
            .map((item) => {
              if (item.type === 'select' && item.select?.id) {
                return {
                  id: item.select.id,
                };
              }
              return null;
            })
            .filter((item) => item !== null);

          templateProperties.properties[propertyKey] = {
            type: 'relation',
            relation: relationIds,
          };
        } else {
          templateProperties.properties[propertyKey] = property;
        }
      }
    });

    return templateProperties;
  }

  getNotionTicketFromCrispSession(
    session: CrispSession,
    database: GetDatabaseResponse,
    collectiviteId: number | null,
    ticketTitle: string | null,
    templateProperties: TemplateProperties
  ): CreatePageParameters {
    const createPageParameters: CreatePageParameters = {
      ...templateProperties,
      parent: {
        type: 'database_id',
        database_id: this.configurationService.get(
          'NOTION_BUG_SUPPORT_DATABASE_ID'
        ),
      },
      properties: {
        ...templateProperties.properties,
        'Email utilisateur': this.getNotionPropertyValue(
          database,
          'Email utilisateur',
          session.meta.email
        ),
        'Conversation Crisp': this.getNotionPropertyValue(
          database,
          'Conversation Crisp',
          session.session_url || ''
        ),
        'Date de remontée Crisp': this.getNotionPropertyValue(
          database,
          'Date de remontée Crisp',
          DateTime.fromMillis(session.created_at).toISO() || ''
        ),
        Name: this.getNotionPropertyValue(
          database,
          'Name',
          ticketTitle || session.meta.subject
        ),
      },
    };

    if (collectiviteId) {
      createPageParameters.properties['ID Collectivité'] =
        this.getNotionPropertyValue(
          database,
          'ID Collectivité',
          collectiviteId
        );
    }

    const metadataKeys = Object.keys(session.meta.data);
    metadataKeys.forEach((metadataKey) => {
      const slugifiedMetadataKey = this.slugifyTicketPropertyKey(metadataKey);
      if (slugifiedMetadataKey.startsWith(this.CRISP_DATA_TICKET_PREFIX)) {
        const databasePropertyKey = Object.keys(database.properties).find(
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
            `Found property ${metadataKey} in database with name ${databasePropertyKey}`
          );
          const metadataValue = session.meta.data[metadataKey];
          createPageParameters.properties[databasePropertyKey] =
            this.getNotionPropertyValue(
              database,
              databasePropertyKey,
              metadataValue
            );
        } else {
          this.logger.warn(`Property ${metadataKey} not found in database`);
        }
      }
    });

    return createPageParameters;
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

  async appendTableRows(
    block: BlockObjectRequest,
    templateBlockId: string,
    session: CrispSession,
    collectivitesString: string | null,
    _isParentInfoBlock?: boolean
  ) {
    if (block.type !== 'table') {
      throw new BadRequestException(`Block is not a table block`);
    }

    this.logger.log(
      `Appending table rows using template block ${templateBlockId}`
    );

    const templateBlocksResponse = await this.notion.blocks.children.list({
      block_id: templateBlockId,
    });
    const tableRows = templateBlocksResponse.results
      .filter((block) => (block as BlockObjectResponse).type === 'table_row')
      .map((block) => {
        const blockClone = cloneDeep(block) as Partial<BlockObjectResponse>;
        delete blockClone.id;
        delete blockClone.created_time;
        delete blockClone.created_by;
        delete blockClone.last_edited_time;
        delete blockClone.last_edited_by;
        delete blockClone.has_children;
        delete blockClone.archived;
        delete blockClone.in_trash;
        delete blockClone.parent;
        return blockClone as BlockObjectRequest;
      });
    block.table.children = tableRows as any;
    tableRows.forEach((tableRow) => {
      if (tableRow.type !== 'table_row') {
        throw new BadRequestException(`Block is not a table row`);
      }
      const firstCellContent = tableRow.table_row.cells[0];
      if (firstCellContent.length && firstCellContent[0].type === 'text') {
        const infoName = firstCellContent[0].text.content.toLowerCase();
        if (infoName === 'email utilisateur') {
          tableRow.table_row.cells[1] = [
            {
              type: 'text',
              text: {
                content: session.meta.email,
              },
            },
          ];
        } else if (infoName === 'conversation crisp') {
          tableRow.table_row.cells[1] = [
            {
              type: 'text',
              text: {
                content: session.session_url || '',
              },
            },
          ];
        } else if (collectivitesString && infoName === 'id collectivité') {
          tableRow.table_row.cells[1] = [
            {
              type: 'text',
              text: {
                content: collectivitesString,
              },
            },
          ];
        }
      }
    });
  }

  async createBlocksFromTemplate(
    parentBlockId: string,
    templateBlockIdToCopy: string,
    session: CrispSession,
    collectivitesString: string | null,
    isParentInfoBlock = false
  ) {
    const templateBlocksResponse = await this.notion.blocks.children.list({
      block_id: templateBlockIdToCopy,
    });
    const filteredTemplateBlocks = templateBlocksResponse.results.filter(
      (block) => (block as BlockObjectResponse).type !== 'child_database'
    );

    const childrenBlocks = filteredTemplateBlocks.map((block) => {
      const blockClone = cloneDeep(block) as Partial<BlockObjectResponse>;
      delete blockClone.id;
      delete blockClone.created_time;
      delete blockClone.created_by;
      delete blockClone.last_edited_time;
      delete blockClone.last_edited_by;
      delete blockClone.has_children;
      delete blockClone.archived;
      delete blockClone.in_trash;
      delete blockClone.parent;
      return blockClone as BlockObjectRequest;
    });

    // We have to get table rows for table
    const appendTableRowsPromises: Promise<void>[] = [];
    childrenBlocks.forEach((block, blockIndex) => {
      if (block.type === 'table') {
        const templateBlock = templateBlocksResponse.results[
          blockIndex
        ] as BlockObjectResponse;
        appendTableRowsPromises.push(
          this.appendTableRows(
            block,
            templateBlock.id,
            session,
            collectivitesString,
            isParentInfoBlock
          )
        );
      }
    });
    await Promise.all(appendTableRowsPromises);

    if (childrenBlocks.length) {
      let blockCreationResponse: AppendBlockChildrenResponse;
      try {
        blockCreationResponse = await this.notion.blocks.children.append({
          block_id: parentBlockId,
          children: childrenBlocks,
        });
      } catch (e) {
        this.logger.error(
          `Error creating children blocks for block ${parentBlockId} (template id: ${templateBlockIdToCopy})`
        );
        throw e;
      }

      const childrenPromises: Promise<BlockObjectResponse[]>[] = [];
      blockCreationResponse.results.forEach((block, blockIndex) => {
        const templateBlock = filteredTemplateBlocks[
          blockIndex
        ] as BlockObjectResponse;
        if (templateBlock.type !== 'table') {
          const parentInfoBlock =
            isParentInfoBlock ||
            (templateBlock.type === 'callout' &&
              templateBlock.callout.rich_text[0].plain_text === 'Informations');
          // Tables children have been already created above
          childrenPromises.push(
            this.createBlocksFromTemplate(
              block.id,
              templateBlock.id,
              session,
              collectivitesString,
              parentInfoBlock
            )
          );
        }
      });
      await Promise.all(childrenPromises);

      return blockCreationResponse.results as BlockObjectResponse[];
    }

    return [];
  }

  async createTicketFromCrispSession(
    session: CrispSession,
    messages: CrispSessionMessage[],
    ticketTitle: string | null,
    isSupport: boolean,
    checkExistingTicket = true
  ) {
    const database = await this.notion.databases.retrieve({
      database_id: this.configurationService.get(
        'NOTION_BUG_SUPPORT_DATABASE_ID'
      ),
    });

    const ticketTemplateId = this.configurationService.get(
      isSupport ? 'NOTION_SUPPORT_TEMPLATE_ID' : 'NOTION_BUG_TEMPLATE_ID'
    );

    const existingTickets = await this.notion.databases.query({
      database_id: this.configurationService.get(
        'NOTION_BUG_SUPPORT_DATABASE_ID'
      ),
      filter: this.getNotionPropertyEqualsFilter(
        database,
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
      const existingTicket = existingTickets.results[0] as PageObjectResponse;
      this.logger.log(
        `Ticket already exists for session ${session.session_id}, returning existing ticket with url ${existingTicket.url}`
      );

      return { ticket: existingTicket, created: false };
    } else {
      const templateProperties = await this.getTemplateProperties(
        ticketTemplateId
      );
      const notionTicket = this.getNotionTicketFromCrispSession(
        session,
        database,
        collectiviteId,
        ticketTitle,
        templateProperties
      );

      const createdTicket = (await this.notion.pages.create(
        notionTicket
      )) as PageObjectResponse;
      this.logger.log(
        `Ticket created for session ${session.session_id} with url ${createdTicket.url}`
      );

      const existingBlocksResponse = await this.notion.blocks.children.list({
        block_id: createdTicket.id,
      });
      let existingBlocks: BlockObjectResponse[] =
        existingBlocksResponse.results as BlockObjectResponse[];
      this.logger.log(`Found ${existingBlocks.length} existing blocks`);

      if (existingBlocks.length === 0) {
        this.logger.log(`The bug is empty, creating a copy from the template`);

        existingBlocks = await this.createBlocksFromTemplate(
          createdTicket.id,
          ticketTemplateId,
          session,
          collectivitesString
        );
      }

      await this.fillMessageBlock(existingBlocks, messages);

      return { ticket: createdTicket, created: true };
    }
  }

  async fillMessageBlock(
    existingBlocks: BlockObjectResponse[],
    messages: CrispSessionMessage[]
  ) {
    const foundMessageBlock = existingBlocks.find((existingBlock) => {
      return (
        existingBlock.type === 'callout' &&
        existingBlock.callout.rich_text[0].plain_text === 'Echanges Crisp'
      );
    });
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

      const existingMessageBlockTable = (
        existingMessageBlockChildrenResponse.results as BlockObjectResponse[]
      ).find((block) => block.type === 'table');
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
        const existingTableRows = existingTableRowsresponse.results.filter(
          (block) => (block as BlockObjectResponse).type === 'table_row'
        ) as BlockObjectResponse[];

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

        await this.notion.blocks.children.append({
          block_id: existingMessageBlockTable.id,
          children: newTableRows,
        });
      }
    }
  }
}
