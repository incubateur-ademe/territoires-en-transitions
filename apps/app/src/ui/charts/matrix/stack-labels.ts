type LabelAnchor = {
  dataIndex: number;
  x: number;
  y: number;
};

type LabelPlacement = {
  x: number;
  y: number;
};

type LabelPlacements = Partial<Record<number, LabelPlacement>>;

type Stacking = {
  previousBottom: number;
  placements: LabelPlacements;
};

const stackLabelsVertically = ({
  anchors,
  labelHeight,
  gapToPoint,
}: {
  anchors: readonly LabelAnchor[];
  labelHeight: number;
  gapToPoint: number;
}): LabelPlacements =>
  [...anchors]
    .sort((first, second) => first.y - second.y)
    .reduce<Stacking>(
      ({ previousBottom, placements }, anchor) => {
        const y = Math.max(anchor.y - gapToPoint, previousBottom + labelHeight);
        return {
          previousBottom: y,
          placements: { ...placements, [anchor.dataIndex]: { x: anchor.x, y } },
        };
      },
      { previousBottom: Number.NEGATIVE_INFINITY, placements: {} }
    ).placements;

export { stackLabelsVertically };
export type { LabelAnchor, LabelPlacement, LabelPlacements };
