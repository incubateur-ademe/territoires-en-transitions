import { ActionIdentity } from '@/app/referentiels/actions/use-list-actions';
import { AuditEnCours } from '@/app/referentiels/audits/types';
import {
  DocumentCollectivite,
  PreuveReglementaireDefinition,
} from '@tet/domain/collectivites';
import { LabellisationDemande } from '@tet/domain/referentiels';
import { EditState } from './use-edit-state';

type DocumentReglementaireFields = {
  preuveType: 'reglementaire';
  action: Pick<ActionIdentity, 'actionId' | 'identifiant'>;
  preuveReglementaire: PreuveReglementaireDefinition;
};

type DocumentComplementaireFields = {
  preuveType: 'complementaire';
  action: Pick<ActionIdentity, 'actionId' | 'identifiant'>;
};

type DocumentAnnexeFields = {
  preuveType: 'annexe';
};

type DocumentLabellisationFields = {
  preuveType: 'labellisation';
  demande: LabellisationDemande;
};

type DocumentAuditFields = {
  preuveType: 'audit';
  demande: LabellisationDemande | null;
  audit: AuditEnCours;
};

type DocumentRapportFields = {
  preuveType: 'rapport';
  rapport: {
    date: string;
  };
};

export type DocumentReglementaire = DocumentCollectivite &
  DocumentReglementaireFields;
export type DocumentComplementaire = DocumentCollectivite &
  DocumentComplementaireFields;
export type DocumentAnnexe = DocumentCollectivite & DocumentAnnexeFields;
export type DocumentLabellisation = DocumentCollectivite &
  DocumentLabellisationFields;
export type DocumentAudit = DocumentCollectivite & DocumentAuditFields;
export type DocumentRapport = DocumentCollectivite & DocumentRapportFields;
export type DocumentAuditOuLabellisation =
  | DocumentLabellisation
  | DocumentAudit;

export type DocumentRattache =
  | DocumentReglementaire
  | DocumentComplementaire
  | DocumentAnnexe
  | DocumentLabellisation
  | DocumentAudit
  | DocumentRapport;

export type DocumentAttendu = {
  action: Pick<ActionIdentity, 'actionId' | 'identifiant'>;
  preuveReglementaire: PreuveReglementaireDefinition;
  documents: DocumentReglementaire[];
};

export type EditHandlers = {
  remove: () => void;
  editComment: EditState;
  editFilename: EditState;
  isLoading: boolean;
  isError: boolean;
};
