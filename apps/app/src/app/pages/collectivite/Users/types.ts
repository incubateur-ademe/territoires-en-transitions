import { MembreFonction } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { PermissionLevel } from '@/domain/users';

export interface Membre {
  email: string;
  user_id: string | null;
  nom?: string;
  prenom?: string;
  telephone?: string;
  fonction?: MembreFonction;
  champ_intervention?: ReferentielId[];
  details_fonction?: string;
  niveau_acces: PermissionLevel;
  invitation_id: string | null;
}

export type TUpdateMembreArgs = {
  membre_id: string;
} & (
  | { name: 'fonction'; value: MembreFonction }
  | { name: 'details_fonction'; value: string }
  | { name: 'champ_intervention'; value: ReferentielId[] }
  | { name: 'niveau_acces'; value: PermissionLevel }
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => Promise<boolean>;
