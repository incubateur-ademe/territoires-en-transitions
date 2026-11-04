'use client';

import {
  TCycleLabellisation,
  useCycleLabellisation,
} from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionId,
  AuditLabellisationReferentielId,
  Etoile,
  EtoileEnum,
  canUpdateCandidatureDocuments,
  getExpectedDocuments,
  ObjetPreuveEnum,
  SujetDemande,
  SujetDemandeEnum,
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
import { parcoursToChecklist } from './parcours-to-checklist';
import { SujetCotVise, toSujetVise } from './sujet-vise';
import { useEtoileVisee } from './use-etoile-visee';

export type ChecklistContextValue = {
  cycle: TCycleLabellisation;
  parcours: Parcours | null;
  referentielId: AuditLabellisationReferentielId;
  showActeEngagement: boolean;
  showCandidatureDocuments: boolean;
  canUpdateCandidatureDocuments: boolean;
  sujetVise: SujetDemande;
  sujetCotVise: SujetCotVise;
  selectEtoileVisee: (etoile: Etoile) => void;
  selectSujetCotVise: (sujet: SujetCotVise) => void;
};

type RoleDropdownContextValue = {
  /** actionId de la mesure dont le dropdown du header est ouvert */
  activeActionId: ActionId | null;
  openDropdown: (actionId: ActionId) => void;
  closeDropdown: () => void;
};

export const ChecklistContext = createContext<ChecklistContextValue | null>(
  null
);
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
  const { etoileVisee, isEtoileCourante, selectEtoileVisee } =
    useEtoileVisee(referentielId);
  const [sujetCotVise, selectSujetCotVise] = useState<SujetCotVise>(
    SujetDemandeEnum.LABELLISATION_COT
  );
  const cycleEtoileVisee = useCycleLabellisation(referentielId, etoileVisee);
  const isEtoileCouranteEnChargement =
    isEtoileCourante && cycleEtoileVisee.parcours?.etoiles !== etoileVisee;
  const cycle = useMemo(
    () => ({
      ...cycleEtoileVisee,
      isLoading: cycleEtoileVisee.isLoading || isEtoileCouranteEnChargement,
    }),
    [cycleEtoileVisee, isEtoileCouranteEnChargement]
  );
  const sujetVise = toSujetVise({ isCOT: cycle.isCOT, sujetCotVise });
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canMutateLabellisationDocuments = hasCollectivitePermission(
    'referentiels.labellisations.mutate_documents'
  );

  const parcours = useMemo(
    () => (cycle.parcours ? parcoursToChecklist(cycle.parcours) : null),
    [cycle.parcours]
  );

  const premiereEtoileObtenue = cycle.parcours?.labellisation != null;
  const expectedDocuments = getExpectedDocuments({
    sujet: sujetVise,
    isCot: cycle.isCOT,
    premiereEtoileObtenue,
    etoile: parcours?.etoileObjectif ?? EtoileEnum.PREMIERE_ETOILE,
  });
  const showActeEngagement = expectedDocuments.includes(
    ObjetPreuveEnum.ACTE_ENGAGEMENT
  );
  const showCandidatureDocuments = expectedDocuments.includes(
    ObjetPreuveEnum.CANDIDATURE
  );

  const value = useMemo(
    () => ({
      cycle,
      parcours,
      referentielId,
      showActeEngagement,
      showCandidatureDocuments,
      canUpdateCandidatureDocuments: canUpdateCandidatureDocuments({
        isAuditee: cycle.viewerRole === 'auditee',
        canMutateLabellisationDocuments,
        audit: cycle.parcours?.audit ?? null,
      }).canUpdate,
      sujetVise,
      sujetCotVise,
      selectEtoileVisee,
      selectSujetCotVise,
    }),
    [
      cycle,
      parcours,
      referentielId,
      showActeEngagement,
      showCandidatureDocuments,
      canMutateLabellisationDocuments,
      sujetVise,
      sujetCotVise,
      selectEtoileVisee,
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

export const useOptionalChecklist = (): ChecklistContextValue | null =>
  useContext(ChecklistContext);

export const useChecklist = (): ChecklistContextValue => {
  const value = useOptionalChecklist();
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
