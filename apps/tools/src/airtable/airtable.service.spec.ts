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
