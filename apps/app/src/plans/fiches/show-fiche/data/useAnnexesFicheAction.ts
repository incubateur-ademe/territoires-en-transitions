import { PreuveAnnexe } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { AnnexeDocument } from '@tet/domain/plans';

export function annexeDocumentToPreuve(annexe: AnnexeDocument): PreuveAnnexe {
  const base = {
    id: annexe.id,
    collectiviteId: annexe.collectiviteId,
    commentaire: annexe.commentaire,
    modifiedAt: annexe.modifiedAt,
    modifiedBy: null,
    modifiedByNom: annexe.modifiedByNom,
    preuveType: 'annexe' as const,
  };

  if (
    annexe.fichier?.bucketId &&
    annexe.fichier.hash &&
    annexe.fichier.filename
  ) {
    return {
      ...base,
      fichier: {
        bucketId: annexe.fichier.bucketId,
        hash: annexe.fichier.hash,
        filename: annexe.fichier.filename,
        filesize: annexe.fichier.filesize ?? 0,
        confidentiel: annexe.fichier.confidentiel ?? false,
      },
      lien: null,
    };
  }

  if (annexe.lien) {
    return {
      ...base,
      fichier: null,
      lien: annexe.lien,
    };
  }

  return {
    ...base,
    fichier: null,
    lien: null,
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
