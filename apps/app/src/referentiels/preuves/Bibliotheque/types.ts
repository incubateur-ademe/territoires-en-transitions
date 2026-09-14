import { AuditEnCours } from '@/app/referentiels/audits/types';
import { LabellisationDemande } from '@tet/domain/referentiels';
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
  'id' | 'bucketId' | 'filename' | 'filesize' | 'hash' | 'confidentiel'
>;

export type PreuveLien = {
  url: string;
  titre: string;
};

export type PreuveSupport =
  | { type: 'fichier'; fichier: Fichier }
  | { type: 'lien'; lien: PreuveLien }
  | { type: 'fichierManquant'; filename: string }
  | { type: 'nonRenseigne' };

// champs communs à tous les types de preuves
type PreuveBase = {
  support: PreuveSupport;
  id: number;
  collectiviteId: number;
  commentaire: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedByNom: string | null;
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
};

// champs propres aux rapports d'audit
type PreuveAuditFields = {
  preuveType: 'audit';
  demande: LabellisationDemande | null;
  audit: AuditEnCours;
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
