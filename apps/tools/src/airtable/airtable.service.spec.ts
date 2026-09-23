import { describe, expect, test, vi } from 'vitest';
import ConfigurationService from '../config/configuration.service';
import { AirtableService } from './airtable.service';

describe('AirtableService.getUsersByEmail', () => {
  const buildService = () => {
    const service = new AirtableService({
      get: vi.fn(),
    } as unknown as ConfigurationService);
    const getRecords = vi
      .spyOn(service, 'getRecords')
      .mockResolvedValue({ records: [] });
    return { service, getRecords };
  };

  test('compare les emails sans tenir compte de la casse', async () => {
    const { service, getRecords } = buildService();

    await service.getUsersByEmail(['Agent@Example.com']);

    expect(getRecords).toHaveBeenCalledWith(undefined, undefined, {
      filterByFormula: "LOWER(email)='agent@example.com'",
    });
  });

  test('combine plusieurs emails avec OR', async () => {
    const { service, getRecords } = buildService();

    await service.getUsersByEmail(['A@x.fr', 'b@x.fr']);

    expect(getRecords).toHaveBeenCalledWith(undefined, undefined, {
      filterByFormula: "OR(LOWER(email)='a@x.fr',LOWER(email)='b@x.fr')",
    });
  });
});

describe('AirtableService.getCollectiviteUrlsByIds', () => {
  const buildService = (tableId: string | undefined) => {
    const service = new AirtableService({
      get: (key: string) =>
        key === 'AIRTABLE_CRM_DATABASE_COLLECTIVITES_TABLE_ID'
          ? tableId
          : 'appCRM',
    } as unknown as ConfigurationService);
    const getRecords = vi.spyOn(service, 'getRecords').mockResolvedValue({
      records: [
        {
          id: 'rec1',
          url: 'https://airtable.com/appCRM/tblColl/rec1',
          fields: { collectivite_id: 12 },
          createdTime: '',
        },
      ],
    });
    return { service, getRecords };
  };

  test('associe chaque collectivite_id à l’URL de sa fiche', async () => {
    const { service, getRecords } = buildService('tblColl');

    const urls = await service.getCollectiviteUrlsByIds([12, 34]);

    expect(getRecords).toHaveBeenCalledWith('appCRM', 'tblColl', {
      filterByFormula:
        "OR({collectivite_id}&''='12',{collectivite_id}&''='34')",
      fields: ['collectivite_id'],
    });
    expect(urls.get(12)).toBe('https://airtable.com/appCRM/tblColl/rec1');
    expect(urls.has(34)).toBe(false);
  });

  test('n’appelle pas Airtable sans table configurée', async () => {
    const { service, getRecords } = buildService(undefined);

    expect((await service.getCollectiviteUrlsByIds([12])).size).toBe(0);
    expect(getRecords).not.toHaveBeenCalled();
  });
});
