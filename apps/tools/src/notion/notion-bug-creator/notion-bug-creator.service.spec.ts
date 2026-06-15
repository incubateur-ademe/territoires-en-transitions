import { Test, TestingModule } from '@nestjs/testing';
import { BlockObjectResponse } from '@notionhq/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CrispSessionMessage,
  CrispSessionMessageType,
} from '../../crisp/models/get-crisp-session-messages.response';
import { ToolsAutomationApiConfigurationType } from '../../config/configuration.model';
import ConfigurationService from '../../config/configuration.service';
import { sleep } from '../../utils/sleep.utils';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';
import { NotionBugCreatorService } from './notion-bug-creator.service';
import { crispSessionSample } from './samples/crisp-session.sample';
import { ticketDatabaseSample } from './samples/ticket-database.sample';

vi.mock('../../utils/sleep.utils', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

const crispExchangesCalloutBlock = {
  object: 'block',
  id: 'callout-block-id',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', plain_text: 'Echanges Crisp' }],
  },
} as BlockObjectResponse;

const informationsCalloutBlock = {
  object: 'block',
  id: 'informations-callout-id',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', plain_text: 'Informations' }],
  },
} as BlockObjectResponse;

const informationsTableBlock = {
  object: 'block',
  id: 'informations-table-id',
  type: 'table',
  table: {
    table_width: 2,
    has_column_header: false,
    has_row_header: false,
  },
} as BlockObjectResponse;

const emailInfoTableRow = {
  object: 'block',
  id: 'email-info-row-id',
  type: 'table_row',
  table_row: {
    cells: [
      [{ type: 'text', text: { content: 'Email utilisateur' } }],
      [{ type: 'text', text: { content: '' } }],
    ],
  },
} as BlockObjectResponse;

const conversationInfoTableRow = {
  object: 'block',
  id: 'conversation-info-row-id',
  type: 'table_row',
  table_row: {
    cells: [
      [{ type: 'text', text: { content: 'Conversation Crisp' } }],
      [{ type: 'text', text: { content: '' } }],
    ],
  },
} as BlockObjectResponse;

const messageTableBlock = {
  object: 'block',
  id: 'table-block-id',
  type: 'table',
  table: {
    table_width: 3,
    has_column_header: true,
    has_row_header: false,
  },
} as BlockObjectResponse;

const headerTableRow = {
  object: 'block',
  id: 'header-row-id',
  type: 'table_row',
  table_row: {
    cells: [
      [{ type: 'text', text: { content: 'Date' } }],
      [{ type: 'text', text: { content: 'Auteur' } }],
      [{ type: 'text', text: { content: 'Message' } }],
    ],
  },
} as BlockObjectResponse;

const crispTextMessage = {
  type: CrispSessionMessageType.Text,
  timestamp: 1_704_000_000_000,
  user: { nickname: 'Mathieu' },
  content: 'Bonjour',
} as CrispSessionMessage;

type NotionClientSpy = {
  databases: { retrieve: ReturnType<typeof vi.fn> };
  dataSources: {
    retrieve: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    listTemplates: ReturnType<typeof vi.fn>;
  };
  pages: { create: ReturnType<typeof vi.fn> };
  blocks: {
    children: {
      list: ReturnType<typeof vi.fn>;
      append: ReturnType<typeof vi.fn>;
    };
    update: ReturnType<typeof vi.fn>;
  };
};

type NotionBugCreatorServiceInternals = {
  listPageChildBlocks: (pageId: string) => Promise<BlockObjectResponse[]>;
  waitForTemplateBlocks: (
    pageId: string,
    options?: { pollTimeoutMs?: number }
  ) => Promise<BlockObjectResponse[]>;
  resolveDataSourceId: (databaseId: string) => Promise<string>;
  notion: NotionClientSpy;
  trpcClientService: { getClient: ReturnType<typeof vi.fn> };
};

describe('NotionBugCreatorService', () => {
  let service: NotionBugCreatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotionBugCreatorService, TrpcClientService],
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return {
            get(key: keyof ToolsAutomationApiConfigurationType) {
              if (key === 'NOTION_BUG_SUPPORT_DATABASE_ID') {
                return 'notionDatabaseId';
              } else if (key === 'NOTION_BUG_TEMPLATE_ID') {
                return 'bugTemplateId';
              } else if (key === 'NOTION_SUPPORT_TEMPLATE_ID') {
                return 'supportTemplateId';
              }
            },
          };
        }
      })
      .compile();

    service = module.get<NotionBugCreatorService>(NotionBugCreatorService);
  });

  describe('buildCrispProperties', () => {
    test('ne contient que les propriétés Crisp', () => {
      const crispProperties = service.buildCrispProperties(
        crispSessionSample,
        ticketDatabaseSample,
        null,
        null
      );

      expect(crispProperties).toEqual({
        'Email utilisateur': {
          type: 'email',
          email: 'mathieu.teulier@ademe.fr',
        },
        'Conversation Crisp': {
          type: 'url',
          url: 'https://app.crisp.chat/website/582ff50a-5ac4-4f38-a8bc-62f51beeef89/inbox/session_b27f1426-8400-469a-afe0-5e19eeb7eb59',
        },
        'Date de remontée Crisp': {
          type: 'date',
          date: {
            start: expect.toBeOneOf([
              '2024-12-16T10:20:47.966+01:00',
              '2024-12-16T09:20:47.966+00:00',
            ]),
            end: null,
            time_zone: null,
          },
        },
        Name: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: { content: 'Erreur page Site Territoiresentransitions' },
            },
          ],
        },
      });
      expect(crispProperties).not.toHaveProperty('Statut');
      expect(crispProperties).not.toHaveProperty('Epic (Roadmap)');
    });

    test('ajoute ID Collectivité si fourni', () => {
      const crispProperties = service.buildCrispProperties(
        crispSessionSample,
        ticketDatabaseSample,
        42,
        null
      );

      expect(crispProperties['ID Collectivité']).toEqual({
        type: 'number',
        number: 42,
      });
    });
  });

  describe('waitForTemplateBlocks', () => {
    let internals: NotionBugCreatorServiceInternals;

    beforeEach(() => {
      internals = service as unknown as NotionBugCreatorServiceInternals;
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    test('trouve le callout au 2e poll', async () => {
      vi.spyOn(internals, 'listPageChildBlocks')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([crispExchangesCalloutBlock]);

      const blocks = await internals.waitForTemplateBlocks('page-id');

      expect(blocks).toEqual([crispExchangesCalloutBlock]);
      expect(internals.listPageChildBlocks).toHaveBeenCalledTimes(2);
    });

    test('retourne les blocs disponibles en cas de timeout', async () => {
      vi.useFakeTimers();

      const paragraphBlock = {
        object: 'block',
        id: 'paragraph-block-id',
        type: 'paragraph',
        paragraph: { rich_text: [] },
      } as unknown as BlockObjectResponse;

      const listPageChildBlocksSpy = vi
        .spyOn(internals, 'listPageChildBlocks')
        .mockResolvedValue([paragraphBlock]);
      vi.mocked(sleep).mockImplementation(async (ms: number) => {
        await vi.advanceTimersByTimeAsync(ms);
      });

      const blocksPromise = internals.waitForTemplateBlocks('page-id', {
        pollTimeoutMs: 1_000,
      });

      await vi.runAllTimersAsync();
      const blocks = await blocksPromise;

      expect(blocks).toEqual([paragraphBlock]);
      expect(listPageChildBlocksSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('buildCreatePageParameters', () => {
    test('utilise data_source_id et le template natif', () => {
      const createPageParameters = service.buildCreatePageParameters(
        'dataSourceId',
        'templateId',
        {
          Name: {
            type: 'title',
            title: [{ type: 'text', text: { content: 'Test' } }],
          },
        }
      );

      expect(createPageParameters).toEqual({
        parent: { type: 'data_source_id', data_source_id: 'dataSourceId' },
        properties: {
          Name: {
            type: 'title',
            title: [{ type: 'text', text: { content: 'Test' } }],
          },
        },
        template: {
          type: 'template_id',
          template_id: 'templateId',
          timezone: 'Europe/Paris',
        },
      });
    });
  });

  describe('resolveDataSourceId', () => {
    let internals: NotionBugCreatorServiceInternals;

    beforeEach(() => {
      internals = service as unknown as NotionBugCreatorServiceInternals;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('retourne le dataSourceId et le met en cache', async () => {
      const retrieveSpy = vi
        .spyOn(internals.notion.databases, 'retrieve')
        .mockResolvedValue({
          object: 'database',
          id: 'db-id',
          data_sources: [{ id: 'data-source-id' }],
        } as any);

      const result1 = await internals.resolveDataSourceId('db-id');
      expect(result1).toBe('data-source-id');
      expect(retrieveSpy).toHaveBeenCalledTimes(1);

      // deuxième appel → cache hit, pas de nouvel appel API
      const result2 = await internals.resolveDataSourceId('db-id');
      expect(result2).toBe('data-source-id');
      expect(retrieveSpy).toHaveBeenCalledTimes(1);
    });

    test('log un warn et retourne la première source si plusieurs data sources', async () => {
      const warnSpy = vi.spyOn(
        (service as any)['logger'],
        'warn'
      );
      vi.spyOn(internals.notion.databases, 'retrieve').mockResolvedValue({
        object: 'database',
        id: 'db-id',
        data_sources: [{ id: 'first-id' }, { id: 'second-id' }],
      } as any);

      const result = await internals.resolveDataSourceId('db-id');

      expect(result).toBe('first-id');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plusieurs data sources')
      );
    });

    test('lève une exception si aucune data source', async () => {
      vi.spyOn(internals.notion.databases, 'retrieve').mockResolvedValue({
        object: 'database',
        id: 'db-id',
        data_sources: [],
      } as any);

      await expect(internals.resolveDataSourceId('db-id')).rejects.toThrow(
        'Aucune data source trouvée'
      );
    });
  });

  describe('createTicketFromCrispSession', () => {
    let internals: NotionBugCreatorServiceInternals;

    beforeEach(() => {
      internals = service as unknown as NotionBugCreatorServiceInternals;

      vi.spyOn(internals.notion.databases, 'retrieve').mockResolvedValue({
        object: 'database',
        id: 'notionDatabaseId',
        data_sources: [{ id: 'data-source-id' }],
      } as any);
      vi.spyOn(internals.notion.dataSources, 'retrieve').mockResolvedValue(
        ticketDatabaseSample as any
      );
      vi.spyOn(internals.notion.dataSources, 'query').mockResolvedValue({
        results: [],
        has_more: false,
        next_cursor: null,
      } as any);
      vi.spyOn(internals.notion.dataSources, 'listTemplates').mockResolvedValue({
        templates: [],
      } as any);
      vi.spyOn(internals.notion.pages, 'create').mockResolvedValue({
        object: 'page',
        id: 'new-page-id',
        url: 'https://notion.so/new-page',
      } as any);
      vi.spyOn(internals.notion.blocks.children, 'list').mockResolvedValue({
        results: [crispExchangesCalloutBlock],
        has_more: false,
        next_cursor: null,
      } as any);
      vi.spyOn(internals.notion.blocks.children, 'append').mockResolvedValue(
        {} as any
      );
      vi.spyOn(internals.trpcClientService, 'getClient').mockReturnValue({
        users: {
          users: {
            getWithRolesAndPermissionsByEmail: {
              query: vi.fn().mockResolvedValue({ collectivites: [] }),
            },
          },
        },
      } as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('retourne le ticket existant sans recréer (dedup)', async () => {
      const existingPage = {
        object: 'page',
        id: 'existing-page-id',
        url: 'https://notion.so/existing',
      };
      vi.spyOn(internals.notion.dataSources, 'query').mockResolvedValue({
        results: [existingPage],
        has_more: false,
        next_cursor: null,
      } as any);

      const result = await service.createTicketFromCrispSession(
        crispSessionSample,
        [],
        null,
        false
      );

      expect(result).toEqual({ ticket: existingPage, created: false });
      expect(internals.notion.pages.create).not.toHaveBeenCalled();
    });

    test('crée un ticket Bug et retourne created: true', async () => {
      const result = await service.createTicketFromCrispSession(
        crispSessionSample,
        [],
        null,
        false // isSupport = false → Bug
      );

      expect(result.created).toBe(true);
      expect(result.ticket).toMatchObject({ object: 'page', id: 'new-page-id' });
      expect(internals.notion.pages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: { type: 'data_source_id', data_source_id: 'data-source-id' },
          template: expect.objectContaining({ template_id: 'bugTemplateId' }),
        })
      );
    });

    test('utilise le template Support si isSupport=true', async () => {
      await service.createTicketFromCrispSession(
        crispSessionSample,
        [],
        null,
        true // isSupport = true
      );

      expect(internals.notion.pages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: expect.objectContaining({ template_id: 'supportTemplateId' }),
        })
      );
    });

    test("retourne created: true même si l'injection de messages échoue (succès partiel)", async () => {
      vi.spyOn(internals.notion.blocks.children, 'list').mockRejectedValue(
        new Error('Notion API error')
      );

      const result = await service.createTicketFromCrispSession(
        crispSessionSample,
        [],
        null,
        false
      );

      expect(result.created).toBe(true);
      expect(result.ticket).toMatchObject({ id: 'new-page-id' });
    });
  });

  describe('fillMessageBlock', () => {
    let internals: NotionBugCreatorServiceInternals;

    beforeEach(() => {
      internals = service as unknown as NotionBugCreatorServiceInternals;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('ajoute les messages texte dans le tableau', async () => {
      const appendSpy = vi
        .spyOn(internals.notion.blocks.children, 'append')
        .mockResolvedValue({} as any);
      vi.spyOn(internals.notion.blocks.children, 'list').mockImplementation(
        async ({ block_id }: { block_id: string }) => {
          if (block_id === 'callout-block-id') {
            return {
              results: [messageTableBlock],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          if (block_id === 'table-block-id') {
            return {
              results: [headerTableRow],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          return { results: [], has_more: false, next_cursor: null } as any;
        }
      );

      await service.fillMessageBlock(
        [crispExchangesCalloutBlock],
        [crispTextMessage]
      );

      expect(appendSpy).toHaveBeenCalledWith({
        block_id: 'table-block-id',
        children: [
          expect.objectContaining({
            type: 'table_row',
            table_row: {
              cells: [
                [expect.objectContaining({ text: { content: expect.any(String) } })],
                [expect.objectContaining({ text: { content: 'Mathieu' } })],
                [expect.objectContaining({ text: { content: 'Bonjour' } })],
              ],
            },
          }),
        ],
      });
    });

    test('ne fait rien si le callout est absent', async () => {
      const listSpy = vi.spyOn(internals.notion.blocks.children, 'list');
      const appendSpy = vi.spyOn(internals.notion.blocks.children, 'append');

      await service.fillMessageBlock([], [crispTextMessage]);

      expect(listSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
    });

    test('ne fait rien si le tableau est absent dans le callout', async () => {
      const appendSpy = vi
        .spyOn(internals.notion.blocks.children, 'append')
        .mockResolvedValue({} as any);
      vi.spyOn(internals.notion.blocks.children, 'list').mockResolvedValue({
        results: [],
        has_more: false,
        next_cursor: null,
      } as any);

      await service.fillMessageBlock(
        [crispExchangesCalloutBlock],
        [crispTextMessage]
      );

      expect(appendSpy).not.toHaveBeenCalled();
    });

    test("n'appelle pas append s'il n'y a pas de nouveaux messages", async () => {
      const appendSpy = vi
        .spyOn(internals.notion.blocks.children, 'append')
        .mockResolvedValue({} as any);
      vi.spyOn(internals.notion.blocks.children, 'list').mockImplementation(
        async ({ block_id }: { block_id: string }) => {
          if (block_id === 'callout-block-id') {
            return {
              results: [messageTableBlock],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          if (block_id === 'table-block-id') {
            return {
              results: [headerTableRow],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          return { results: [], has_more: false, next_cursor: null } as any;
        }
      );

      await service.fillMessageBlock([crispExchangesCalloutBlock], []);

      expect(appendSpy).not.toHaveBeenCalled();
    });
  });

  describe('buildInformationsValues', () => {
    test('mappe les valeurs disponibles depuis la session Crisp', () => {
      const values = service.buildInformationsValues(
        {
          ...crispSessionSample,
          session_url: 'https://crisp.example/session',
          meta: {
            ...crispSessionSample.meta,
            data: {
              'ticket-url': 'https://tet.example/page',
              'ticket-niveau-de-gene': 'Eleve',
            },
          },
        },
        '13689 (Alsace)'
      );

      expect(values).toEqual({
        'email utilisateur': 'mathieu.teulier@ademe.fr',
        'conversation crisp': 'https://crisp.example/session',
        'id collectivite': '13689 (Alsace)',
        'url de la page': 'https://tet.example/page',
        'niveau de gene': 'Eleve',
      });
    });
  });

  describe('fillInformationsBlock', () => {
    let internals: NotionBugCreatorServiceInternals;

    beforeEach(() => {
      internals = service as unknown as NotionBugCreatorServiceInternals;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('met à jour les lignes du tableau Informations', async () => {
      const updateSpy = vi
        .spyOn(internals.notion.blocks, 'update')
        .mockResolvedValue({} as any);
      vi.spyOn(internals.notion.blocks.children, 'list').mockImplementation(
        async ({ block_id }: { block_id: string }) => {
          if (block_id === 'informations-callout-id') {
            return {
              results: [informationsTableBlock],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          if (block_id === 'informations-table-id') {
            return {
              results: [emailInfoTableRow, conversationInfoTableRow],
              has_more: false,
              next_cursor: null,
            } as any;
          }
          return { results: [], has_more: false, next_cursor: null } as any;
        }
      );

      await service.fillInformationsBlock(
        [informationsCalloutBlock],
        {
          ...crispSessionSample,
          session_url: 'https://crisp.example/session',
        },
        null
      );

      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith({
        block_id: 'email-info-row-id',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Email utilisateur' } }],
            [{ type: 'text', text: { content: 'mathieu.teulier@ademe.fr' } }],
          ],
        },
      });
      expect(updateSpy).toHaveBeenCalledWith({
        block_id: 'conversation-info-row-id',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Conversation Crisp' } }],
            [{ type: 'text', text: { content: 'https://crisp.example/session' } }],
          ],
        },
      });
    });

    test('ne fait rien si le callout Informations est absent', async () => {
      const listSpy = vi.spyOn(internals.notion.blocks.children, 'list');
      const updateSpy = vi.spyOn(internals.notion.blocks, 'update');

      await service.fillInformationsBlock(
        [crispExchangesCalloutBlock],
        crispSessionSample,
        null
      );

      expect(listSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
