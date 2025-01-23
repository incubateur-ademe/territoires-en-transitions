import { FetchFiltre } from '@/api/indicateurs';

export const indicateursNameToParams: Record<
  keyof Omit<FetchFiltre, 'indicateurIds'>,
  string
> = {
  thematiqueIds: 't',
  actionId: 'a',
  planActionIds: 'pa',
  ficheActionIds: 'fa',
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
  withChildren: 'wc',
};
