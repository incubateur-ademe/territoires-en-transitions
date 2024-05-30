import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Membre} from './types';

/**
 * Donne accès à la liste des membres de la collectivité courante
 */
export const useCollectiviteMembres = (pageNum: number = 1) => {
  const collectiviteId = useCollectiviteId();
  const {data, ...otherProps} = useQuery(
    getQueryKey(collectiviteId, pageNum),
    () =>
      collectiviteId
        ? fetchMembresForCollectivite(collectiviteId, pageNum)
        : NO_RESULT
  );

  return {data: data || NO_RESULT, ...otherProps};
};

export const getQueryKey = (collectivite_id: number | null, pageNum?: number) =>
  pageNum
    ? ['collectivite_membres', collectivite_id, pageNum]
    : ['collectivite_membres', collectivite_id];

export const PAGE_SIZE = 30;
const NO_RESULT = {membres: [], count: 0};

const fetchMembresForCollectivite = async (
  collectiviteId: number,
  pageNum: number
) => {
  const from = (pageNum - 1) * PAGE_SIZE;
  const {data, error, count} = await supabaseClient
    .rpc('collectivite_membres', {id: collectiviteId}, {count: 'exact'})
    .select()
    .range(from, from + PAGE_SIZE - 1)
    .returns<Membre[]>();

  return error ? NO_RESULT : {membres: data, count: count as number};
};

export type CollectiviteMembres = Awaited<
  ReturnType<typeof fetchMembresForCollectivite>
>;
