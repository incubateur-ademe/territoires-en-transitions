export interface LabellisationRead {
  id: number;
  referentiel: string;
  collectivite_id: number;
  obtenue_le: Date;
  etoiles: number;
  score_realise: number;
  score_programme: number;
}
