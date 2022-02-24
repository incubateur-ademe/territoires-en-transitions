export interface PreuveFichierParams {
  collectivite_id: number;
  action_id: string;
}

export interface PreuveFichierRead {
  type: 'fichier';
  id: null;
  action_id: string;
  collectivite_id: number;
  commentaire: string;
  filename: string;
  bucket_id: string;
  path: string;
  url: null;
  titre: null;
}
