import { fetchCollectivitePanierInfo } from '@/app/collectivites/panier/data/fetchCollectivitePanierInfo';
import { AllPlansView } from '@/app/plans/plans/list-all-plans/all-plans.view';
import { appLabels } from '@/app/labels/catalog';
import { createSupabaseServerClient } from '@tet/api/utils/supabase/server-client';
import { z } from 'zod';

export default async function PlansListPage({
  params,
}: {
  params: Promise<{
    collectiviteId: string;
  }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const { success, data: collectiviteId } = z.coerce
    .number()
    .safeParse(unsafeCollectiviteId);

  if (!success) {
    return <div>{appLabels.collectiviteIdInvalide}</div>;
  }

  const supabaseClient = await createSupabaseServerClient();
  const panier = await fetchCollectivitePanierInfo(
    supabaseClient,
    collectiviteId
  );

  return <AllPlansView panierId={panier?.panierId} />;
}
