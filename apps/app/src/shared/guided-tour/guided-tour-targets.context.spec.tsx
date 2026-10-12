import { renderHook, screen } from '@testing-library/react';
import { JSX, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGuidedTourTargets,
  GuidedTourTargetsProvider,
} from './guided-tour-targets.context';

type TourTargetId = 'anchor' | 'other';

const ANCHOR_LABEL = 'ancre';

const tourTargets = createGuidedTourTargets<TourTargetId>('tour');

const Anchor = (): JSX.Element => (
  <span ref={tourTargets.useTarget('anchor')}>{ANCHOR_LABEL}</span>
);

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <GuidedTourTargetsProvider>{children}</GuidedTourTargetsProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createGuidedTourTargets', () => {
  it("enregistre l'élément au montage et le retire au démontage", () => {
    const { result, unmount } = renderHook(() => tourTargets.useResolve(), {
      wrapper: ({ children }) => (
        <GuidedTourTargetsProvider>
          <Anchor />
          {children}
        </GuidedTourTargetsProvider>
      ),
    });
    const resolveAnchor = result.current('anchor');
    const mountedElement = screen.getByText(ANCHOR_LABEL);

    const whileMounted = resolveAnchor();
    unmount();

    expect({ whileMounted, afterUnmount: resolveAnchor() }).toEqual({
      whileMounted: mountedElement,
      afterUnmount: null,
    });
  });

  it("garde la même ref tant que l'identifiant de la cible ne change pas", () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: TourTargetId }) => tourTargets.useTarget(id),
      { wrapper, initialProps: { id: 'anchor' } }
    );
    const initialRef = result.current;

    rerender({ id: 'anchor' });
    const sameIdRef = result.current;
    rerender({ id: 'other' });
    const otherIdRef = result.current;

    expect({
      sameId: sameIdRef === initialRef,
      otherId: otherIdRef === initialRef,
    }).toEqual({ sameId: true, otherId: false });
  });

  it('jette quand une cible est utilisée hors du provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => tourTargets.useResolve())).toThrow(
      'useGuidedTourRegistry must be used within a GuidedTourTargetsProvider'
    );
  });
});
