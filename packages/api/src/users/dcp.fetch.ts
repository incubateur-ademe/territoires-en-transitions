import { DBClient } from '@/api/typeUtils';

export const dcpFetch = async ({
  dbClient,
  user_id,
}: {
  dbClient: DBClient;
  user_id: string;
}) => {
  const { data } = await dbClient
    .from('dcp')
    .select('user_id,nom,prenom,telephone,cgu_acceptees_le,email')
    .match({ user_id });

  return data?.length ? data[0] : null;
};
