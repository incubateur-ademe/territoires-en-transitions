import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Membre } from './types';

/**
 * Donne accès à la liste des membres de la collectivité courante
 */
export const useCollectiviteMembres = (pageNum?: number) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data, ...otherProps } = useQuery({
    queryKey: getQueryKey(collectiviteId, pageNum),

    queryFn: () =>
      collectiviteId
        ? fetchMembresForCollectivite(supabase, collectiviteId, pageNum)
        : NO_RESULT,
  });

  return { data: data || NO_RESULT, ...otherProps };
};

export const getQueryKey = (collectivite_id: number | null, pageNum?: number) =>
  pageNum
    ? ['collectivite_membres', collectivite_id, pageNum]
    : ['collectivite_membres', collectivite_id];

export const PAGE_SIZE = 30;
const NO_RESULT = { membres: [], count: 0 };

const fetchMembresForCollectivite = async (
  supabase: DBClient,
  collectiviteId: number,
  pageNum?: number
) => {
  let select = supabase
    .rpc('collectivite_membres', { id: collectiviteId }, { count: 'exact' })
    .select()
    .order('prenom', { ascending: true, nullsFirst: true })
    .returns<Membre[]>();

  if (pageNum !== undefined) {
    const from = (pageNum - 1) * PAGE_SIZE;
    select = select.range(from, from + PAGE_SIZE - 1);
  }

  const { data, error, count } = await select;

  return error ? NO_RESULT : { membres: data, count: count as number };
};

export type CollectiviteMembres = Awaited<
  ReturnType<typeof fetchMembresForCollectivite>
>;
