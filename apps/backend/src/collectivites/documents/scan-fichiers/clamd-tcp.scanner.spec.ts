import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { once } from 'node:events';
import { createServer, type AddressInfo, type Server } from 'node:net';
import { Readable } from 'node:stream';
import { ClamdTcpScanner, parseScanReply } from './clamd-tcp.scanner';

const INFECTED_MARKER = 'MARQUEUR-INFECTE';

/**
 * Faux clamd : décode les blocs INSTREAM comme le vrai démon, et répond
 * FOUND si le flux reconstitué contient le marqueur.
 */
const startFakeClamd = async (
  options: { replyBeforeEnd?: string } = {}
): Promise<{ server: Server; port: number; received: () => Buffer }> => {
  let lastPayload = Buffer.alloc(0);
  const server = createServer((socket) => {
    let buffer = Buffer.alloc(0);
    let command: string | undefined;
    const payload: Buffer[] = [];
    let replied = false;
    const reply = (message: string) => {
      replied = true;
      socket.end(message);
    };

    socket.on('data', (data) => {
      if (replied) {
        return;
      }
      buffer = Buffer.concat([buffer, data]);
      if (command === undefined) {
        const end = buffer.indexOf(0);
        if (end === -1) {
          return;
        }
        command = buffer.subarray(0, end).toString();
        buffer = buffer.subarray(end + 1);
        if (command === 'zVERSION') {
          reply('ClamAV 1.5.4/28171/Sun Nov  2 01:45:00 2026\0');
          return;
        }
        if (options.replyBeforeEnd) {
          reply(`${options.replyBeforeEnd}\0`);
          return;
        }
      }
      while (buffer.length >= 4) {
        const length = buffer.readUInt32BE(0);
        if (length === 0) {
          lastPayload = Buffer.concat(payload);
          reply(
            lastPayload.includes(INFECTED_MARKER)
              ? 'stream: Fake.Test.Signature FOUND\0'
              : 'stream: OK\0'
          );
          return;
        }
        if (buffer.length < 4 + length) {
          return;
        }
        payload.push(buffer.subarray(4, 4 + length));
        buffer = buffer.subarray(4 + length);
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    server,
    port: (server.address() as AddressInfo).port,
    received: () => lastPayload,
  };
};

const buildScanner = (config: Record<string, unknown>) =>
  new ClamdTcpScanner({
    get: (key: string) => config[key],
  } as unknown as ConfigurationService);

describe('parseScanReply', () => {
  test('flux sain', () => {
    expect(parseScanReply('stream: OK')).toEqual({
      success: true,
      data: { status: 'clean' },
    });
  });

  test('flux infecté : la signature est extraite', () => {
    expect(parseScanReply('stream: Win.Test.EICAR_HDB-1 FOUND')).toEqual({
      success: true,
      data: { status: 'infected', signature: 'Win.Test.EICAR_HDB-1' },
    });
  });

  test('erreur de clamd : échec, jamais un verdict', () => {
    expect(parseScanReply('INSTREAM size limit exceeded. ERROR')).toMatchObject(
      { success: false, error: 'SCAN_FAILED' }
    );
  });
});

describe('ClamdTcpScanner', () => {
  let fake: Awaited<ReturnType<typeof startFakeClamd>>;

  afterEach(() => {
    fake?.server.close();
  });

  test('désactivé sans hôte', () => {
    expect(buildScanner({}).isEnabled()).toBe(false);
  });

  test('transmet le flux entier, découpé en blocs', async () => {
    fake = await startFakeClamd();
    const scanner = buildScanner({
      CLAMAV_HOST: '127.0.0.1',
      CLAMAV_PORT: fake.port,
    });
    const content = Buffer.alloc(300_000, 'a');

    const result = await scanner.scan(
      Readable.from([content.subarray(0, 100_000), content.subarray(100_000)])
    );

    expect(result).toEqual({ success: true, data: { status: 'clean' } });
    expect(fake.received().equals(content)).toBe(true);
  });

  test('signale un fichier infecté', async () => {
    fake = await startFakeClamd();
    const scanner = buildScanner({
      CLAMAV_HOST: '127.0.0.1',
      CLAMAV_PORT: fake.port,
    });

    const result = await scanner.scan(
      Readable.from([Buffer.from(`début ${INFECTED_MARKER} fin`)])
    );

    expect(result).toEqual({
      success: true,
      data: { status: 'infected', signature: 'Fake.Test.Signature' },
    });
  });

  test('une réponse anticipée de clamd (limite de taille) est un échec d’analyse', async () => {
    fake = await startFakeClamd({
      replyBeforeEnd: 'INSTREAM size limit exceeded. ERROR',
    });
    const scanner = buildScanner({
      CLAMAV_HOST: '127.0.0.1',
      CLAMAV_PORT: fake.port,
    });

    const result = await scanner.scan(
      Readable.from([Buffer.alloc(2_000_000, 'a')])
    );

    expect(result).toMatchObject({ success: false, error: 'SCAN_FAILED' });
  });

  test('lit la version du moteur', async () => {
    fake = await startFakeClamd();
    const scanner = buildScanner({
      CLAMAV_HOST: '127.0.0.1',
      CLAMAV_PORT: fake.port,
    });

    expect(await scanner.getEngineVersion()).toEqual({
      success: true,
      data: 'ClamAV 1.5.4/28171/Sun Nov  2 01:45:00 2026',
    });
  });

  test('démon injoignable : indisponible, pas un verdict', async () => {
    fake = await startFakeClamd();
    const port = fake.port;
    fake.server.close();
    await once(fake.server, 'close');
    const scanner = buildScanner({
      CLAMAV_HOST: '127.0.0.1',
      CLAMAV_PORT: port,
    });

    expect(await scanner.scan(Readable.from([Buffer.from('x')]))).toEqual({
      success: false,
      error: 'SCANNER_UNAVAILABLE',
    });
  });
});
