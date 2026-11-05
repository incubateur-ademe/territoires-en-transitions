import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { connect, type Socket } from 'node:net';
import { type Readable } from 'node:stream';
import {
  AntivirusScanner,
  type AntivirusScannerError,
  type AntivirusVerdict,
} from './antivirus-scanner';

// Un fichier de 50 Mio passe largement ; au-delà, clamd est jugé bloqué.
const SCAN_TIMEOUT_MS = 2 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 10 * 1000;

const END_OF_STREAM = Buffer.alloc(4);

/**
 * Client du protocole clamd, en TCP : `zINSTREAM` puis des blocs préfixés de
 * leur longueur (uint32 big-endian), clos par un bloc vide. clamd n'a aucune
 * authentification ; son port ne doit être joignable que sur un réseau privé.
 */
@Injectable()
export class ClamdTcpScanner extends AntivirusScanner {
  private readonly logger = new Logger(ClamdTcpScanner.name);

  constructor(private readonly configurationService: ConfigurationService) {
    super();
  }

  isEnabled(): boolean {
    return Boolean(this.configurationService.get('CLAMAV_HOST'));
  }

  async getEngineVersion(): Promise<Result<string, AntivirusScannerError>> {
    const result = await this.exchange(async (socket) => {
      socket.write('zVERSION\0');
    }, COMMAND_TIMEOUT_MS);
    return result.success ? success(result.data) : result;
  }

  async scan(
    content: Readable
  ): Promise<Result<AntivirusVerdict, AntivirusScannerError>> {
    const result = await this.exchange(async (socket) => {
      socket.write('zINSTREAM\0');
      for await (const chunk of content) {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (data.length === 0) {
          continue;
        }
        const header = Buffer.alloc(4);
        header.writeUInt32BE(data.length);
        if (!socket.write(Buffer.concat([header, data]))) {
          await waitForDrain(socket);
        }
      }
      socket.write(END_OF_STREAM);
    }, SCAN_TIMEOUT_MS);

    if (!result.success) {
      return result;
    }
    return parseScanReply(result.data);
  }

  /**
   * Ouvre une connexion, laisse `send` écrire la commande, puis lit la réponse
   * jusqu'au caractère nul final.
   */
  private exchange(
    send: (socket: Socket) => Promise<void>,
    timeoutMs: number
  ): Promise<Result<string, AntivirusScannerError>> {
    const host = this.configurationService.get('CLAMAV_HOST');
    const port = Number(this.configurationService.get('CLAMAV_PORT'));
    if (!host) {
      return Promise.resolve(failure('SCANNER_UNAVAILABLE'));
    }

    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      let settled = false;
      const settle = (result: Result<string, AntivirusScannerError>) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve(result);
      };
      const reply = () =>
        Buffer.concat(chunks).toString('utf8').replace(/\0+$/, '').trim();

      const socket = connect({ host, port });
      socket.setTimeout(timeoutMs);

      let connected = false;
      socket.on('connect', () => {
        connected = true;
        send(socket).catch((error) => {
          // clamd coupe la connexion dès qu'une limite est franchie : sa
          // réponse, déjà reçue, explique l'échec mieux que l'EPIPE.
          if (chunks.length > 0) {
            settle(success(reply()));
            return;
          }
          this.logger.warn(`Envoi à clamd échoué : ${getErrorMessage(error)}`);
          settle(failure('SCAN_FAILED'));
        });
      });
      socket.on('data', (data) => {
        chunks.push(data);
        if (data.includes(0)) {
          settle(success(reply()));
        }
      });
      socket.on('end', () => {
        settle(chunks.length > 0 ? success(reply()) : failure('SCAN_FAILED'));
      });
      socket.on('timeout', () => {
        this.logger.error(`clamd muet après ${timeoutMs} ms (${host}:${port})`);
        settle(failure('SCANNER_UNAVAILABLE'));
      });
      socket.on('error', (error) => {
        if (chunks.length > 0) {
          settle(success(reply()));
          return;
        }
        // Connexion coupée en cours d'envoi : clamd a rejeté ce flux (limite
        // de taille, le plus souvent) sans que sa réponse nous parvienne.
        // Échec propre à l'objet, qui ne doit pas interrompre le balayage.
        if (connected) {
          this.logger.warn(
            `clamd a coupé la connexion en cours d'analyse : ${getErrorMessage(
              error
            )}`
          );
          settle(failure('SCAN_FAILED'));
          return;
        }
        this.logger.error(
          `clamd injoignable (${host}:${port}) : ${getErrorMessage(error)}`
        );
        settle(failure('SCANNER_UNAVAILABLE'));
      });
    });
  }
}

const waitForDrain = (socket: Socket) =>
  new Promise<void>((resolve, reject) => {
    const onDrain = () => {
      socket.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      socket.off('drain', onDrain);
      reject(error);
    };
    socket.once('drain', onDrain);
    socket.once('error', onError);
  });

/**
 * Réponses de clamd à INSTREAM : `stream: OK`, `stream: <signature> FOUND`,
 * ou `<message> ERROR` (taille dépassée, par exemple).
 */
export const parseScanReply = (
  reply: string
): Result<AntivirusVerdict, AntivirusScannerError> => {
  if (reply === 'stream: OK') {
    return success({ status: 'clean' });
  }
  const found = /^stream: (.+) FOUND$/.exec(reply);
  if (found) {
    return success({ status: 'infected', signature: found[1] });
  }
  return failure('SCAN_FAILED', new Error(`Réponse de clamd : ${reply}`));
};
