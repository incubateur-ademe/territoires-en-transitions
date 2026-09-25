import type { ColorVariant } from '@tet/design-tokens';
import type { MatrixCoord } from './matrix-coord';

type MatrixTone = Extract<
  ColorVariant,
  'default' | 'success' | 'warning' | 'info' | 'grey'
>;

type TitleAnchor = 'topLeft' | 'bottomRight';

type QuadrantColors = {
  background?: string;
  title?: string;
};

type QuadrantProps = {
  from: MatrixCoord;
  to: MatrixCoord;
  title?: string;
  tone?: MatrixTone;
  titleAnchor?: TitleAnchor;
  colors?: QuadrantColors;
};

const Quadrant = (_props: QuadrantProps): null => null;

export { Quadrant };
export type { MatrixTone, QuadrantColors, QuadrantProps, TitleAnchor };
