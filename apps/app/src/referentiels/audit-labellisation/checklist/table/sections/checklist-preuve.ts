import { DocumentSupportRenseigne } from '@tet/domain/collectivites';
import { ObjetPreuve } from '@tet/domain/referentiels';

export type ChecklistPreuve = {
  id: number;
  collectiviteId: number;
  preuveType: 'labellisation';
  objet: ObjetPreuve | null;
} & DocumentSupportRenseigne;
