import type { Ref, RefCallback } from 'react';

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && !Object.isFrozen(ref)) {
        ref.current = node;
      }
    });
  };
}
