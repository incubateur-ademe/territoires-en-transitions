import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AirtableService } from '../../airtable/airtable.service';
import ConfigurationService from '../../config/configuration.service';
import { NotionBugCreatorService } from '../../notion/notion-bug-creator/notion-bug-creator.service';
import { BuildCrispCrmNoteService } from './build-crisp-crm-note.service';
import { BuildCrispUserDataService } from './build-crisp-user-data.service';
import { CrispService } from './crisp.service';

const getConversation = vi.fn();
const updatePeopleData = vi.fn();
const sendMessageInConversation = vi.fn();

vi.mock('crisp-api', () => ({
  default: class {
    authenticateTier = vi.fn();
    website = {
      getConversation,
      updatePeopleData,
      sendMessageInConversation,
    };
  },
}));

const buildUserData = vi.fn();
const buildCrmNote = vi.fn();

const buildService = async () => {
  const module = await Test.createTestingModule({
    providers: [
      CrispService,
      { provide: NotionBugCreatorService, useValue: {} },
      { provide: AirtableService, useValue: {} },
      { provide: ConfigurationService, useValue: { get: vi.fn() } },
      { provide: BuildCrispUserDataService, useValue: { buildUserData } },
      { provide: BuildCrispCrmNoteService, useValue: { buildCrmNote } },
    ],
  }).compile();
  return module.get(CrispService);
};

describe('CrispService.enrichConversationWithUserData', () => {
  let service: CrispService;

  beforeEach(async () => {
    getConversation.mockReset().mockResolvedValue({
      people_id: 'people-1',
      meta: { email: 'agent@example.com' },
    });
    updatePeopleData.mockReset().mockResolvedValue({});
    buildUserData.mockReset().mockResolvedValue({
      connexion: 'ProConnect',
      fiche_crm: 'https://airtable.com/app/tbl/rec1',
    });
    service = await buildService();
  });

  test('écrit les données sur le contact de la conversation', async () => {
    await service.enrichConversationWithUserData('website', 'session');

    expect(updatePeopleData).toHaveBeenCalledWith('website', 'people-1', {
      data: {
        connexion: 'ProConnect',
        fiche_crm: 'https://airtable.com/app/tbl/rec1',
      },
    });
  });

  test('ne refait rien sur une conversation déjà enrichie', async () => {
    await service.enrichConversationWithUserData('website', 'session');
    await service.enrichConversationWithUserData('website', 'session');

    expect(getConversation).toHaveBeenCalledTimes(1);
    expect(updatePeopleData).toHaveBeenCalledTimes(1);
  });

  test('ignore un visiteur sans email', async () => {
    getConversation.mockResolvedValue({ people_id: 'people-1', meta: {} });

    await service.enrichConversationWithUserData('website', 'session');

    expect(buildUserData).not.toHaveBeenCalled();
  });

  test('avale les erreurs et retente au message suivant', async () => {
    buildUserData.mockRejectedValueOnce(new Error('Airtable down'));

    await expect(
      service.enrichConversationWithUserData('website', 'session')
    ).resolves.toBeUndefined();
    expect(updatePeopleData).not.toHaveBeenCalled();

    await service.enrichConversationWithUserData('website', 'session');
    expect(updatePeopleData).toHaveBeenCalledTimes(1);
  });
});

describe('CrispService — commande crm', () => {
  const noteFromOperator = (content: string) => ({
    website_id: 'website',
    event: 'message:send',
    timestamp: 0,
    data: {
      website_id: 'website',
      session_id: 'session',
      fingerprint: Math.random(),
      from: 'operator',
      type: 'note',
      content,
    },
  });

  beforeEach(() => {
    getConversation
      .mockReset()
      .mockResolvedValue({ meta: { email: 'agent@example.com' } });
    sendMessageInConversation.mockReset().mockResolvedValue({});
    buildCrmNote.mockReset().mockResolvedValue('récap CRM');
  });

  test.each(['crm', 'CRM', '@crm', '/@crm', '/crm'])(
    'répond par une note au message « %s »',
    async (content) => {
      const service = await buildService();

      await service.handleMessageReceived(noteFromOperator(content) as never);

      expect(buildCrmNote).toHaveBeenCalledWith('agent@example.com');
      expect(sendMessageInConversation).toHaveBeenCalledWith(
        'website',
        'session',
        expect.objectContaining({ type: 'note', content: 'récap CRM' })
      );
    }
  );

  test('ne se déclenche pas sur un mot commençant par crm', async () => {
    const service = await buildService();

    await service.handleMessageReceived(noteFromOperator('crmx') as never);

    expect(buildCrmNote).not.toHaveBeenCalled();
  });

  test('signale une conversation sans email', async () => {
    getConversation.mockResolvedValue({ meta: {} });
    const service = await buildService();

    await service.handleMessageReceived(noteFromOperator('crm') as never);

    expect(buildCrmNote).not.toHaveBeenCalled();
    expect(sendMessageInConversation).toHaveBeenCalledWith(
      'website',
      'session',
      expect.objectContaining({
        content: 'Aucun email connu pour cette conversation.',
      })
    );
  });
});

describe('CrispService — déclenchement de l’enrichissement', () => {
  beforeEach(() => {
    getConversation.mockReset().mockResolvedValue({
      people_id: 'people-1',
      meta: { email: 'agent@example.com' },
    });
    updatePeopleData.mockReset().mockResolvedValue({});
    buildUserData.mockReset().mockResolvedValue({ connexion: 'Email' });
  });

  test.each(['user', 'operator'])(
    'enrichit la conversation sur un message %s',
    async (from) => {
      const service = await buildService();

      await service.handleMessageReceived({
        website_id: 'website',
        event: 'message:received',
        timestamp: 0,
        data: {
          website_id: 'website',
          session_id: 'session',
          fingerprint: Math.random(),
          from,
          type: 'text',
          content: 'bonjour',
        },
      } as never);

      expect(updatePeopleData).toHaveBeenCalledWith('website', 'people-1', {
        data: { connexion: 'Email' },
      });
    }
  );
});
