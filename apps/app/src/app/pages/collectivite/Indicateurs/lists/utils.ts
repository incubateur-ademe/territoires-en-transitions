import { ListIndicateursInputFilters } from '@tet/domain/indicateurs';

export const indicateursNameToParams: Record<
  keyof Omit<ListIndicateursInputFilters, 'indicateurIds' | 'axeIds'>,
  string
> = {
  thematiqueIds: 't',
  mesureId: 'a',
  planIds: 'pa',
  ficheIds: 'fa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  serviceIds: 's',
  categorieNoms: 'cat',
  participationScore: 'ps',
  estRempli: 'r',
  estConfidentiel: 'c',
  isApplicable: 'ap',
  text: 'text',
  estPerso: 'p',
  hasOpenData: 'od',
  estFavori: 'fav',
  withChildren: 'wc',
  identifiantsReferentiel: 'ir',
};
