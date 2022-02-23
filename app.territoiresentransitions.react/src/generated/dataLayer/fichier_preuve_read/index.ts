export interface FichierPreuveParams {
  collectivite_id: number;
  action_id: string;
}

export interface FichierPreuve {
  collectivite_id: number;
  bucket_id: string;
  action_id: string;
  filename: string;
  path: string;
  commentaire: string;
}
