import { EditerDocumentProps } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { DownloadableFichier } from './use-download-preuve';

export type ChecklistPreuve = Omit<EditerDocumentProps['preuve'], 'fichier'> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: (DownloadableFichier & { confidentiel: boolean | null }) | null;
};

// Le contrat listPreuvesLabellisation rend encore du snake_case : on traduit
// ici, a la frontiere de la checklist.
export const toChecklistPreuve = (preuve: {
  id: number;
  collectivite_id: number;
  preuve_type: ChecklistPreuve['preuveType'];
  objet: ObjetPreuve | null;
  fichier: {
    bucket_id: string;
    hash: string;
    filename: string;
    confidentiel: boolean | null;
  } | null;
}): ChecklistPreuve => ({
  id: preuve.id,
  collectiviteId: preuve.collectivite_id,
  preuveType: preuve.preuve_type,
  objet: preuve.objet,
  fichier: preuve.fichier && {
    bucketId: preuve.fichier.bucket_id,
    hash: preuve.fichier.hash,
    filename: preuve.fichier.filename,
    confidentiel: preuve.fichier.confidentiel,
  },
});
