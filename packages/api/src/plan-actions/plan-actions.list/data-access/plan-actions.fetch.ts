import { DBClient, Tables } from '@tet/api/typeUtils';
import {
  FetchOptions,
  fetchOptionsSchema,
  FetchSort,
} from '../domain/fetch-options.schema';

type TAxeRow = Tables<'axe'>;

type TFetchedData = {
  plans: TAxeRow[];
};

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options?: FetchOptions;
};

export const planActionsFetch = async ({
  dbClient,
  collectiviteId,
  options = {},
}: Props): Promise<TFetchedData> => {
  const { filtre, sort } = fetchOptionsSchema.parse(options);

  const query = dbClient
    .from('axe')
    .select()
    .eq('collectivite_id', collectiviteId)
    .is('parent', null);

  if (filtre?.planActionIds?.length) {
    query.in('id', filtre.planActionIds);
  }

  getFinalSort(sort).forEach((sort) => {
    query.order(sort.field, { ascending: sort.direction === 'asc' });
  });

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { plans: (data as TAxeRow[]) || [] };
};

function getFinalSort(sort?: Array<FetchSort>) {
  const defaultSort: FetchSort = {
    field: 'created_at',
    direction: 'asc',
  };

  return sort?.length ? sort : [defaultSort];
}
