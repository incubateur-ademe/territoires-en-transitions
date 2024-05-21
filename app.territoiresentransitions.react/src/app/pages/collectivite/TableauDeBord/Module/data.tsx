import {Filters} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import {TFilters} from 'app/pages/collectivite/PlansActions/FicheAction/data/filters';
import {TDBViewParam} from 'app/paths';
import PictoExpert from 'ui/pictogrammes/PictoExpert';

/**
 * ********
 * TYPES
 * ********
 */

/** Référencer les différents slugs des modules ici,
 * sachant que l'affichage du bon module dépend de son slug */
export enum TDBModuleSlug {
  ACTIONS_DONT_JE_SUIS_LE_PILOTE = 'actions-dont-je-suis-pilote',
  INDICATEURS_DE_SUIVI_DE_MES_PLANS = 'indicateurs-de-suivi-de-mes-plan',
}

/** Types générique d'un module tableau de bord plans d'action */
type TDBModuleBase = {
  /** Le titre du module */
  title: string;
  /** Le nom donné à l'url du module,
   * est utilisé comme id pour afficher la bonne page du module */
  slug: TDBModuleSlug;
  /** Le symbole du module (picto svg) */
  symbole?: React.ReactNode;
};

/** Types d'un module spécifique aux fiches actions */
export type TDBModuleFichesActions = TDBModuleBase & {
  /** Les différents filtres sélectionnés */
  filters: TFilters;
  /** le type de tri sélectionné */
  sortBy?: any;
  /** Défini l'affichage des actions */
  display: 'cards' | 'table';
};

/** Types d'un module spécifique aux indicateurs */
export type TDBModuleIndicateurs = TDBModuleBase & {
  /** Les différents filtres sélectionnés */
  filters: Filters;
  /** le type de tri sélectionné */
  sortBy?: any;
};

/** Les différents types de modules */
export type TDBUtilisateurModulesTypes = (
  | TDBModuleBase
  | TDBModuleFichesActions
  | TDBModuleIndicateurs
)[];

/**
 * ********
 * DATA
 * ********
 */

/** Module Actions dont je suis le pilote */
export const actionsDontJeSuisPilote: TDBModuleFichesActions = {
  title: 'Actions dont je suis le pilote',
  slug: TDBModuleSlug.ACTIONS_DONT_JE_SUIS_LE_PILOTE,
  display: 'cards',
  symbole: <PictoExpert />,
  filters: {collectivite_id: 1},
};

/** Module Actions dont je suis le pilote */
export const indicateursSuiviPlans: TDBModuleIndicateurs = {
  title: 'Indicateurs de suivi de mes plan',
  slug: TDBModuleSlug.INDICATEURS_DE_SUIVI_DE_MES_PLANS,
  symbole: <PictoExpert />,
  filters: {},
};

/** Réglages, modules, filtres du tableau de bord sauvegardés par l'utilisateur */
export const tdbUtilisateur: {
  /** Vue par défaut de la page tableau de bord (collectivité ou personnelle) */
  defaultView: TDBViewParam;
  /** Les différents modules avec filtres associès sauvegardés par l'utilisateur */
  tdbPersonnelModules: TDBUtilisateurModulesTypes;
} = {
  defaultView: 'personnel',
  tdbPersonnelModules: [indicateursSuiviPlans, actionsDontJeSuisPilote],
};
