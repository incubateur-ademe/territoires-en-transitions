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
import { ArchivesPanel, ArchivesPanelParams } from './archives-panel';

type PreuvesArchiveGenerationContextValue = {
  openPanel: (params: ArchivesPanelParams) => void;
};

const PreuvesArchiveGenerationContext =
  createContext<PreuvesArchiveGenerationContextValue | null>(null);

export function usePreuvesArchiveGeneration(): PreuvesArchiveGenerationContextValue {
  const context = useContext(PreuvesArchiveGenerationContext);
  if (!context) {
    throw new Error(
      'usePreuvesArchiveGeneration doit être utilisé dans un PreuvesArchiveGenerationProvider'
    );
  }
  return context;
}

export function PreuvesArchiveGenerationProvider({
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
    <PreuvesArchiveGenerationContext.Provider value={value}>
      {children}
      {panelParams !== null && (
        <ArchivesPanel
          collectiviteId={panelParams.collectiviteId}
          collectiviteNom={panelParams.collectiviteNom}
          referentielId={panelParams.referentielId}
          canGenerate={panelParams.canGenerate}
          onClose={closePanel}
        />
      )}
    </PreuvesArchiveGenerationContext.Provider>
  );
}
