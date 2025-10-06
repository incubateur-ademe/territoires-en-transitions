export interface AirtableUserRecord {
  key: string;
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  'domaine email': string;
  'Nb de collectivités rattachées': number;
  'Comment avez-vous découvert cette session ?': string[];
}
