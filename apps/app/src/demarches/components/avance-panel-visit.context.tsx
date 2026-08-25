'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

type DemarcheVisitContextValue = {
  /**
   * Vrai une seule fois par visite : réclame l'ouverture automatique du
   * panneau d'avancée, et la consomme.
   */
  claimAvancePanelAutoOpen: () => boolean;
};

const DemarcheVisitContext = createContext<
  DemarcheVisitContextValue | undefined
>(undefined);

/**
 * Portée « visite d'une démarche » : monté par le layout du segment
 * `[demarcheId]`, il survit à la navigation entre sections et disparaît quand
 * on quitte la démarche.
 *
 * C'est ce cycle de vie qui permet d'ouvrir le panneau d'avancée à l'arrivée
 * sans le rouvrir dans le dos de l'utilisateur à chaque changement de section :
 * les pages de sections, elles, se remontent à chaque navigation.
 */
export const DemarcheVisitProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const hasAutoOpenedAvancePanel = useRef(false);

  const claimAvancePanelAutoOpen = useCallback(() => {
    if (hasAutoOpenedAvancePanel.current) return false;
    hasAutoOpenedAvancePanel.current = true;
    return true;
  }, []);

  const value = useMemo(
    () => ({ claimAvancePanelAutoOpen }),
    [claimAvancePanelAutoOpen]
  );

  return <DemarcheVisitContext value={value}>{children}</DemarcheVisitContext>;
};

/** `undefined` hors d'une visite de démarche (ex. page de création). */
export const useDemarcheVisit = (): DemarcheVisitContextValue | undefined =>
  useContext(DemarcheVisitContext);
