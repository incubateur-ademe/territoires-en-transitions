export interface ScoreRead {
  // id: number;
  // collectivite_id: number;
  action_id: string;
  points: number;
  potentiel: number;
  referentiel_points: number;
  concernee: boolean;
  previsionnel: number;
  total_taches_count: number;
  completed_taches_count: number;
  created_at: string;
}

// export type ClientScoreRead = Omit<
//   ScoreRead,
//   'id' | 'collectivite_id' | 'created_at'
// >;
export interface ClientScoresRead {
  id: number;
  collectivite_id: number;
  referentiel: string;
  scores: ScoreRead[];
  score_created_at: string;
}
