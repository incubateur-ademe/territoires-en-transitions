import {FetchFiltre} from '@tet/api/dist/src/indicateurs';

export const indicateursNameToParams: Record<keyof FetchFiltre, string> = {
  thematiqueIds: 't',
  actionId: 'a',
  planActionIds: 'pa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  servicePiloteIds: 's',
  categorieNoms: 'cat',
  participationScore: 'ps',
  estComplet: 'r',
  estConfidentiel: 'c',
  fichesNonClassees: 'fnc',
  text: 'text',
  estPerso: 'p',
  hasOpenData: 'od',
  estFavorisCollectivite: 'favCol',
};
