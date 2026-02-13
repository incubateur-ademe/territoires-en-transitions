import { FicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction';
import { ScrollReset } from '@/app/utils/scroll-reset';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/trpc-server-client';
import { ReactNode } from 'react';
import z from 'zod';

const paramsSchema = z.object({
  actionId: z.coerce.number(),
});

export default async function FicheDetailPage({
  params,
  children,
}: {
  children?: ReactNode;
  params: Promise<{
    actionId: string;
    planId?: number;
  }>;
}) {
  const rawParams = await params;
  const { actionId } = paramsSchema.parse(rawParams);

  const fiche = await getQueryClient().fetchQuery(
    trpcInServerComponent.plans.fiches.get.queryOptions({
      id: actionId,
    })
  );

  if (!fiche) {
    return <div>Action non trouvée</div>;
  }
  return (
    <>
      {/* In client side routing, when going from a plan view, scroll might be preserved. This component resets the scroll to the top of the page. */}
      <ScrollReset />
      <FicheAction fiche={fiche}>{children}</FicheAction>
    </>
  );
}
