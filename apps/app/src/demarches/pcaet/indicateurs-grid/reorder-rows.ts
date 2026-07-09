import { arrayMove } from '@dnd-kit/sortable';
import { parseDragId } from '@/app/indicateurs/valeurs/grid/drag-reorder/use-grid-reorder';
import {
  applyRowOrder,
  IndicateurGridShape,
  RowOrder,
} from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';

export const reorderRows = ({
  initialShape,
  rowOrder,
  identifiantReferentielByIndicateurId,
  groupId,
  activeId,
  overId,
}: {
  initialShape: IndicateurGridShape;
  rowOrder: RowOrder;
  identifiantReferentielByIndicateurId: Map<number, string>;
  groupId: string;
  activeId: string;
  overId: string;
}): RowOrder | null => {
  const active = parseDragId(activeId);
  const over = parseDragId(overId);
  if (active?.type !== 'row' || over?.type !== 'row') {
    return null;
  }
  const activeIdentifiant = identifiantReferentielByIndicateurId.get(active.indicateurId);
  const overIdentifiant = identifiantReferentielByIndicateurId.get(over.indicateurId);
  if (activeIdentifiant === undefined || overIdentifiant === undefined) {
    return null;
  }
  const rows = Object.entries(applyRowOrder(initialShape, rowOrder)[groupId] ?? {});
  const from = rows.findIndex(([, id]) => id === activeIdentifiant);
  const to = rows.findIndex(([, id]) => id === overIdentifiant);
  if (from === -1 || to === -1) {
    return null;
  }
  return {
    ...rowOrder,
    [groupId]: arrayMove(rows, from, to).map(([, id]) => id),
  };
};
