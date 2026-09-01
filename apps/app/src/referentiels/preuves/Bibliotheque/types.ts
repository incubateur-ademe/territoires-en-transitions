import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { LabellisationDemande, ObjetPreuve } from '@tet/domain/referentiels';
import { EditState } from './useEditState';

// un fichier de la bibliothèque
export type BibliothequeFichier = {
  id: number;
  collectiviteId: number;
  hash: string;
  filename: string;
  bucketId: string;
  filesize?: number;
  confidentiel: boolean | null;
};

export type Fichier = Pick<
  BibliothequeFichier,
  'bucketId' | 'filename' | 'filesize' | 'hash' | 'confidentiel'
>;

// champs propres aux fichiers
export type PreuveFichierFields = {
  lien: null;
  fichier: Fichier;
};

// champs propres aux liens
export type PreuveLienFields = {
  fichier: null;
  lien: {
    url: string;
    titre: string;
  };
};

// ni fichier ni lien (cas des preuves réglementaires non renseignées)
type PreuveNonRenseignee = { fichier: null; lien: null };

// champs communs à tous les types de preuves
type PreuveBase = (
  | PreuveFichierFields
  | PreuveLienFields
  | PreuveNonRenseignee
) & {
  id: number;
  collectiviteId: number;
  commentaire: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedByNom: string | null;
  //  modified_at: string | null;
  //  modified_by_nom: string | null;
};

export type PreuveReglementaireDefinition = {
  id: string;
  nom: string;
  description: string;
};

// champs propres aux preuves réglèmentaires
type PreuveReglementaireFields = {
  preuveType: 'reglementaire';
  action: PreuveAction;
  preuveReglementaire: PreuveReglementaireDefinition;
};

// champs propres aux preuves complèmentaires
type PreuveComplementaireFields = {
  preuveType: 'complementaire';
  action: PreuveAction;
};

// champs propres aux annexes de fiche
type PreuveAnnexeFields = {
  preuveType: 'annexe';
};

// action liée à une preuve réglementaire ou complémentaire
export type PreuveAction = {
  actionId: string;
  identifiant: string;
};

// champs propres aux preuves pour la labellisation
type PreuveLabellisationFields = {
  preuveType: 'labellisation';
  demande: LabellisationDemande;
  objet: ObjetPreuve | null;
};

// champs propres aux rapports d'audit
type PreuveAuditFields = {
  preuveType: 'audit';
  demande: LabellisationDemande | null;
  audit: TAuditEnCours | null;
};

// champs propres aux rapports de visite annuelle
type PreuveRapportFields = {
  preuveType: 'rapport';
  rapport: {
    date: string;
  };
};

// types de preuves
export type DocumentReglementaire = PreuveBase & PreuveReglementaireFields;
export type PreuveComplementaire = PreuveBase & PreuveComplementaireFields;
export type PreuveAnnexe = PreuveBase & PreuveAnnexeFields;
export type PreuveLabellisation = PreuveBase & PreuveLabellisationFields;
export type PreuveAudit = PreuveBase & PreuveAuditFields;
export type PreuveRapport = PreuveBase & PreuveRapportFields;
export type PreuveAuditEtLabellisation = PreuveLabellisation | PreuveAudit;

// une preuve
export type Preuve =
  | DocumentReglementaire
  | PreuveComplementaire
  | PreuveAnnexe
  | PreuveLabellisation
  | PreuveAudit
  | PreuveRapport;

export type DocumentAttendu = {
  action: PreuveAction;
  preuveReglementaire: PreuveReglementaireDefinition;
  documents: DocumentReglementaire[];
};

// identifiants des types de preuves
export type PreuveType = Preuve['preuveType'];

// indexation par type
export type PreuvesParType = {
  reglementaire: DocumentReglementaire[] | undefined;
  complementaire: PreuveComplementaire[] | undefined;
  annexe: PreuveAnnexe[] | undefined;
  labellisation: PreuveLabellisation[] | undefined;
  audit: PreuveAudit[] | undefined;
  rapport: PreuveRapport[] | undefined;
};

// gestionnaires pour l'édition d'une preuve
export type EditHandlers = {
  remove: () => void;
  editComment: EditState;
  editFilename: EditState;
  isLoading: boolean;
  isError: boolean;
};
