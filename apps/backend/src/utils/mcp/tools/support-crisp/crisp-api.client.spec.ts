import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { CrispApiClient, retryDelayMs } from './crisp-api.client';

const config = {
  get: (key: string) =>
    ({
      CRISP_API_IDENTIFIER: 'id',
      CRISP_API_KEY: 'key',
      CRISP_WEBSITE_ID: 'site',
    }[key]),
} as unknown as ConfigurationService;

const reply = (status: number, body: unknown, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe('CrispApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('réessaie après une limite de débit (429)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply(
          429,
          { error: true, reason: 'rate_limited' },
          { 'retry-after': '2' }
        )
      )
      .mockResolvedValueOnce(
        reply(200, { error: false, data: { segments: ['bug_cr'] } })
      );
    vi.stubGlobal('fetch', fetchMock);

    const pending = new CrispApiClient(config).getSegments('session_1');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(await pending).toEqual({ success: true, data: ['bug_cr'] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('délai : Retry-After plafonné, sinon exponentiel', () => {
    expect(retryDelayMs('3', 0)).toBe(3_000);
    expect(retryDelayMs('120', 0)).toBe(30_000);
    expect(retryDelayMs(null, 2)).toBe(4_000);
  });
});
