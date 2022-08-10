import {TActionStatutHistoriqueProps} from './ActionStatutHistorique';

export const fakeActionStatutHistoriqueSimple: TActionStatutHistoriqueProps = {
  tache_id: 'cae_1.2.3.1',
  action_id: 'cae_1.2.3',
  tache_identifiant: '1.2.3.1.3',
  tache_nom: "Disposer d'un programme local de prévention",
  action_identifiant: '1.2.3',
  action_nom:
    'Définir et mettre en oeuvre la stratégie de prévention et de gestion des déchets',
  collectivite_id: 1,
  avancement: 'fait',
  previous_avancement: 'programme',
  avancement_detaille: null,
  previous_avancement_detaille: null,
  concerne: false,
  previous_concerne: false,
  modified_by: 'Richard Evans',
  modified_at: '2022-08-08T15:12:22.940172+00:00',
  nom: 'what?',
};

// export const fakeActionStatutHistoriqueSimpleModification: TActionStatutHistoriqueProps = {
//     ...fakeActionStatutHistoriqueSimple,

// }
