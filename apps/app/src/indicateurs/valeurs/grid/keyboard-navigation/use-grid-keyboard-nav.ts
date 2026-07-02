import {
  FocusEvent,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  buildNavigableKeys,
  getNextNavKey,
  NavDirection,
} from './grid-navigation';
import { GridRowGroup, isCellKey, Year } from '../types';

const CELL_ATTRIBUTE = 'data-cell-id';

const getNavDirection = (event: KeyboardEvent): NavDirection | null => {
  if (event.key === 'ArrowDown') return 'down';
  if (event.key === 'ArrowUp') return 'up';
  if (event.key === 'Enter') return event.shiftKey ? 'up' : 'down';
  if (event.key === 'Tab') return event.shiftKey ? 'previous' : 'next';
  return null;
};

const getFocusableCells = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(`[${CELL_ATTRIBUTE}]`));

export const useGridKeyboardNav = ({
  containerRef,
  groups,
  years,
}: {
  containerRef: RefObject<HTMLElement | null>;
  groups: GridRowGroup[];
  years: Year[];
}): {
  onKeyDown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
} => {
  const navigableKeys = useMemo(
    () => buildNavigableKeys({ groups, years }),
    [groups, years]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const cells = getFocusableCells(container);
    const hasTabbableCell = cells.some(
      (cell) => cell.getAttribute('tabindex') === '0'
    );
    if (cells.length === 0 || hasTabbableCell) {
      return;
    }
    cells.forEach((cell, index) =>
      cell.setAttribute('tabindex', index === 0 ? '0' : '-1')
    );
  });

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const container = containerRef.current;
      const target = event.target;
      if (container === null || !(target instanceof HTMLElement)) {
        return;
      }
      const fromKey = target.getAttribute(CELL_ATTRIBUTE);
      const direction = getNavDirection(event);
      if (!isCellKey(fromKey) || direction === null) {
        return;
      }
      const toKey = getNextNavKey(navigableKeys, fromKey, direction);
      if (toKey === null) {
        return;
      }
      const toCell = container.querySelector<HTMLElement>(
        `[${CELL_ATTRIBUTE}="${toKey}"]`
      );
      if (toCell === null) {
        return;
      }
      event.preventDefault();
      toCell.focus();
    },
    [containerRef, navigableKeys]
  );

  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const container = containerRef.current;
      const focused = event.target;
      if (container === null || !(focused instanceof HTMLElement)) {
        return;
      }
      if (focused.getAttribute(CELL_ATTRIBUTE) === null) {
        return;
      }
      getFocusableCells(container).forEach((cell) =>
        cell.setAttribute('tabindex', cell === focused ? '0' : '-1')
      );
    },
    [containerRef]
  );

  return { onKeyDown, onFocus };
};
