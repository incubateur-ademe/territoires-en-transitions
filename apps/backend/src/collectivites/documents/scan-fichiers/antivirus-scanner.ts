import { type Result } from '@tet/backend/utils/result.type';
import { type Readable } from 'node:stream';

export type AntivirusVerdict =
  | { status: 'clean' }
  | { status: 'infected'; signature: string };

export type AntivirusScannerError =
  /** Démon injoignable ou muet : rien n'a été analysé. */
  | 'SCANNER_UNAVAILABLE'
  /** Le démon a répondu par une erreur (taille dépassée, flux illisible…). */
  | 'SCAN_FAILED';

/**
 * Moteur d'analyse antivirus, indépendant de son transport : le balayage ne
 * connaît que cette interface, et l'hébergement de clamd (Koyeb, Coolify) se
 * change par configuration.
 */
export abstract class AntivirusScanner {
  abstract isEnabled(): boolean;

  abstract scan(
    content: Readable
  ): Promise<Result<AntivirusVerdict, AntivirusScannerError>>;

  /** Version du moteur et de sa base de signatures, consignée avec le verdict. */
  abstract getEngineVersion(): Promise<Result<string, AntivirusScannerError>>;
}
