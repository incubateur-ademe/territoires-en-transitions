import {
  HttpClientModule,
  HttpNetworkError,
  HttpTimeoutError,
} from '@nestjs/http-client';
import { Test, TestingModule } from '@nestjs/testing';
import ConfigurationService from '../config/configuration.service';
import { CalendlyApiService } from './calendly-api.service';
import { CalendlyHttpClientModule } from './calendly-http-client.module';

describe('CalendlyApiService', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  let module: TestingModule;
  let service: CalendlyApiService;

  beforeEach(async () => {
    fetch.mockReset();
    module = await Test.createTestingModule({
      imports: [HttpClientModule.forRoot({ fetch }), CalendlyHttpClientModule],
      providers: [CalendlyApiService],
    })
      .overrideProvider(ConfigurationService)
      .useValue({ get: () => 'calendly-test-token' })
      .compile();
    await module.init();
    service = module.get(CalendlyApiService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await module.close();
  });

  test('authenticates and converts response keys to camelCase', async () => {
    fetch.mockResolvedValueOnce(
      Response.json({ resource: { current_organization: 'organization-uri' } })
    );
    await expect(service.getOrganizationURI()).resolves.toBe(
      'organization-uri'
    );
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe('https://api.calendly.com/users/me');
    expect(new Headers(options?.headers).get('authorization')).toBe(
      'Bearer calendly-test-token'
    );
  });

  test('encodes query parameters in snake_case', async () => {
    fetch.mockResolvedValueOnce(Response.json({ collection: [] }));
    await service.getNextSessionEvents('organization?value=1', []);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.searchParams.get('organization')).toBe('organization?value=1');
    expect(url.searchParams.has('min_start_time')).toBe(true);
    expect(url.searchParams.has('max_start_time')).toBe(true);
  });

  test('accepts a session URI on the Calendly origin', async () => {
    fetch.mockResolvedValueOnce(
      Response.json({
        collection: [
          {
            questions_and_answers: [
              { question: 'Votre collectivité ?', answer: 'Ville de test' },
            ],
          },
        ],
      })
    );
    await expect(
      service.getSessionDemoInvitees(
        'https://api.calendly.com/scheduled_events/1'
      )
    ).resolves.toEqual([
      {
        questionsAndAnswers: [
          { question: 'Votre collectivité ?', answer: 'Ville de test' },
        ],
        collectivite: 'Ville de test',
      },
    ]);
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://api.calendly.com/scheduled_events/1/invitees'
    );
  });

  test('refuses a session URI on another origin without sending credentials', async () => {
    await expect(
      service.getSessionDemoInvitees('https://untrusted.example/events/1')
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('refuses redirects to another origin without following them', async () => {
    fetch.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://untrusted.example/users' },
      })
    );
    await expect(service.getOrganizationURI()).rejects.toBeInstanceOf(
      HttpNetworkError
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test.each([401, 429, 503])(
    'returns no organization on HTTP %i without retrying',
    async (status) => {
      fetch.mockResolvedValueOnce(
        Response.json({ message: 'failure' }, { status })
      );
      await expect(service.getOrganizationURI()).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

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
    const result = expect(service.getOrganizationURI()).rejects.toBeInstanceOf(
      HttpTimeoutError
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
