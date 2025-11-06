import { createEnumObject } from '@/backend/utils/enum.utils';

export const NotifiedOn = ['update_fiche_pilote'] as const;

export const NotifiedOnEnum = createEnumObject(NotifiedOn);

export type NotifiedOnType = (typeof NotifiedOn)[number];
