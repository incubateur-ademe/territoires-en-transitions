import { EditerDocumentProps } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { DownloadableFichier } from './use-download-preuve';

export type ChecklistPreuve = Omit<EditerDocumentProps['preuve'], 'fichier'> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: (DownloadableFichier & { confidentiel: boolean | null }) | null;
};
