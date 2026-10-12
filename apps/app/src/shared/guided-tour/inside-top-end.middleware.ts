import type { Middleware } from '@floating-ui/react';

export const insideTopEnd = (margin: number): Middleware => ({
  name: 'insideTopEnd',
  fn: ({ rects }) => ({
    x:
      rects.reference.x + rects.reference.width - rects.floating.width - margin,
    y: rects.reference.y + margin,
  }),
});
