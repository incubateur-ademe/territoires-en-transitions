import { ElectrificationConfig } from '@tet/domain/plans';
import { electrificationV4Snapshot } from './electrification-v4-snapshot.constants';

/** Relecture des snapshots immuables publiés avant engagementsFormat=2.
 * Aucune publication depuis les sources ne passe par cet adaptateur. */
export class ReadElectrificationV4Snapshot {
  static isSupported(catalogue: ElectrificationConfig): boolean {
    const codes = Object.keys(electrificationV4Snapshot.labels);
    return (
      catalogue.engagements.length === codes.length &&
      codes.every((code) =>
        catalogue.engagements.some((engagement) => engagement.code === code)
      )
    );
  }

  static adapt(catalogue: ElectrificationConfig): ElectrificationConfig {
    if (catalogue.engagementsFormat === 2) return catalogue;
    const units: Record<string, string> = {
      E01: '%',
      E02: '%',
      E04: '%',
      E05: '%',
      E06: '%',
      E07: 'Nombre de bornes',
      E08: '%',
      E09: 'Nombre',
      E10: 'MWh',
      E11: 'MWh',
    };
    const labels: Record<string, string> = electrificationV4Snapshot.labels;
    return {
      ...catalogue,
      engagements: catalogue.engagements.map((engagement) => ({
        ...engagement,
        libelleSource: labels[engagement.code],
        cibles: engagement.cibles.map((cible) => ({
          ...cible,
          uniteImport: cible.uniteImport ?? units[engagement.code],
          reglesImport: {
            annee: 2030,
            minimum: 0,
            maximum: cible.unite === '%' ? 100 : null,
            plafondCible:
              engagement.code === 'E07' && cible.key === 'rapides'
                ? 'total'
                : null,
            libelles:
              engagement.code === 'E07'
                ? cible.key === 'total'
                  ? ['total', 'publiques']
                  : ['rapide', 'rapides']
                : [],
            unites:
              engagement.code === 'E07'
                ? ['borne', 'bornes']
                : engagement.code === 'E09'
                ? ['artisan', 'artisans', 'nb']
                : [],
          },
        })),
      })),
    };
  }
}
