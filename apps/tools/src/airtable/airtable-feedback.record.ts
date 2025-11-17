import { AirtableCollaboratorRecord } from './airtable-collaborator.record';

/**
 *
 */
export interface AirtableFeedbackRecord {
  Date: string;
  "Origine de l'échange": string;
  Source: string[];
  Personnes?: string[];
  'Personnes hors PF'?: string[];
  Collectivités?: string[];
  'Collectivités - remontée automatique'?: string[];
  'Collectivités - remontée manuelle'?: string[];
  Équipe?: AirtableCollaboratorRecord;
  CR: string;
  'Tags généraux'?: string[];
  'Tags EDL'?: string[];
  'Tags PA'?: string[];
  'Tag indicateurs'?: string[];
  'Tag Trajectoires'?: string[];
  'Tag PAI'?: string[];
  'Total - Pilliers produit'?: string[];
  'Contacts (auto) (from Utilisateurs hors PF (from Collectivités))'?: string[];
  Région?: string[];

  SourceUrl?: string;

  /**
   * A lot more fields
   */
}
