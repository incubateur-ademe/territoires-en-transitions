'use client';

import {
  JSX,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ArchivesPanel, ArchivesPanelParams } from '.';

type ArchivesPanelContextValue = {
  openPanel: (params: ArchivesPanelParams) => void;
};

const ArchivesPanelContext = createContext<ArchivesPanelContextValue | null>(
  null
);

export function useArchivesPanel(): ArchivesPanelContextValue {
  const context = useContext(ArchivesPanelContext);
  if (!context) {
    throw new Error(
      'useArchivesPanel doit être utilisé dans un ArchivesPanelProvider'
    );
  }
  return context;
}

export function ArchivesPanelProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [panelParams, setPanelParams] = useState<ArchivesPanelParams | null>(
    null
  );

  const openPanel = useCallback(
    (params: ArchivesPanelParams) => setPanelParams(params),
    []
  );
  const closePanel = useCallback(() => setPanelParams(null), []);

  const value = useMemo(() => ({ openPanel }), [openPanel]);

  return (
    <ArchivesPanelContext.Provider value={value}>
      {children}
      {panelParams !== null && (
        <ArchivesPanel
          collectiviteId={panelParams.collectiviteId}
          collectiviteNom={panelParams.collectiviteNom}
          referentielId={panelParams.referentielId}
          onClose={closePanel}
        />
      )}
    </ArchivesPanelContext.Provider>
  );
}
