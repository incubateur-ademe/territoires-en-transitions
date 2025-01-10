import { Referentiel } from '@/app/referentiels/litterals';
import { TMembreFonction, TNiveauAcces } from '@/app/types/alias';

export interface Membre {
  email: string;
  user_id: string | null;
  nom?: string;
  prenom?: string;
  telephone?: string;
  fonction?: TMembreFonction;
  champ_intervention?: Referentiel[];
  details_fonction?: string;
  niveau_acces: TNiveauAcces;
  invitation_id: string | null;
}

export type TUpdateMembreArgs = {
  membre_id: string;
} & (
  | { name: 'fonction'; value: TMembreFonction }
  | { name: 'details_fonction'; value: string }
  | { name: 'champ_intervention'; value: Referentiel[] }
  | { name: 'niveau_acces'; value: TNiveauAcces }
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => Promise<boolean>;

export type TRemoveFromCollectivite = (userEmail: string) => void;
