import { DBClient } from '@tet/api/typeUtils';
import { objectToCamel } from 'ts-case-convert';
import { Axe } from '../../domain';
import {
  FetchOptions,
  fetchOptionsSchema,
  FetchSort,
} from '../domain/fetch-options.schema';

type FetchedPlanAction = Axe & {
  axes?: Axe[];
};

type TFetchedData = {
  plans: FetchedPlanAction[];
  count: number;
};

export type WithSelect = 'axes';

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options?: FetchOptions;
  withSelect?: WithSelect[];
};

export const planActionsFetch = async ({
  dbClient,
  collectiviteId,
  options = { filtre: {} },
  withSelect = [],
}: Props): Promise<TFetchedData> => {
  const { filtre, sort } = fetchOptionsSchema.parse(options);

  const parts = new Set<string>();
  parts.add('type:plan_action_type(*)');

  for (const select of withSelect) {
    if (select === 'axes') {
      parts.add('axes:axe_enfant(*)');
    }
  }

  const query = dbClient
    .from('axe')
    .select(['*', ...parts].join(','))
    .eq('collectivite_id', collectiviteId)
    .is('parent', null);

  if (filtre?.planActionIds?.length) {
    query.in('id', filtre.planActionIds);
  }

  getFinalSort(sort).forEach((sort) => {
    query.order(sort.field, { ascending: sort.direction === 'asc' });
  });

  const { error, data, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const result = objectToCamel(data) as unknown as FetchedPlanAction[];

  return {
    plans: result.map((plan) => ({
      ...plan,
      type: plan.type?.id ? plan.type : null,
    })),
    count: count ?? 0,
  };
};

function getFinalSort(sort?: Array<FetchSort>) {
  const defaultSort: FetchSort = {
    field: 'nom',
    direction: 'asc',
  };

  return sort?.length ? sort : [defaultSort];
}
