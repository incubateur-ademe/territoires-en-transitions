import { createEnumObject } from '@/backend/utils/enum.utils';

export const ficheAccessModes = ['direct', 'shared'] as const;

export type FicheAccessMode = (typeof ficheAccessModes)[number];

export const FicheAccessModeEnum = createEnumObject(ficheAccessModes);
