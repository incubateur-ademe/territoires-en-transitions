import {MembreFonction} from 'generated/dataLayer/membres';
import {Referentiel} from 'types/litterals';

export type TNiveauAcces = 'admin' | 'edition' | 'lecture';

export interface Membre {
  email: string;
  user_id: string | null;
  nom?: string;
  prenom?: string;
  telephone?: string;
  fonction?: MembreFonction;
  champ_intervention?: Referentiel[];
  details_fonction?: string;
  niveau_acces: TNiveauAcces;
}

export type TUpdateMembreArgs = {
  membre_id: string;
} & (
  | {name: 'fonction'; value: MembreFonction}
  | {name: 'details_fonction'; value: string}
  | {name: 'champ_intervention'; value: Referentiel[]}
  | {name: 'niveau_acces'; value: TNiveauAcces}
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => Promise<boolean>;

export type TRemoveFromCollectivite = (userEmail: string) => void;
