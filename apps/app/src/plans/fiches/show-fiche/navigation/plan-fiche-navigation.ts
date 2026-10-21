import { childrenOfPlanNodes } from '@/app/plans/plans/utils';
import { PlanNode } from '@tet/domain/plans';

export class PlanFicheNavigation {
  /** Parcourt le plan dans l'ordre d'affichage, avec une seule visite par fiche. */
  static getAdjacentFiches({
    planId,
    axes,
    orderedFicheIds,
    ficheId,
  }: {
    planId: number;
    axes: PlanNode[];
    /** Fiches accessibles, déjà triées par titre comme les cartes du plan. */
    orderedFicheIds: number[];
    ficheId: number;
  }): { previousId?: number; nextId?: number } {
    const root = axes.find((axe) => axe.id === planId);
    if (!root) return {};

    const ficheOrder = new Map(orderedFicheIds.map((id, index) => [id, index]));
    const visitedFiches = new Set<number>();
    const visitedAxes = new Set<number>();

    const visit = (axe: PlanNode): void => {
      if (visitedAxes.has(axe.id)) return;
      visitedAxes.add(axe.id);

      axe.fiches
        .filter((id) => ficheOrder.has(id))
        .sort((a, b) => (ficheOrder.get(a) ?? 0) - (ficheOrder.get(b) ?? 0))
        .forEach((id) => visitedFiches.add(id));

      childrenOfPlanNodes(axe, axes).forEach(visit);
    };
    visit(root);

    const ficheIds = [...visitedFiches];
    const index = ficheIds.indexOf(ficheId);
    if (index === -1) return {};

    return {
      previousId: ficheIds[index - 1],
      nextId: ficheIds[index + 1],
    };
  }
}
