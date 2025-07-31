import { TMembreFonction, TNiveauAcces } from '@/app/types/alias';
import { ReferentielId } from '@/domain/referentiels';

export interface Membre {
  email: string;
  user_id: string | null;
  nom?: string;
  prenom?: string;
  telephone?: string;
  fonction?: TMembreFonction;
  champ_intervention?: ReferentielId[];
  details_fonction?: string;
  niveau_acces: TNiveauAcces;
  invitation_id: string | null;
}

export type TUpdateMembreArgs = {
  membre_id: string;
} & (
  | { name: 'fonction'; value: TMembreFonction }
  | { name: 'details_fonction'; value: string }
  | { name: 'champ_intervention'; value: ReferentielId[] }
  | { name: 'niveau_acces'; value: TNiveauAcces }
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => Promise<boolean>;
