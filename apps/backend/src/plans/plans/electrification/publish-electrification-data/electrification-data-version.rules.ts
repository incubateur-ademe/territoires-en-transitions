import {
  ElectrificationConfig,
  ElectrificationLaureatsConfig,
} from '@tet/domain/plans';
import { createHash } from 'node:crypto';

export type ElectrificationDataContent =
  | Omit<ElectrificationConfig, 'version'>
  | Omit<ElectrificationLaureatsConfig, 'version' | 'validFrom'>;

/** Identité du contenu publié, indépendante du run et de la révision Grist. */
export class ElectrificationDataVersion {
  static identify(
    data: ElectrificationDataContent & { version?: string; validFrom?: string }
  ): string {
    const { version: _version, validFrom: _validFrom, ...content } = data;
    // L'ordre des clés JSON n'est pas significatif ; celui des listes métier l'est.
    const json = JSON.stringify(content, (_key, value) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value).sort(([a], [b]) =>
              a < b ? -1 : a > b ? 1 : 0
            )
          )
        : value
    );
    return `sha256-${createHash('sha256').update(json).digest('hex')}`;
  }
}
