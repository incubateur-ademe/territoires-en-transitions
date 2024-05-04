/** Référencer les différents slugs des modules ici,
 * sachant que l'affichage du bon module dépend de son slug */
export type TDBModuleSlug = 'actions-dont-je-suis-pilote';

/** Types d'un module tableau de bord plans d'action */
export type TDBModuleTypes = {
  /** Le titre du module */
  title: string;
  /** Le nom donné à l'url du module,
   * est utilisé comme id pour afficher la bonne page du module */
  slug: TDBModuleSlug;
  /** Les différents filtres sélectionnés */
  filters?: any[];
  /** le type de tri sélectionné */
  sortBy?: any;
};

/** Module Actions dont je suis le pilote */
export const actionsDontJeSuisPilote: TDBModuleTypes = {
  title: 'Actions dont je suis le pilote',
  slug: 'actions-dont-je-suis-pilote',
};

/** Liste des modules d'un utilisateur avec les filtres sauvegardés */
export const tdbPersonnelModules: TDBModuleTypes[] = [actionsDontJeSuisPilote];
