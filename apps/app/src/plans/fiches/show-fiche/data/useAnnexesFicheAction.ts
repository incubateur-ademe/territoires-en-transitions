import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { AnnexeDocument } from '@tet/domain/plans';

/** adapte une ligne API au format attendu par CarteDocument / openPreuve */
export function mapListAnnexeRowToDocumentPreuve(row: AnnexeDocument): TPreuve {
  const base = {
    id: row.id,
    collectivite_id: row.collectiviteId,
    commentaire: row.commentaire,
    created_at: row.modifiedAt,
    created_by: null,
    created_by_nom: row.modifiedByNom,
    preuve_type: 'annexe' as const,
    action: null,
    preuve_reglementaire: null,
    demande: null,
    audit: null,
    rapport: null,
  };

  if (row.fichier?.bucketId && row.fichier.hash && row.fichier.filename) {
    return {
      ...base,
      fichier: {
        bucket_id: row.fichier.bucketId,
        hash: row.fichier.hash,
        filename: row.fichier.filename,
        filesize: row.fichier.filesize ?? 0,
        confidentiel: row.fichier.confidentiel ?? false,
      },
      lien: null,
    };
  }

  if (row.lien) {
    return {
      ...base,
      fichier: null,
      lien: row.lien,
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
        select: (rows) => rows.map(mapListAnnexeRowToDocumentPreuve),
      }
    )
  );
};
