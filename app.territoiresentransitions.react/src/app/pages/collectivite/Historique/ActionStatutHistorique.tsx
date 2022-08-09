import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export type TActionStatutHistoriqueProps = {
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
  modified_by_id: string; // 123e4567-e89b-12d3-a456-426614174000
  modified_at: string; // '2022-08-08T15:12:22.940172+00:00'
  modified_by_nom: string; // Richard Evans
};

export const ActionStatutHistorique = (props: TActionStatutHistoriqueProps) => (
  <div>
    <div>props : {JSON.stringify(props)}</div>
  </div>
);
