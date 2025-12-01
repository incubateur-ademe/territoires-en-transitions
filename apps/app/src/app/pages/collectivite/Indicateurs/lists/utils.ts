import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';

export const indicateursNameToParams: Record<
  keyof Omit<ListDefinitionsInputFilters, 'indicateurIds'>,
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
  fichesNonClassees: 'fnc',
  text: 'text',
  estPerso: 'p',
  hasOpenData: 'od',
  estFavori: 'fav',
  withChildren: 'wc',
  identifiantsReferentiel: 'ir',
};
