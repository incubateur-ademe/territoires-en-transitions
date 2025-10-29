import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { LabellisationDemande } from '@/domain/referentiels';
import { ObjectToSnake } from 'ts-case-convert';
import { TEditState } from './useEditState';

// un fichier de la bibliothèque
export type TBibliothequeFichier = {
  id: number;
  collectivite_id: number;
  hash: string;
  filename: string;
  bucket_id: string;
  filesize: number;
  confidentiel: boolean;
};

export type TFichier = Pick<
  TBibliothequeFichier,
  'bucket_id' | 'filename' | 'filesize' | 'hash' | 'confidentiel'
>;

// champs propres aux fichiers
export type TPreuveFichierFields = {
  lien: null;
  fichier: TFichier;
};

// champs propres aux liens
export type TPreuveLienFields = {
  fichier: null;
  lien: {
    url: string;
    titre: string;
  };
};

// ni fichier ni lien (cas des preuves réglementaires non renseignées)
type TPreuveNonRenseignee = { fichier: null; lien: null };

// champs communs à tous les types de preuves
type TPreuveBase = (
  | TPreuveFichierFields
  | TPreuveLienFields
  | TPreuveNonRenseignee
) & {
  id: number | null;
  collectivite_id: number;
  commentaire: string | null;
  created_at: string | null;
  created_by: string | null;
  created_by_nom: string | null;
  //  modified_at: string | null;
  //  modified_by_nom: string | null;
};

// champs propres aux preuves réglèmentaires
type TPreuveReglementaireFields = {
  preuve_type: 'reglementaire';
  action: TPreuveAction;
  preuve_reglementaire: {
    id: string;
    nom: string;
    description: string;
  };
  demande: null;
  audit: null;
  rapport: null;
};

// champs propres aux preuves complèmentaires
type TPreuveComplementaireFields = {
  preuve_type: 'complementaire';
  action: TPreuveAction;
  preuve_reglementaire: null;
  demande: null;
  audit: null;
  rapport: null;
};

// action liée à une preuve réglementaire ou complémentaire
export type TPreuveAction = {
  action_id: string;
  nom: string;
  description: string;
  identifiant: string;
  referentiel: string;
  concerne: boolean;
  desactive: boolean;
};

// champs propres aux preuves pour la labellisation
type TPreuveLabellisationFields = {
  preuve_type: 'labellisation';
  action: null;
  preuve_reglementaire: null;
  demande: ObjectToSnake<LabellisationDemande>;
  audit: null;
  rapport: null;
};

// champs propres aux rapports d'audit
type TPreuveAuditFields = {
  preuve_type: 'audit';
  action: null;
  preuve_reglementaire: null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  audit: TAuditEnCours;
  rapport: null;
};

// champs propres aux rapports de visite annuelle
type TPreuveRapportFields = {
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
export type TPreuveReglementaire = TPreuveBase & TPreuveReglementaireFields;
export type TPreuveComplementaire = TPreuveBase & TPreuveComplementaireFields;
export type TPreuveLabellisation = TPreuveBase & TPreuveLabellisationFields;
export type TPreuveAudit = TPreuveBase & TPreuveAuditFields;
export type TPreuveRapport = TPreuveBase & TPreuveRapportFields;
export type TPreuveAuditEtLabellisation = TPreuveLabellisation | TPreuveAudit;

// une preuve
export type TPreuve =
  | TPreuveReglementaire
  | TPreuveComplementaire
  | TPreuveLabellisation
  | TPreuveAudit
  | TPreuveRapport;

// identifiants des types de preuves
export type TPreuveType = TPreuve['preuve_type'];

// indexation par type
export type TPreuvesParType = {
  reglementaire: TPreuveReglementaire[] | undefined;
  complementaire: TPreuveComplementaire[] | undefined;
  labellisation: TPreuveLabellisation[] | undefined;
  audit: TPreuveAudit[] | undefined;
  rapport: TPreuveRapport[] | undefined;
};

// gestionnaires pour l'édition d'une preuve
export type TEditHandlers = {
  remove: () => void;
  editComment: TEditState;
  editFilename: TEditState;
  isLoading: boolean;
  isError: boolean;
};
