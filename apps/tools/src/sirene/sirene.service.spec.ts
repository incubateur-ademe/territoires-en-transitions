import { HttpClientModule, HttpTimeoutError } from '@nestjs/http-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodError } from 'zod';
import ConfigurationService from '../config/configuration.service';
import { SireneHttpClientModule } from './sirene-http-client.module';
import { SireneService } from './sirene.service';

const response = {
  header: { statut: 200, message: 'OK' },
  unitesLegales: [
    {
      siren: '200034825',
      periodesUniteLegale: [
        {
          dateFin: '2020-01-01',
          dateDebut: '2010-01-01',
          nicSiegeUniteLegale: '00001',
        },
        {
          dateFin: null,
          dateDebut: '2020-01-02',
          nicSiegeUniteLegale: '00014',
        },
      ],
    },
  ],
};

describe('SireneService', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  let service: SireneService;
  let module: TestingModule;

  beforeEach(async () => {
    fetch.mockReset();
    module = await Test.createTestingModule({
      imports: [HttpClientModule.forRoot({ fetch }), SireneHttpClientModule],
      providers: [SireneService],
    })
      .overrideProvider(ConfigurationService)
      .useValue({
        get: (key: string) =>
          key === 'SIRENE_API_URL'
            ? 'https://api.insee.fr/api-sirene/3.11'
            : 'sirene-test-key',
      })
      .compile();
    await module.init();
    service = module.get(SireneService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await module.close();
  });

  test('finds the current NIC and sends the authenticated form to the configured path', async () => {
    fetch.mockResolvedValueOnce(Response.json(response));
    await expect(service.getNIC(['200034825'])).resolves.toEqual([
      { siren: '200034825', nic: '00014' },
    ]);
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe('https://api.insee.fr/api-sirene/3.11/siren');
    expect(options?.method).toBe('POST');
    const headers = new Headers(options?.headers);
    expect(headers.get('X-INSEE-Api-Key-Integration')).toBe('sirene-test-key');
    expect(headers.get('content-type')).toBe(
      'application/x-www-form-urlencoded'
    );
    expect(String(options?.body)).toBe(
      new URLSearchParams({
        q: '(siren:200034825)',
        champs: 'siren,nicSiegeUniteLegale',
        nombre: '1',
      }).toString()
    );
  });

  test('validates the external response before exposing data', async () => {
    fetch.mockResolvedValueOnce(Response.json({ unitesLegales: 'invalid' }));
    await expect(service.getNIC(['200034825'])).rejects.toBeInstanceOf(
      ZodError
    );
  });

  test.each([401, 429, 503])(
    'returns an empty result on HTTP %i without retrying',
    async (status) => {
      fetch.mockResolvedValueOnce(
        new Response('Upstream unavailable', { status })
      );
      await expect(service.getNIC(['200034825'])).resolves.toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  test('splits requests into at most one thousand SIRENs', async () => {
    fetch.mockImplementation(async () =>
      Response.json({ ...response, unitesLegales: [] })
    );
    await service.getNIC(
      Array.from({ length: 1001 }, (_, i) => String(i).padStart(9, '0'))
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      fetch.mock.calls.map(([, options]) =>
        new URLSearchParams(String(options?.body)).get('nombre')
      )
    ).toEqual(['1000', '1']);
  });

  test('does not call the upstream for an empty list', async () => {
    await expect(service.getNIC([])).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('aborts an unanswered request after ten seconds without retrying', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(options.signal?.reason)
          );
        })
    );
    const result = expect(service.getNIC(['200034825'])).rejects.toBeInstanceOf(
      HttpTimeoutError
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
