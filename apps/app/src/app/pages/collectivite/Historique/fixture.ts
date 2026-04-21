import { ActionTypeEnum } from '@tet/domain/referentiels';
import {
  HistoriqueActionPrecisionItem,
  HistoriqueActionStatutItem,
} from './types';

const baseStatutFields: Omit<
  HistoriqueActionStatutItem,
  | 'avancement'
  | 'previousAvancement'
  | 'avancementDetaille'
  | 'previousAvancementDetaille'
  | 'concerne'
  | 'previousConcerne'
> = {
  type: 'action_statut',
  collectiviteId: 1,
  modifiedById: '123e4567-e89b-12d3-a456-426614174000',
  modifiedByNom: 'Richard Evans',
  modifiedAt: '2022-08-08T15:12:22.940172+00:00',
  previousModifiedById: null,
  previousModifiedAt: null,
  actionIds: null,
  actionId: 'cae_1.2.3.1',
  actionType: ActionTypeEnum.SOUS_ACTION,
  actionIdentifiant: '1.2.3',
  actionNom:
    'Définir et mettre en oeuvre la stratégie de prévention et de gestion des déchets',
  tacheIdentifiant: '1.2.3.1.3',
  tacheNom: "Disposer d'un programme local de prévention",
};

/* Storybook Action Statut */
export const fakeAjoutSimpleActionStatutHistorique: HistoriqueActionStatutItem =
  {
    ...baseStatutFields,
    concerne: false,
    previousConcerne: false,
    avancement: 'programme',
    previousAvancement: null,
    avancementDetaille: null,
    previousAvancementDetaille: null,
  };

export const fakeAjoutDetailleActionStatutHistorique: HistoriqueActionStatutItem =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    avancement: 'detaille',
    avancementDetaille: [0.2, 0.3, 0.5],
  };

export const fakeModificationSimpleActionStatutHistorique: HistoriqueActionStatutItem =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previousAvancement: 'programme',
    avancement: 'fait',
  };

export const fakeModificationSimpleADetailleActionStatutHistorique: HistoriqueActionStatutItem =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previousAvancement: 'non_renseigne',
    avancement: 'detaille',
    avancementDetaille: [0.2, 0.3, 0.5],
  };

export const fakeModificationDetailleActionStatutHistorique: HistoriqueActionStatutItem =
  {
    ...fakeAjoutSimpleActionStatutHistorique,
    previousAvancement: 'detaille',
    previousAvancementDetaille: [0.1, 0, 0],
    avancement: 'detaille',
    avancementDetaille: [0.2, 0.3, 0.5],
  };

/* Storybook Action Precision */
const baseActionPrecisionFields: Omit<
  HistoriqueActionPrecisionItem,
  'precision' | 'previousPrecision'
> = {
  type: 'action_precision',
  collectiviteId: 1,
  modifiedById: '123e4567-e89b-12d3-a456-426614174000',
  modifiedByNom: 'Richard Evans',
  modifiedAt: '2022-08-08T15:12:22.940172+00:00',
  previousModifiedById: null,
  previousModifiedAt: null,
  actionIds: null,
  actionId: 'cae_1.2.3.1',
  actionType: ActionTypeEnum.SOUS_ACTION,
  actionIdentifiant: '1.2.3',
  actionNom:
    'Définir et mettre en oeuvre la stratégie de prévention et de gestion des déchets',
  tacheIdentifiant: '1.2.3.1.3',
  tacheNom: "Disposer d'un programme local de prévention",
};

export const fakeAjoutActionPrecisionHistorique: HistoriqueActionPrecisionItem =
  {
    ...baseActionPrecisionFields,
    precision:
      'A mat sioul skrivañ egisto kentel naon sae leziregezh, ahont abaoe fresk goap leur Baden c’helien peurvuiañ nav, ret veaj',
    previousPrecision: null,
  };

export const fakeModificationActionPrecisionHistorique: HistoriqueActionPrecisionItem =
  {
    ...baseActionPrecisionFields,
    precision:
      'A mat sioul skrivañ egisto kentel naon sae leziregezh, ahont abaoe fresk goap leur Baden c’helien peurvuiañ nav, ret veaj gouez lein kriz yaou roched. Livet dimezell nerzh sul trizek Kemper e c’hiz piz, fri mae pleg perc’henn oan va romant brodañ c’henwerzh, siwazh dindan  bras gwerenn grib kelc’hiek mui. Frouezh chaseour Melwenn esaeañ c’hastell.',
    previousPrecision:
      'A mat sioul skrivañ egisto kentel naon sae leziregezh, ahont abaoe fresk goap leur Baden c’helien peurvuiañ nav, ret veaj',
  };
