'use client';

import { trpc } from '@/api/utils/trpc/client';
import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import { useRouter } from 'next/navigation';

/**
 * Redirige vers l'onglet par défaut ("mes indicateurs" si non vide ou
 * "indicateurs clés")
 */
export default function Page() {
  const router = useRouter();
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const { data: count, isLoading } =
    trpc.indicateurs.definitions.getMesIndicateursCount.useQuery({
      collectiviteId,
    }, {enabled: !isReadOnly});

  if (!isLoading) {
    router.replace(
      makeCollectiviteIndicateursListUrl({
        collectiviteId,
        listId: count ? 'mes-indicateurs' : 'cles',
      })
    );
  }
}
