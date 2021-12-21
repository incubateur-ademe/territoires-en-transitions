import {
  Categorie,
  PlanActionStructure,
  PlanActionTyped,
} from 'types/PlanActionTypedInterface';
import {FicheAction} from 'generated/models/fiche_action';
import {compareIndexes} from 'utils';
import {defaultDisplayCategorie} from 'app/pages/collectivite/PlanActions/defaultDisplayCategorie';

/**
 * Used to attach fiches to a category.
 */
interface Categorized {
  fiches: FicheAction[];
  categorie: Categorie;
}

/**
 * Used to display fiches in a category tree.
 */
export interface CategorizedNode {
  fiches?: FicheAction[];
  categorie: Categorie;
  children: CategorizedNode[];
}

/**
 * Used to display categories in a tree.
 */
export interface CategoryNode {
  categorie: Categorie;
  children: CategoryNode[];
}

/**
 * Sort categories then attach sorted fiches to categories.
 */
export function categorizeAndSortFiches(
  allFiches: FicheAction[],
  plan: PlanActionTyped
): Categorized[] {
  // step 1: sort categories
  const categories: Categorie[] = [...plan.categories];
  const fichesByCategory = (plan as PlanActionStructure).fiches_by_category;
  categories.sort((a, b) => compareIndexes(a.nom, b.nom));
  categories.push(defaultDisplayCategorie);
  // step 2: categorize
  const categorized = categories.map((categorie: Categorie) => {
    // step 2a: find fiches
    const fiches: FicheAction[] = [];
    for (const {fiche_uid} of fichesByCategory.filter(
      fc => (fc.category_uid ?? '') === categorie.uid
    )) {
      const fiche = allFiches.find(f => f.uid === fiche_uid);
      if (fiche) fiches.push(fiche);
    }
    // step 2b: sort fiches
    fiches.sort((a, b) => compareIndexes(a.titre, b.titre));
    fiches.sort((a, b) => compareIndexes(a.custom_id, b.custom_id));
    return {
      categorie: categorie,
      fiches: fiches,
    };
  });
  // Step 3: find orphans.
  const adoptedFicheUids: string[] = [];
  for (const cat of categorized) {
    for (const fiche of cat.fiches) {
      adoptedFicheUids.push(fiche.uid);
    }
  }
  for (const fiche of allFiches) {
    if (!adoptedFicheUids.includes(fiche.uid)) {
      categorized[categorized.length - 1]!.fiches.push(fiche);
    }
  }
  return categorized;
}

/**
 * Search into nodes.
 */
function search(nodes: CategoryNode[], uid: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.categorie.uid === uid) return node;
    const found = search(node.children, uid);
    if (found) return found;
  }
  return null;
}

/**
 * Nest a list nodes
 */
function nest(nodes: CategorizedNode[]): CategorizedNode[] {
  const root: CategorizedNode[] = nodes.filter(c => !c.categorie.parent);
  for (const c of nodes) {
    if (!c.categorie.parent) continue;
    const node = {
      fiches: c.fiches,
      categorie: c.categorie,
      children: [],
    };
    const parent = search(root, node.categorie.parent!);
    if (parent) parent.children.push(node);
  }
  return root;
}

/**
 * Organize Categorized into a tree, used to display fiches on plan page.
 */
export function nestCategorized(categorized: Categorized[]): CategorizedNode[] {
  // Tree base
  const nodes: CategorizedNode[] = categorized.map(c => {
    return {
      fiches: c.fiches,
      categorie: c.categorie,
      children: [],
    };
  });

  return nest(nodes) as CategorizedNode[];
}

/**
 * Organize categories into a tree, used to display categories in structure
 * dialog.
 */
export function nestPlanCategories(categories: Categorie[]) {
  const sorted = [...categories];
  sorted.sort((a, b) => compareIndexes(a.nom, b.nom));
  const nodes: CategoryNode[] = sorted.map((categorie: Categorie) => {
    return {
      categorie: categorie,
      children: [],
    };
  });
  return nest(nodes);
}
