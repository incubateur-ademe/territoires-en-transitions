export interface PreuveLienParams {
  collectivite_id: number;
  action_id: string;
}

export interface PreuveLienRead {
  type: 'lien';
  id: number;
  action_id: string;
  collectivite_id: number;
  commentaire: string;
  filename: null;
  bucket_id: string;
  path: string;
  url: string;
  titre: string;
}
