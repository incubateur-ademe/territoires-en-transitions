import { ElectrificationLaureatsConfig } from '@tet/domain/plans';

export class ElectrificationLaureatsRules {
  static validate({
    validFrom,
    validUntil,
    laureats,
  }: ElectrificationLaureatsConfig):
    | 'INVALID_ELECTRIFICATION_LAUREATS_CONFIG'
    | 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG'
    | null {
    if (
      validUntil !== null &&
      Date.parse(validFrom) >= Date.parse(validUntil)
    ) {
      return 'INVALID_ELECTRIFICATION_LAUREATS_CONFIG';
    }
    if (
      new Set(laureats.map(({ reference }) => reference)).size !==
        laureats.length ||
      new Set(laureats.map(({ collectiviteId }) => collectiviteId)).size !==
        laureats.length
    ) {
      return 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG';
    }
    return null;
  }
}
