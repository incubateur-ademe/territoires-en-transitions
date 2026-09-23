import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AirtableService } from '../../airtable/airtable.service';
import ConfigurationService from '../../config/configuration.service';
import { NotionBugCreatorService } from '../../notion/notion-bug-creator/notion-bug-creator.service';
import { BuildCrispUserDataService } from './build-crisp-user-data.service';
import { CrispService } from './crisp.service';

const getConversation = vi.fn();
const updateConversationMetas = vi.fn();

vi.mock('crisp-api', () => ({
  default: class {
    authenticateTier = vi.fn();
    website = { getConversation, updateConversationMetas };
  },
}));

describe('CrispService.enrichConversationWithUserData', () => {
  let service: CrispService;
  const buildUserData = vi.fn();

  beforeEach(async () => {
    getConversation.mockReset();
    updateConversationMetas.mockReset().mockResolvedValue({});
    buildUserData.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        CrispService,
        { provide: NotionBugCreatorService, useValue: {} },
        { provide: AirtableService, useValue: {} },
        { provide: ConfigurationService, useValue: { get: vi.fn() } },
        { provide: BuildCrispUserDataService, useValue: { buildUserData } },
      ],
    }).compile();

    service = module.get(CrispService);
  });

  test('fusionne les données calculées avec celles de la conversation', async () => {
    getConversation.mockResolvedValue({
      meta: { email: 'agent@example.com', data: { existante: 'x' } },
    });
    buildUserData.mockResolvedValue({
      connexion: 'ProConnect',
      fiche_crm: 'https://airtable.com/app/tbl/rec1',
    });

    await service.enrichConversationWithUserData('website', 'session');

    expect(updateConversationMetas).toHaveBeenCalledWith('website', 'session', {
      data: {
        existante: 'x',
        connexion: 'ProConnect',
        fiche_crm: 'https://airtable.com/app/tbl/rec1',
      },
    });
  });

  test('ne refait rien sur une conversation déjà enrichie', async () => {
    getConversation.mockResolvedValue({
      meta: { email: 'agent@example.com', data: { connexion: 'Email' } },
    });

    await service.enrichConversationWithUserData('website', 'session');

    expect(buildUserData).not.toHaveBeenCalled();
    expect(updateConversationMetas).not.toHaveBeenCalled();
  });

  test('ignore un visiteur sans email', async () => {
    getConversation.mockResolvedValue({ meta: { data: {} } });

    await service.enrichConversationWithUserData('website', 'session');

    expect(buildUserData).not.toHaveBeenCalled();
  });

  test('avale les erreurs sans rien écrire dans la conversation', async () => {
    getConversation.mockResolvedValue({
      meta: { email: 'agent@example.com', data: {} },
    });
    buildUserData.mockRejectedValue(new Error('Airtable down'));

    await expect(
      service.enrichConversationWithUserData('website', 'session')
    ).resolves.toBeUndefined();
    expect(updateConversationMetas).not.toHaveBeenCalled();
  });
});
