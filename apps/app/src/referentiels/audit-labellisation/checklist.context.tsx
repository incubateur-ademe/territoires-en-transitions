'use client';

import {
  TCycleLabellisation,
  useCycleLabellisation,
} from '@/app/referentiels/labellisations/useCycleLabellisation';
import { ActionId } from '@tet/domain/referentiels';
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Parcours } from './checklist-view-model';
import { parcoursToChecklist } from './parcours-to-checklist';
import { AuditLabellisationReferentielId } from './referentiel';

type ChecklistContextValue = {
  cycle: TCycleLabellisation;
  parcours: Parcours | null;
  referentielId: AuditLabellisationReferentielId;
};

type RoleDropdownContextValue = {
  /** actionId de la mesure dont le dropdown du header est ouvert */
  activeActionId: ActionId | null;
  openDropdown: (actionId: ActionId) => void;
  closeDropdown: () => void;
};

const ChecklistContext = createContext<ChecklistContextValue | null>(null);
const RoleDropdownContext = createContext<RoleDropdownContextValue | null>(
  null
);

const ChecklistParcoursProvider = ({
  referentielId,
  children,
}: {
  referentielId: AuditLabellisationReferentielId;
  children: ReactNode;
}): ReactElement => {
  const cycle = useCycleLabellisation(referentielId);

  const parcours = useMemo(
    () => (cycle.parcours ? parcoursToChecklist(cycle.parcours) : null),
    [cycle.parcours]
  );

  const value = useMemo(
    () => ({ cycle, parcours, referentielId }),
    [cycle, parcours, referentielId]
  );

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
};

const RoleDropdownProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  const [activeActionId, setActiveActionId] = useState<ActionId | null>(null);

  const openDropdown = useCallback(
    (actionId: ActionId) => setActiveActionId(actionId),
    []
  );
  const closeDropdown = useCallback(() => setActiveActionId(null), []);

  const value = useMemo(
    () => ({ activeActionId, openDropdown, closeDropdown }),
    [activeActionId, openDropdown, closeDropdown]
  );

  return (
    <RoleDropdownContext.Provider value={value}>
      {children}
    </RoleDropdownContext.Provider>
  );
};

export const ChecklistProvider = ({
  referentielId,
  children,
}: {
  referentielId: AuditLabellisationReferentielId;
  children: ReactNode;
}): ReactElement => (
  <ChecklistParcoursProvider referentielId={referentielId}>
    <RoleDropdownProvider>{children}</RoleDropdownProvider>
  </ChecklistParcoursProvider>
);

export const useChecklist = (): ChecklistContextValue => {
  const value = useContext(ChecklistContext);
  if (!value) {
    throw new Error('useChecklist must be used inside ChecklistProvider');
  }
  return value;
};

export const useRoleDropdown = (): RoleDropdownContextValue => {
  const value = useContext(RoleDropdownContext);
  if (!value) {
    throw new Error('useRoleDropdown must be used inside ChecklistProvider');
  }
  return value;
};
