import 'server-only';

import {
  collectiviteBasePath,
  makeCollectiviteActionUrl,
} from '@/app/app/paths';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/trpc-server-client';
import { TRPCClientError } from '@trpc/client';
import { isFicheSectionId } from '../show-fiche/content/type';

const FICHE_PATH = new RegExp(
  `^${collectiviteBasePath}/(\\d+)/actions/(\\d+)(?:/([^/?]+))?/?(?:\\?(.*))?$`
);

/** Résout un ancien lien seulement après le constat d'une collectivité absente. */
export async function getMovedFicheUrl(
  previousCollectiviteId: number,
  currentPath: string | null
): Promise<string | null> {
  const match = currentPath && FICHE_PATH.exec(currentPath);
  if (!match || Number(match[1]) !== previousCollectiviteId) {
    return null;
  }

  const id = Number(match[2]);
  const content = match[3] ?? 'details';
  if (!Number.isSafeInteger(id) || id <= 0 || !isFicheSectionId(content)) {
    return null;
  }

  let fiche;
  try {
    // Le endpoint contrôle l'accès à la fiche dans sa collectivité actuelle,
    // y compris sa confidentialité. Ne pas lire l'archive administrative ici.
    fiche = await getQueryClient().fetchQuery(
      trpcInServerComponent.plans.fiches.get.queryOptions({ id })
    );
  } catch (error) {
    if (
      error instanceof TRPCClientError &&
      (error.data?.code === 'NOT_FOUND' || error.data?.code === 'FORBIDDEN')
    ) {
      return null;
    }
    throw error;
  }

  if (fiche.collectiviteId === previousCollectiviteId) {
    return null;
  }

  return makeCollectiviteActionUrl({
    collectiviteId: fiche.collectiviteId,
    ficheUid: String(id),
    content,
    searchParams: match[4],
  });
}
