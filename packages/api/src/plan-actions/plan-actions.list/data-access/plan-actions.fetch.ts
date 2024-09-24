import { DBClient, Tables } from '@tet/api/typeUtils';

type TAxeRow = Tables<'axe'>;

type TFetchedData = {
  plans: TAxeRow[];
};

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
};

export const planActionsFetch = async ({
  dbClient,
  collectiviteId,
}: Props): Promise<TFetchedData> => {
  const query = dbClient
    .from('axe')
    .select()
    .eq('collectivite_id', collectiviteId)
    .is('parent', null)
    .order('created_at', { ascending: true });

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { plans: (data as TAxeRow[]) || [] };
};
