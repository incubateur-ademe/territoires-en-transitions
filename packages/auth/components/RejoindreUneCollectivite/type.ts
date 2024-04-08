import {Database, Enums, NonNullableFields} from '@tet/api';

export type RejoindreUneCollectiviteData = {
  collectiviteId?: number | null;
  collectivite_engagee?: boolean;
  role?: Enums<'membre_fonction'> | null;
  champ_intervention?: Array<Enums<'referentiel'>>;
  poste?: string;
};

export type RejoindreUneCollectiviteProps = {
  /** Erreur à afficher */
  error: string | null;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Liste de collectivités auxquelles le compte peut être rattaché */
  collectivites: Array<CollectiviteNom> | null;
  /** Info sur la collectivité courante */
  collectiviteSelectionnee: CollectiviteInfo | null;
  /** Appelé pour filtrer la liste des collectivités */
  onFilterCollectivites: (search: string) => void;
  /** Appelé à l'envoi du formulaire */
  onSubmit: (data: RejoindreUneCollectiviteData) => void;
  /** Appelé lors du changement de sélection d'une collectivité dans la liste déroulante */
  onSelectCollectivite: (id: number | null) => void;
  /** Appelé à l'annulation du formulaire */
  onCancel: () => void;
};

export type CollectiviteNom = NonNullableFields<
  Database['public']['Views']['named_collectivite']['Row']
>;

type GetReferentContacts = Database['public']['Functions']['referent_contacts'];

type ReferentContact = GetReferentContacts['Returns'][0];

export type CollectiviteInfo = {
  id: number;
  nom: string;
  url: string;
  contacts?: ReferentContact[];
};
