export interface PreuveParams {
  collectivite_id: number;
  action_id: string;
}

export interface Preuve {
  collectivite_id: number;
  bucket_id: string;
  action_id: string;
  filename: string;
  path: string;
  commentaire: string;
}
