import { Test, TestingModule } from '@nestjs/testing';
import { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints';
import { ToolsAutomationApiConfigurationType } from '../../config/configuration.model';
import ConfigurationService from '../../config/configuration.service';
import { NotionBugCreatorService } from './notion-bug-creator.service';
import { crispSessionSample } from './samples/crisp-session.sample';
import { ticketDatabaseSample } from './samples/ticket-database.sample';

describe('NotionBugCreatorService', () => {
  let service: NotionBugCreatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotionBugCreatorService],
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return {
            get(key: keyof ToolsAutomationApiConfigurationType) {
              if (key === 'NOTION_BUG_DATABASE_ID') {
                return 'notionDatabaseId';
              } else if (key === 'NOTION_BUG_EPIC_ID') {
                return 'notionEpicId';
              }
            },
          };
        }
      })
      .compile();

    service = module.get<NotionBugCreatorService>(NotionBugCreatorService);
  });

  describe('getNotionBugFromCrispSession', () => {
    test('Standard test', () => {
      const notionBug = service.getNotionBugFromCrispSession(
        crispSessionSample,
        ticketDatabaseSample
      );
      const expectedNotionBug: CreatePageParameters = {
        icon: {
          type: 'external',
          external: { url: 'https://www.notion.so/icons/bug_red.svg' },
        },
        parent: { type: 'database_id', database_id: 'notionDatabaseId' },
        properties: {
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
              start: '2024-12-16T10:20:47.966+01:00',
              end: null,
              time_zone: null,
            },
          },
          'Epic (Roadmap)': {
            type: 'relation',
            relation: [{ id: 'notionEpicId' }],
          },
          Statut: { type: 'status', status: { name: 'Backlog' } },
          Name: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: { content: 'Erreur page Site Territoiresentransitions' },
              },
            ],
          },
        },
      };
      expect(notionBug).toEqual(expectedNotionBug);
    });
  });
});
