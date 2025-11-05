import { createEnumObject } from '@/domain/utils';

export const ficheAccessModes = ['direct', 'shared'] as const;

export type FicheAccessMode = (typeof ficheAccessModes)[number];

export const FicheAccessModeEnum = createEnumObject(ficheAccessModes);
