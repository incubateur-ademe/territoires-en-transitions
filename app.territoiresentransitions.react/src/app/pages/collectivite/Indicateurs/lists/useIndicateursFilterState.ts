import {ITEM_ALL} from 'ui/shared/filters/commons';
import {useSearchParams} from 'core-logic/hooks/query';
import {Filters} from './useFilteredIndicateurDefinitions';
import {Enums} from 'types/alias';
import {ITEM_FICHES_NON_CLASSEES} from './FiltrePlans';

// valeurs par défaut des filtres
type TFilters = {
  thematiques?: string[];
  pilotes?: string[];
  services?: string[];
  plans?: string[];
  rempli?: string[];
  type?: string[];
  participation_score?: string[];
  text?: string[];
};
const initialFilters: TFilters = {};

// mapping nom des filtres => params dans l'url
const nameToShortNames: {[K in keyof TFilters]?: string} = {
  thematiques: 't',
  pilotes: 'p',
  services: 's',
  plans: 'pl',
  rempli: 'r',
  type: 'ty',
  participation_score: 'ps',
  text: 'tx',
};

const RE_INT = /^\d+$/;

/**
 * Gère les options de filtrage des indicateurs
 */
export const useIndicateursFilterState = () => {
  // filtre initial
  const [filterParams, setFilterParams] = useSearchParams<TFilters>(
    '/',
    initialFilters,
    nameToShortNames
  );

  // réinitialise les paramètres de filtrage
  const resetFilterParams = () => {
    setFilterParams(initialFilters);
  };

  // mise à jour des paramètres de filtrage
  const updateFilterParam = (key: keyof TFilters, values: string[]) => {
    // cas général : met à jour le filtre associé à la clé donnée
    setFilterParams({
      ...filterParams,
      [key]: values?.includes(ITEM_ALL) ? [] : values,
    });
  };

  // compte le nombre de filtres actifs
  const filterParamsCount = Object.values(filterParams).reduce(
    (total, values) => total + values?.filter(v => v !== ITEM_ALL)?.length || 0,
    0
  );

  // cas particulier pour les personnes pilotes :
  // on sépare les identifiants des tags et les id. utilisateurs
  const {tag_ids, user_ids} = splitTagsAndUsers(filterParams.pilotes);

  // cas particulier : le choix "fiches non classées" dans le filtre par plan est exclusif
  const filtreFichesNonClassees =
    filterParams.plans?.includes(ITEM_FICHES_NON_CLASSEES) || undefined;

  // extrait les paramètres au format attendu par la requête de filtrage
  const filters: Filters = {
    thematique_ids: stringsToInts(filterParams.thematiques),
    pilote_user_ids: user_ids,
    pilote_tag_ids: stringsToInts(tag_ids),
    service_ids: stringsToInts(filterParams.services),
    plan_ids: filtreFichesNonClassees
      ? undefined
      : stringsToInts(filterParams.plans),
    fiches_non_classees: filtreFichesNonClassees,
    rempli:
      (filterParams?.rempli?.length || 0) !== 1
        ? undefined
        : filterParams?.rempli?.includes('oui'),
    type: filterParams.type as Enums<'indicateur_referentiel_type'>[],
    participation_score:
      filterParams.participation_score?.includes('oui') || undefined,
    text: filterParams?.text?.[0]?.trim() || undefined,
  };

  return {
    filters,
    filterParams,
    updateFilterParam,
    resetFilterParams,
    filterParamsCount,
  };
};

export type UseFilterState = ReturnType<typeof useIndicateursFilterState>;

const stringsToInts = (items: string[] | undefined) =>
  items?.map(str => parseInt(str)).filter(n => !isNaN(n));

const splitTagsAndUsers = (values: string[] | undefined) => {
  const initialValue = {tag_ids: [], user_ids: []} as {
    tag_ids: string[];
    user_ids: string[];
  };
  return (
    values?.reduce((acc, value) => {
      const key = RE_INT.test(value) ? 'tag_ids' : 'user_ids';
      return {
        ...acc,
        [key]: [...acc[key], value],
      };
    }, initialValue) || initialValue
  );
};
