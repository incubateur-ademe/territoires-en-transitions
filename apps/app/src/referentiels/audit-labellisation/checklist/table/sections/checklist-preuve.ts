import { EditerDocumentProps } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { Fichier } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ObjetPreuve } from '@tet/domain/referentiels';

export type ChecklistPreuve = Omit<EditerDocumentProps['preuve'], 'fichier'> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: Pick<Fichier, 'id' | 'hash' | 'filename' | 'confidentiel'> | null;
};
