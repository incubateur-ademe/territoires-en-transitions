/** Référencer les différents slugs des modules ici,
 * sachant que l'affichage du bon module dépend de son slug */
export type TDBModuleSlug = 'actions-dont-je-suis-pilote';

/** Types d'un module tableau de bord plans d'action */
export type TDBModuleTypes = {
  id?: string;
  title: string;
  slug: TDBModuleSlug;
  filters?: any[];
  sortBy?: any;
};

/** Module Actions dont je suis le pilote */
export const actionsDontJeSuisPilote: TDBModuleTypes = {
  title: 'Actions dont je suis le pilote',
  slug: 'actions-dont-je-suis-pilote',
};
