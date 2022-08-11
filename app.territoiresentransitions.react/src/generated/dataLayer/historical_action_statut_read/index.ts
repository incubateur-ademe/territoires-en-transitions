import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export interface IHistoricalActionStatutRead {
  tache_id: string; // cae_1.2.3.1
  action_id: string; // cae_1.2.3
  tache_identifiant: string; // 1.2.3.1
  tache_nom: string;
  action_identifiant: string; // 1.2.3
  action_nom: string;
  collectivite_id: number;
  avancement: ActionAvancement;
  previous_avancement: ActionAvancement | null;
  avancement_detaille: null | number[];
  previous_avancement_detaille: null | number[];
  concerne: boolean;
  previous_concerne: null | boolean;
  modified_by_nom: string; // Richard Evans
  modified_at: string; // '2022-08-08T15:12:22.940172+00:00'
  modified_by_id: string;
}
