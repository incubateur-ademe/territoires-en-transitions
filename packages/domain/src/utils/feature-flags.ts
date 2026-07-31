import { createEnumObject } from '@tet/domain/utils';

const FEATURE_FLAGS = [
  'is-referentiel-te-enabled',
  'is-share-fiche-enabled',
  'is-new-referentiel-layout-enabled',
  'is-action-default-table-view-enabled',
] as const;

export const FeatureFlagEnum = createEnumObject(FEATURE_FLAGS);

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];
