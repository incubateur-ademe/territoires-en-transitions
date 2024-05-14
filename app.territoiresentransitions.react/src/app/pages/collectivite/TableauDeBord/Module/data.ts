import {Filters} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import {TFilters} from 'app/pages/collectivite/PlansActions/FicheAction/data/filters';

/** Référencer les différents slugs des modules ici,
 * sachant que l'affichage du bon module dépend de son slug */
export type TDBModuleSlug = 'actions-dont-je-suis-pilote';

/** Types générique d'un module tableau de bord plans d'action */
export type TDBModuleTypes = {
  /** Le titre du module */
  title: string;
  /** Le nom donné à l'url du module,
   * est utilisé comme id pour afficher la bonne page du module */
  slug: TDBModuleSlug;
};

/** Types d'un module spécifique aux fiches actions */
export type TDBFichesActionsModuleTypes = TDBModuleTypes & {
  /** Les différents filtres sélectionnés */
  filters: TFilters[];
  /** le type de tri sélectionné */
  sortBy?: any;
  /** Défini l'affichage des actions */
  display: 'cards' | 'table';
};

/** Types d'un module spécifique aux indicateurs */
export type TDBIndicateursModuleTypes = TDBModuleTypes & {
  /** Les différents filtres sélectionnés */
  filters: Filters[];
  /** le type de tri sélectionné */
  sortBy?: any;
};

/** Module Actions dont je suis le pilote */
export const actionsDontJeSuisPilote: TDBFichesActionsModuleTypes = {
  title: 'Actions dont je suis le pilote',
  slug: 'actions-dont-je-suis-pilote',
  filters: [],
  display: 'cards',
};

/** Liste des modules d'un utilisateur avec les filtres sauvegardés */
export const tdbPersonnelModules: (
  | TDBModuleTypes
  | TDBFichesActionsModuleTypes
  | TDBIndicateursModuleTypes
)[] = [actionsDontJeSuisPilote];
