import type { MiddlewareState } from '@floating-ui/react';
import { describe, expect, it } from 'vitest';
import { insideTopEnd } from './inside-top-end.middleware';

describe('insideTopEnd', () => {
  it('place le popover dans le coin haut droit de la cible, à la marge demandée', async () => {
    const state = {
      rects: {
        reference: { x: 100, y: 400, width: 900, height: 600 },
        floating: { x: 0, y: 0, width: 320, height: 200 },
      },
    } as MiddlewareState;

    const result = await insideTopEnd(20).fn(state);

    expect(result).toEqual({ x: 100 + 900 - 320 - 20, y: 400 + 20 });
  });
});
