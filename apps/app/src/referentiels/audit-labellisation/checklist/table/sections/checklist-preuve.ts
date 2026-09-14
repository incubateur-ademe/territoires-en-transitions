import { EditFichierModalProps } from '@/app/referentiels/preuves/Bibliotheque/edit-fichier.modal';
import { StoredFile } from '@tet/domain/collectivites';
import { ObjetPreuve } from '@tet/domain/referentiels';

export type ChecklistPreuve = Omit<
  EditFichierModalProps['preuve'],
  'fichier'
> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: Pick<StoredFile, 'id' | 'hash' | 'filename' | 'confidentiel'> | null;
};
