'use client';

import {
  TCycleLabellisation,
  useCycleLabellisation,
} from '@/app/referentiels/labellisations/useCycleLabellisation';
import {
  ActionId,
  AuditLabellisationReferentielId,
} from '@tet/domain/referentiels';
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
import { isActeEngagementVisible } from './checklist/rules/is-acte-engagement-visible';
import { isCandidatureDocumentsVisible } from './checklist/rules/is-candidature-documents-visible';
import { parcoursToChecklist } from './parcours-to-checklist';
import { useRolePilotesPresence } from './use-role-pilotes-presence';

type ChecklistContextValue = {
  cycle: TCycleLabellisation;
  parcours: Parcours | null;
  referentielId: AuditLabellisationReferentielId;
  premiereEtoileObtenue: boolean;
  showActeEngagement: boolean;
  showCandidatureDocuments: boolean;
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
  const rolePilotes = useRolePilotesPresence(referentielId);

  const parcours = useMemo(
    () =>
      cycle.parcours && rolePilotes.isLoaded
        ? parcoursToChecklist(cycle.parcours, rolePilotes.presence)
        : null,
    [cycle.parcours, rolePilotes.isLoaded, rolePilotes.presence]
  );

  const cycleWithPilotesLoading = useMemo(
    () => ({
      ...cycle,
      isLoading: cycle.isLoading || !rolePilotes.isLoaded,
    }),
    [cycle, rolePilotes.isLoaded]
  );

  const premiereEtoileObtenue = cycle.parcours?.labellisation != null;
  const showActeEngagement = isActeEngagementVisible({
    isCOT: cycle.isCOT,
    hasAtLeastOneStar: premiereEtoileObtenue,
  });
  const showCandidatureDocuments =
    parcours != null &&
    isCandidatureDocumentsVisible(parcours.maximumRequestableStar);

  const value = useMemo(
    () => ({
      cycle: cycleWithPilotesLoading,
      parcours,
      referentielId,
      premiereEtoileObtenue,
      showActeEngagement,
      showCandidatureDocuments,
    }),
    [
      cycleWithPilotesLoading,
      parcours,
      referentielId,
      premiereEtoileObtenue,
      showActeEngagement,
      showCandidatureDocuments,
    ]
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
