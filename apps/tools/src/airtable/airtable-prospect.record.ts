export interface AirtableProspectRecord {
  key: string;
  Prénom: string;
  Nom: string;
  Email: string;
  Téléphone?: string;
  Fonctions?: string;
  'Fonction (intitulé)'?: string;
  'Collectivités ds PF'?: string[];
  'Collectivités hors PF'?: string;
  'Découverte PF'?: string;
  'Raisons inscriptions'?: string[];
}
