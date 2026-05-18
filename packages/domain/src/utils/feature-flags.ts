import { createEnumObject } from '@tet/domain/utils';

const FEATURE_FLAGS = [
  'is-referentiel-te-enabled',
  'is-share-fiche-enabled',
  'is-new-referentiel-layout-enabled',
  'is-action-default-table-view-enabled',
  'is-demarche-pcaet-enabled',
] as const;

export const FeatureFlagEnum = createEnumObject(FEATURE_FLAGS);

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];
