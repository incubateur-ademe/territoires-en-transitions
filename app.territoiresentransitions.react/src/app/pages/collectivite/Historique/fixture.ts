import {TActionStatutHistoriqueProps} from './ActionStatutHistorique';

export const fakeAjoutSimpleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    collectivite_id: 1,
    modified_by_id: '123e4567-e89b-12d3-a456-426614174000',
    modified_by_nom: 'Richard Evans',
    modified_at: '2022-08-08T15:12:22.940172+00:00',
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
    concerne: false,
    previous_concerne: false,
  };

export const fakeAjoutDetailleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    avancement: 'detaille',
    avancement_detaille: [0.2, 0.3, 0.5],
  };

export const fakeModificationSimpleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previous_avancement: 'programme',
    avancement: 'fait',
  };

export const fakeModificationSimpleADetailleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previous_avancement: 'non_renseigne',
    avancement: 'detaille',
    avancement_detaille: [0.2, 0.3, 0.5],
  };

export const fakeModificationDetailleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previous_avancement: 'detaille',
    previous_avancement_detaille: [1, 0, 0],
    previous_avancement_detaille: [0.1, 0, 0],
    avancement: 'detaille',
    avancement_detaille: [0.2, 0.3, 0.5],
  };
