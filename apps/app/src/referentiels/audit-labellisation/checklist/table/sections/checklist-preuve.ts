import { EditFichierModalProps } from '@/app/referentiels/preuves/Bibliotheque/edit-fichier.modal';
import { Fichier } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ObjetPreuve } from '@tet/domain/referentiels';

export type ChecklistPreuve = Omit<EditFichierModalProps['preuve'], 'fichier'> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: Pick<Fichier, 'id' | 'hash' | 'filename' | 'confidentiel'> | null;
};
