import { MembreFonction } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';

export interface Membre {
  email: string;
  user_id: string | null;
  nom?: string;
  prenom?: string;
  telephone?: string;
  fonction?: MembreFonction;
  champ_intervention?: ReferentielId[];
  details_fonction?: string;
  niveau_acces: CollectiviteRole;
  invitation_id: string | null;
}

export type TUpdateMembreArgs = {
  membre_id: string;
} & (
  | { name: 'fonction'; value: MembreFonction }
  | { name: 'details_fonction'; value: string }
  | { name: 'champ_intervention'; value: ReferentielId[] }
  | { name: 'niveau_acces'; value: CollectiviteRole }
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => Promise<boolean>;
