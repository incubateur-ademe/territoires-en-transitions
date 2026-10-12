import type { Middleware } from '@floating-ui/react';
import type { Step } from 'react-joyride';

const INSIDE_TOP_END_MARGIN = 20;

const insideTopEnd = (margin: number): Middleware => ({
  name: 'insideTopEnd',
  fn: ({ rects }) => ({
    x:
      rects.reference.x + rects.reference.width - rects.floating.width - margin,
    y: rects.reference.y + margin,
  }),
});

const insideTopEndFloatingOptions: NonNullable<Step['floatingOptions']> = {
  hideArrow: true,
  middleware: [insideTopEnd(INSIDE_TOP_END_MARGIN)],
};

export { insideTopEnd, insideTopEndFloatingOptions };
