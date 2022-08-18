import {THistoriqueItem} from './types';

export const fakeBaseHistorique: THistoriqueItem = {
  collectivite_id: 1,
  type: 'action_statut',
  modified_by_id: '123e4567-e89b-12d3-a456-426614174000',
  modified_by_nom: 'Richard Evans',
  modified_at: '2022-08-08T15:12:22.940172+00:00',
  previous_modified_by_id: null,
  previous_modified_at: null,
  action_id: null,
  action_identifiant: null,
  action_nom: null,
  tache_id: null,
  tache_identifiant: null,
  tache_nom: null,
  avancement: null,
  previous_avancement: null,
  avancement_detaille: null,
  previous_avancement_detaille: null,
  concerne: null,
  previous_concerne: null,
  precision: null,
  previous_precision: null,
};

/* Storybook Action Statut */
export const fakeAjoutSimpleActionStatutHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  concerne: false,
  previous_concerne: false,
  avancement: 'programme',
  previous_avancement: null,
  avancement_detaille: null,
  previous_avancement_detaille: null,
  tache_id: 'cae_1.2.3.1',
  tache_identifiant: '1.2.3.1.3',
  tache_nom: "Disposer d'un programme local de prévention",
  action_id: 'cae_1.2.3',
  action_identifiant: '1.2.3',
  action_nom:
    'Définir et mettre en oeuvre la stratégie de prévention et de gestion des déchets',
};

export const fakeAjoutDetailleActionStatutHistorique: THistoriqueItem = {
  ...fakeAjoutSimpleActionStatutHistorique,
  avancement: 'detaille',
  avancement_detaille: [0.2, 0.3, 0.5],
};

export const fakeModificationSimpleActionStatutHistorique: THistoriqueItem = {
  ...fakeAjoutSimpleActionStatutHistorique,
  previous_avancement: 'programme',
  avancement: 'fait',
};

export const fakeModificationSimpleADetailleActionStatutHistorique: THistoriqueItem =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previous_avancement: 'non_renseigne',
    avancement: 'detaille',
    avancement_detaille: [0.2, 0.3, 0.5],
  };

export const fakeModificationDetailleActionStatutHistorique: THistoriqueItem = {
  ...fakeAjoutSimpleActionStatutHistorique,
  previous_avancement: 'detaille',
  previous_avancement_detaille: [0.1, 0, 0],
  avancement: 'detaille',
  avancement_detaille: [0.2, 0.3, 0.5],
};
