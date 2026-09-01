import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { LabellisationDemande, ObjetPreuve } from '@tet/domain/referentiels';
import { ObjectToSnake } from 'ts-case-convert';
import { EditState } from './useEditState';

// un fichier de la bibliothèque
export type BibliothequeFichier = {
  id: number;
  collectivite_id: number;
  hash: string;
  filename: string;
  bucket_id: string;
  filesize?: number;
  confidentiel: boolean | null;
};

export type Fichier = Pick<
  BibliothequeFichier,
  'bucket_id' | 'filename' | 'filesize' | 'hash' | 'confidentiel'
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
  collectivite_id: number;
  commentaire: string | null;
  created_at: string | null;
  created_by: string | null;
  created_by_nom: string | null;
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
  preuve_type: 'reglementaire';
  action: PreuveAction;
  preuve_reglementaire: PreuveReglementaireDefinition;
  demande: null;
  audit: null;
  rapport: null;
};

// champs propres aux preuves complèmentaires
type PreuveComplementaireFields = {
  preuve_type: 'complementaire';
  action: PreuveAction;
  preuve_reglementaire: null;
  demande: null;
  audit: null;
  rapport: null;
};

// champs propres aux annexes de fiche
type PreuveAnnexeFields = {
  preuve_type: 'annexe';
  action: null;
  preuve_reglementaire: null;
  demande: null;
  audit: null;
  rapport: null;
};

// action liée à une preuve réglementaire ou complémentaire
export type PreuveAction = {
  action_id: string;
  identifiant: string;
};

// champs propres aux preuves pour la labellisation
type PreuveLabellisationFields = {
  preuve_type: 'labellisation';
  action: null;
  preuve_reglementaire: null;
  demande: ObjectToSnake<LabellisationDemande>;
  audit: null;
  rapport: null;
  objet: ObjetPreuve | null;
};

// champs propres aux rapports d'audit
type PreuveAuditFields = {
  preuve_type: 'audit';
  action: null;
  preuve_reglementaire: null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  audit: TAuditEnCours | null;
  rapport: null;
};

// champs propres aux rapports de visite annuelle
type PreuveRapportFields = {
  preuve_type: 'rapport';
  action: null;
  preuve_reglementaire: null;
  demande: null;
  audit: null;
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
  preuve_reglementaire: PreuveReglementaireDefinition;
  documents: DocumentReglementaire[];
};

// identifiants des types de preuves
export type PreuveType = Preuve['preuve_type'];

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
