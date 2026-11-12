import * as formatter from '@/app/plans/plans/show-plan/data/use-fiches-filters-list/filter-formatters';
import { FormFilters } from '@/app/plans/plans/show-plan/data/use-fiches-filters-list/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { listFichesRequestFiltersObjectSchema } from '@tet/domain/plans';
import { omit } from 'es-toolkit';
import { parseAsJson, useQueryState } from 'nuqs';
import { z } from 'zod';

const blocFiltersSchema = listFichesRequestFiltersObjectSchema
  .pick({
    thematiqueIds: true,
    statuts: true,
    noStatut: true,
    priorites: true,
    noPriorite: true,
    noPilote: true,
    noReferent: true,
    enCoursSansAvancement: true,
    notModifiedForOverAYear: true,
  })
  .extend({
    pilotes: z.array(z.string()).optional(),
    referents: z.array(z.string()).optional(),
  });

type BlocFilters = z.infer<typeof blocFiltersSchema>;

const omitEmpty = <T extends object>(object: T) =>
  Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== undefined && (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;

export const useSuiviPlanBlocFilters = (urlKey: string) => {
  const collectiviteId = useCollectiviteId();
  const [rawFilters, setRawFilters] = useQueryState(
    urlKey,
    parseAsJson(blocFiltersSchema.parse).withDefault({})
  );
  const { thematiqueIds = [], ...pilotageFilters } = rawFilters;

  const formFilters = formatter.toFilters({
    ...pilotageFilters,
    collectiviteId,
  });

  const save = (filters: BlocFilters) => {
    const cleaned = omitEmpty(filters);
    setRawFilters(Object.keys(cleaned).length ? cleaned : null);
  };

  const setFormFilters = (filters: FormFilters) => {
    save({
      thematiqueIds,
      ...omit(formatter.splitReferentsAndPilotesIds(filters), [
        'collectiviteId',
        'axes',
      ]),
    });
  };

  const queryFilters = formatter.toQueryPayload({
    ...pilotageFilters,
    collectiviteId,
  });

  const filtersCount =
    (thematiqueIds.length > 0 ? 1 : 0) +
    (['pilotes', 'statuts', 'referents', 'priorites', 'suivi'] as const).filter(
      (key) => (formFilters[key]?.length ?? 0) > 0
    ).length;

  return {
    thematiqueIds,
    setThematiqueIds: (ids: number[]) =>
      save({ ...pilotageFilters, thematiqueIds: ids }),
    formFilters,
    setFormFilters,
    filtersCount,
    resetFilters: () => setRawFilters(null),
    pilotageFilters: omitEmpty(pilotageFilters),
    queryInput: {
      thematiqueIds,
      filters: omitEmpty(queryFilters),
    },
  };
};
