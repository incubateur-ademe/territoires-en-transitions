import { createEnumObject } from '@tet/domain/utils';

const FEATURE_FLAGS = [
  'is-referentiel-te-enabled',
  'is-widget-communs-enabled',
  'is-notification-enabled',
  'is-share-fiche-enabled',
  'is-access-edition-fiches-indicateurs-enabled',
] as const;

export const FeatureFlagEnum = createEnumObject(FEATURE_FLAGS);

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];
