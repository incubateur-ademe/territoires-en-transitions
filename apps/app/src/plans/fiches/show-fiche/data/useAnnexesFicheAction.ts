import { toDocumentCollectivite } from '@/app/referentiels/preuves/Bibliotheque/to-document-collectivite.utils';
import {
  Fichier,
  PreuveAnnexe,
} from '@/app/referentiels/preuves/Bibliotheque/types';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { AnnexeDocument } from '@tet/domain/plans';

const toAnnexeFichier = (annexe: AnnexeDocument): Fichier | null => {
  const { fichier } = annexe;
  if (!fichier?.bucketId || !fichier.hash || !fichier.filename) {
    return null;
  }
  return {
    id: fichier.id,
    collectiviteId: annexe.collectiviteId,
    bucketId: fichier.bucketId,
    hash: fichier.hash,
    filename: fichier.filename,
    filesize: fichier.filesize ?? null,
    confidentiel: fichier.confidentiel ?? false,
  };
};

export function annexeDocumentToPreuve(annexe: AnnexeDocument): PreuveAnnexe {
  return {
    ...toDocumentCollectivite({
      id: annexe.id,
      collectiviteId: annexe.collectiviteId,
      commentaire: annexe.commentaire,
      modifiedAt: annexe.modifiedAt,
      modifiedBy: null,
      modifiedByNom: annexe.modifiedByNom,
      fichier: toAnnexeFichier(annexe),
      lien: annexe.lien ?? null,
    }),
    preuveType: 'annexe',
  };
}

/** renvoie les annexes associées à une fiche */
export const useAnnexesFicheAction = (
  collectiviteId: number,
  ficheId: number | null
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.ficheAnnexes.queryOptions(
      {
        collectiviteId,
        ficheIds: ficheId ? [ficheId] : [],
      },
      {
        enabled: !!ficheId,
        select: (annexes) => annexes.map(annexeDocumentToPreuve),
      }
    )
  );
};
