type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type LabelRequest = {
  dataIndex: number;
  pointX: number;
  pointY: number;
  width: number;
};

type LabelSide = 'left' | 'right';

type LabelPlacement = {
  x: number;
  y: number;
  side: LabelSide;
};

type LabelPlacements = Partial<Record<number, LabelPlacement>>;

type Candidate = {
  side: LabelSide;
  box: Box;
};

type Placing = {
  occupied: readonly Box[];
  placements: LabelPlacements;
};

const MAX_SHIFT_STEPS = 3;

const intersects = (first: Box, second: Box): boolean =>
  first.left < second.right &&
  second.left < first.right &&
  first.top < second.bottom &&
  second.top < first.bottom;

const fitsIn = (box: Box, area: Box): boolean =>
  box.left >= area.left &&
  box.right <= area.right &&
  box.top >= area.top &&
  box.bottom <= area.bottom;

const toShiftSteps = (): readonly number[] => [
  0,
  ...Array.from({ length: MAX_SHIFT_STEPS }, (_, index) => index + 1).flatMap(
    (step) => [step, -step]
  ),
];

const toBox = ({
  label,
  side,
  centerY,
  gapToPoint,
  labelHeight,
}: {
  label: LabelRequest;
  side: LabelSide;
  centerY: number;
  gapToPoint: number;
  labelHeight: number;
}): Box => {
  const left =
    side === 'right'
      ? label.pointX + gapToPoint
      : label.pointX - gapToPoint - label.width;
  return {
    left,
    right: left + label.width,
    top: centerY - labelHeight / 2,
    bottom: centerY + labelHeight / 2,
  };
};

const toPreferredSides = ({
  label,
  area,
  gapToPoint,
}: {
  label: LabelRequest;
  area: Box;
  gapToPoint: number;
}): readonly [LabelSide, LabelSide] => {
  const overflowsRight = label.pointX + gapToPoint + label.width > area.right;
  if (overflowsRight) {
    return ['left', 'right'];
  }
  return ['right', 'left'];
};

const toCandidates = ({
  label,
  area,
  gapToPoint,
  labelHeight,
}: {
  label: LabelRequest;
  area: Box;
  gapToPoint: number;
  labelHeight: number;
}): readonly Candidate[] => {
  const sides = toPreferredSides({ label, area, gapToPoint });
  return toShiftSteps().flatMap((step) =>
    sides.map((side) => ({
      side,
      box: toBox({
        label,
        side,
        centerY: label.pointY + step * labelHeight,
        gapToPoint,
        labelHeight,
      }),
    }))
  );
};

const findFreeCandidate = ({
  label,
  area,
  occupied,
  gapToPoint,
  labelHeight,
}: {
  label: LabelRequest;
  area: Box;
  occupied: readonly Box[];
  gapToPoint: number;
  labelHeight: number;
}): Candidate | undefined =>
  toCandidates({ label, area, gapToPoint, labelHeight }).find(
    ({ box }) =>
      fitsIn(box, area) && !occupied.some((other) => intersects(other, box))
  );

const toPlacement = ({
  label,
  candidate,
  gapToPoint,
}: {
  label: LabelRequest;
  candidate: Candidate;
  gapToPoint: number;
}): LabelPlacement => ({
  x:
    candidate.side === 'right'
      ? label.pointX + gapToPoint
      : label.pointX - gapToPoint,
  y: (candidate.box.top + candidate.box.bottom) / 2,
  side: candidate.side,
});

const placeLabels = ({
  labels,
  area,
  obstacles,
  labelHeight,
  gapToPoint,
}: {
  labels: readonly LabelRequest[];
  area: Box;
  obstacles: readonly Box[];
  labelHeight: number;
  gapToPoint: number;
}): LabelPlacements =>
  [...labels]
    .sort(
      (first, second) =>
        first.pointY - second.pointY || first.pointX - second.pointX
    )
    .reduce<Placing>(
      ({ occupied, placements }, label) => {
        const candidate = findFreeCandidate({
          label,
          area,
          occupied,
          gapToPoint,
          labelHeight,
        });
        if (candidate === undefined) {
          return { occupied, placements };
        }
        return {
          occupied: [...occupied, candidate.box],
          placements: {
            ...placements,
            [label.dataIndex]: toPlacement({ label, candidate, gapToPoint }),
          },
        };
      },
      { occupied: obstacles, placements: {} }
    ).placements;

export { placeLabels };
export type { Box, LabelPlacement, LabelPlacements, LabelRequest };
