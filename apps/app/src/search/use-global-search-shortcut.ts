'use client';

import { useEffect } from 'react';

/**
 * Listens for the global ⌘K (macOS) / Ctrl+K (other platforms) shortcut and
 * triggers the provided callback. The default browser behavior (focus the
 * address bar on Chrome) is suppressed.
 *
 * Per the plan's edge case: the shortcut intentionally fires even when the
 * focus is inside an input/textarea/contenteditable — opening the search modal
 * from anywhere is the expected behavior.
 */
export function useGlobalSearchShortcut(callback: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      const isK = event.key === 'k' || event.key === 'K';
      if (!isModifier || !isK) {
        return;
      }
      // Don't fire alongside other modifiers that already mean something else.
      if (event.altKey) {
        return;
      }
      event.preventDefault();
      callback();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback]);
}
