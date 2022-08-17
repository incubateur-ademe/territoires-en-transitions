import {TActionStatutHistoriqueProps} from 'app/pages/collectivite/Historique/actionStatut/ActionStatutHistorique';

export type FakeHistoriqueType =
  | 'action_statut'
  | 'action_texte'
  | 'caracteristique_collectivite'
  | 'preuve'
  | 'membre'
  | 'indicateur'
  | 'plan_action_arborescence'
  | 'plan_action_fiche';

export type FakeHistoriqueDescription = {
  titre: string;
  description: string;
};

export type FakeBaseHistorique = {
  collectivite_id: number;
  type: FakeHistoriqueType;
  modified_by_id: string;
  modified_by_nom: string;
  modified_at: string;
  concerne: boolean;
  previous_concerne: boolean;
};

export const fakeBaseHistorique: FakeBaseHistorique = {
  collectivite_id: 1,
  type: 'action_statut',
  modified_by_id: '123e4567-e89b-12d3-a456-426614174000',
  modified_by_nom: 'Richard Evans',
  modified_at: '2022-08-08T15:12:22.940172+00:00',
  concerne: false,
  previous_concerne: false,
};

export const fakeAjoutSimpleActionStatutHistorique: TActionStatutHistoriqueProps =
  {
    ...fakeBaseHistorique,
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
    previous_avancement_detaille: [0.1, 0, 0],
    avancement: 'detaille',
    avancement_detaille: [0.2, 0.3, 0.5],
  };
