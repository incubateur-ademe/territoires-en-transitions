import { countByPropertyEnumSchema } from '@/backend/plans/fiches/count-by/count-by-property-options.enum';
import { listFichesRequestFiltersSchema } from '@/backend/plans/fiches/shared/filters/filters.request';
import { z } from 'zod';

const arrayCountByPropertyValues = [
  'partenaires',
  'services',
  'plans',
  'libreTags',
  'thematiques',
  'sousThematiques',
  'structures',
  'effetsAttendus',
] as const;

type FilterArray =
  | 'partenaireIds'
  | 'servicePiloteIds'
  | 'planActionIds'
  | 'libreTagsIds'
  | 'thematiqueIds'
  | 'sousThematiqueIds'
  | 'structurePiloteIds';

export type ArrayCountByProperty = (typeof arrayCountByPropertyValues)[number];

export const countByPropertyFichesFiltersKeysMapping: Partial<
  Record<ArrayCountByProperty, FilterArray>
> = {
  partenaires: 'partenaireIds',
  services: 'servicePiloteIds',
  plans: 'planActionIds',
  libreTags: 'libreTagsIds',
  thematiques: 'thematiqueIds',
  sousThematiques: 'sousThematiqueIds',
  structures: 'structurePiloteIds',
};

export const isArrayCountByProperty = (
  countByProperty: string
): countByProperty is ArrayCountByProperty => {
  return arrayCountByPropertyValues.includes(
    countByProperty as ArrayCountByProperty
  );
};

export const countByRequestSchema = z.object({
  collectiviteId: z.number(),
  countByProperty: countByPropertyEnumSchema,
  filter: listFichesRequestFiltersSchema,
});

export type CountByRequest = z.infer<typeof countByRequestSchema>;
