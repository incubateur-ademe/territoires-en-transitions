import { type CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import { collectiviteTypeEnum } from '../../collectivites/collectivite-type.enum';
import { type CollectiviteResume } from '../../collectivites/collectivite.schema';
import { VerificationTrajectoireStatus } from '../verification-trajectoire-status';

export const SYNDICAT_NATURES: readonly CollectiviteNatureType[] = [
  'SMF',
  'SMO',
  'SIVU',
  'SIVOM',
  'POLEM',
  'PETR',
  'EPT',
];

export function isSyndicat(
  natureInsee: CollectiviteNatureType | null
): boolean {
  return natureInsee !== null && SYNDICAT_NATURES.includes(natureInsee);
}

export type UnsupportedTrajectoireStatus =
  | VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE
  | VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE;

export function isUnsupportedTrajectoireStatus(
  status: VerificationTrajectoireStatus
): status is UnsupportedTrajectoireStatus {
  return (
    status === VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE ||
    status === VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE
  );
}

export type TrajectoireComputability =
  | { canBeComputed: true; reason: null }
  | { canBeComputed: false; reason: UnsupportedTrajectoireStatus };

export function canComputeTrajectoireSnbc(
  collectivite: Pick<CollectiviteResume, 'type' | 'natureInsee'>
): TrajectoireComputability {
  if (collectivite.type === collectiviteTypeEnum.TEST) {
    return { canBeComputed: true, reason: null };
  }

  if (collectivite.type !== collectiviteTypeEnum.EPCI) {
    return {
      canBeComputed: false,
      reason: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    };
  }

  if (isSyndicat(collectivite.natureInsee)) {
    return {
      canBeComputed: false,
      reason: VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE,
    };
  }

  return { canBeComputed: true, reason: null };
}
