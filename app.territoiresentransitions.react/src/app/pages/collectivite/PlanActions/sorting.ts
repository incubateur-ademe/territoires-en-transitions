import {
  Categorie,
  PlanActionStructure,
  PlanActionTyped,
} from 'types/PlanActionTypedInterface';
import {FicheAction} from 'generated/models/fiche_action';
import {compareIndexes} from 'utils';

interface Categorized {
  fiches: FicheAction[];
  categorie: Categorie;
}

export const defaultCategorie: Categorie = {
  nom: 'Sans catégorie',
  uid: '',
};

export function categorizeAndSortFiches(
  allFiches: FicheAction[],
  plan: PlanActionTyped
): Categorized[] {
  // step 1: sort categories
  const categories: Categorie[] = [...plan.categories, defaultCategorie];
  const fichesByCategory = (plan as PlanActionStructure).fiches_by_category;
  categories.sort((a, b) => compareIndexes(a.nom, b.nom));
  return categories.map((categorie: Categorie) => {
    // step 2: find fiches
    const fiches: FicheAction[] = [];
    for (const {fiche_uid} of fichesByCategory.filter(
      fc => fc.category_uid === categorie.uid
    )) {
      const fiche = allFiches.find(f => f.uid === fiche_uid);
      if (fiche) fiches.push(fiche);
    }
    // step 3: sort fiches
    fiches.sort((a, b) => compareIndexes(a.titre, b.titre));
    fiches.sort((a, b) => compareIndexes(a.custom_id, b.custom_id));
    return {
      categorie: categorie,
      fiches: fiches,
    };
  });
}

export interface CategorizedNode {
  fiches: FicheAction[];
  categorie: Categorie;
  children: CategorizedNode[];
}

export function nestCategorized(categorized: Categorized[]): CategorizedNode[] {
  // Tree
  const root: CategorizedNode[] = categorized
    .filter(c => !c.categorie.parent)
    .map(c => {
      return {
        fiches: c.fiches,
        categorie: c.categorie,
        children: [],
      };
    });

  function search(
    nodes: CategorizedNode[],
    uid: string
  ): CategorizedNode | null {
    for (const node of nodes) {
      if (node.categorie.uid === uid) return node;
      const found = search(node.children, uid);
      if (found) return found;
    }
    return null;
  }

  // Consume categorized to put them in the tree.
  for (const c of categorized) {
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
