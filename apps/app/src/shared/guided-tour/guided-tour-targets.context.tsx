'use client';

import {
  createContext,
  JSX,
  ReactNode,
  RefCallback,
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  createGuidedTourRegistry,
  GuidedTourRegistry,
  ResolveTarget,
} from './guided-tour-registry';

type ResolveTargetById<TargetId extends string> = (
  id: TargetId
) => ResolveTarget;

type GuidedTourTargets<TargetId extends string> = {
  useTarget: (id: TargetId) => RefCallback<HTMLElement>;
  useResolve: () => ResolveTargetById<TargetId>;
};

const GuidedTourTargetsContext = createContext<GuidedTourRegistry | null>(null);

const GuidedTourTargetsProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [registry] = useState(createGuidedTourRegistry);

  return (
    <GuidedTourTargetsContext value={registry}>
      {children}
    </GuidedTourTargetsContext>
  );
};

const useGuidedTourRegistry = (): GuidedTourRegistry => {
  const registry = useContext(GuidedTourTargetsContext);
  if (registry === null) {
    throw new Error(
      'useGuidedTourRegistry must be used within a GuidedTourTargetsProvider'
    );
  }
  return registry;
};

const createGuidedTourTargets = <TargetId extends string>(
  tourId: string
): GuidedTourTargets<TargetId> => {
  const useTarget = (id: TargetId): RefCallback<HTMLElement> => {
    const registry = useGuidedTourRegistry();
    return useCallback(
      (element) => {
        if (element === null) {
          return;
        }
        return registry.register({ tourId, targetId: id, element });
      },
      [registry, id]
    );
  };

  const useResolve = (): ResolveTargetById<TargetId> => {
    const registry = useGuidedTourRegistry();
    return useCallback(
      (id: TargetId) => registry.resolve(tourId, id),
      [registry]
    );
  };

  return { useTarget, useResolve };
};

export { createGuidedTourTargets, GuidedTourTargetsProvider };
export type { GuidedTourTargets, ResolveTargetById };
