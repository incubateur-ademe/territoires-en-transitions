import {Filters} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import {TFilters} from 'app/pages/collectivite/PlansActions/FicheAction/data/filters';
import {TDBViewParam} from 'app/paths';

/** Référencer les différents slugs des modules ici,
 * sachant que l'affichage du bon module dépend de son slug */
export type TDBModuleSlug = 'actions-dont-je-suis-pilote';

/** Types générique d'un module tableau de bord plans d'action */
type TDBModule = {
  /** Le titre du module */
  title: string;
  /** Le nom donné à l'url du module,
   * est utilisé comme id pour afficher la bonne page du module */
  slug: TDBModuleSlug;
};

/** Types d'un module spécifique aux fiches actions */
export type TDBFichesActionsModuleTypes = TDBModule & {
  /** Les différents filtres sélectionnés */
  filters: TFilters[];
  /** le type de tri sélectionné */
  sortBy?: any;
  /** Défini l'affichage des actions */
  display: 'cards' | 'table';
};

/** Types d'un module spécifique aux indicateurs */
export type TDBIndicateursModuleTypes = TDBModule & {
  /** Les différents filtres sélectionnés */
  filters: Filters[];
  /** le type de tri sélectionné */
  sortBy?: any;
};

/** Module Actions dont je suis le pilote */
export const actionsDontJeSuisPilote: TDBFichesActionsModuleTypes = {
  title: 'Actions dont je suis le pilote',
  slug: 'actions-dont-je-suis-pilote',
  display: 'cards',
  filters: [],
};

export type TDBUtilisateurModulesTypes = (
  | TDBModule
  | TDBFichesActionsModuleTypes
  | TDBIndicateursModuleTypes
)[];

/** Réglagle tableau de bord personnel de l'utilisateur */
export const tdbUtilisateur: {
  defaultView: TDBViewParam;
  tdbPersonnelModules: TDBUtilisateurModulesTypes;
} = {
  defaultView: 'personnel',
  tdbPersonnelModules: [actionsDontJeSuisPilote],
};
