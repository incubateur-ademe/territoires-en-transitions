import {
  collectiviteBanaticSubType,
  type CollectiviteNatureType,
} from './collectivite-banatic-type.enum';
import { collectiviteTypeEnum } from './collectivite-type.enum';
import { Collectivite } from './collectivite.schema';
import { CollectiviteSousTypeEnum } from './identite-collectivite.schema';

export const EPCI_NATURES_WITH_OWN_FISCAL_AUTONOMY: readonly CollectiviteNatureType[] =
  ['CU', 'CA', 'CC', 'EPT', 'METRO'] as const;

export function hasOwnFiscalAutonomy(collectivite: {
  natureInsee: CollectiviteNatureType | null;
  banaticType: string | null;
}): boolean {
  if (!collectivite.natureInsee) {
    return false;
  }
  return (
    EPCI_NATURES_WITH_OWN_FISCAL_AUTONOMY.includes(collectivite.natureInsee) ||
    collectivite.banaticType === collectiviteBanaticSubType.FiscalitePropre
  );
}

const SYNDICAT_BANATIC_SUB_TYPES: readonly string[] = [
  collectiviteBanaticSubType.SyndicatMixte,
  collectiviteBanaticSubType.SyndicatCommunes,
];

export function getCollectiviteSousType(
  collectivite: Collectivite,
  banaticType: string | null
): CollectiviteSousTypeEnum | null {
  if (collectivite.type !== collectiviteTypeEnum.EPCI || banaticType === null) {
    return null;
  }
  if (SYNDICAT_BANATIC_SUB_TYPES.includes(banaticType)) {
    return CollectiviteSousTypeEnum.SYNDICAT;
  }
  return null;
}

export function isEligibleForUniqueReferential(collectivite: {
  type: string;
  fiscalitePropre: boolean | null | undefined;
}): boolean {
  return (
    collectivite.type === collectiviteTypeEnum.COMMUNE ||
    collectivite.fiscalitePropre === true
  );
}
