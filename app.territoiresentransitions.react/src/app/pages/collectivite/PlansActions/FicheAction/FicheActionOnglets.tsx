import { FicheAction } from '@/api/plan-actions';
import { Tab, Tabs } from '@/ui';
import { ServicesWidget } from '@betagouv/les-communs-widget';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import ActionsLieesTab from './ActionsLiees/ActionsLieesTab';
import BudgetTab from './Budget/BudgetTab';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import NotesDeSuiviTab from './NotesDeSuivi/NotesDeSuiviTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';
import Etapes from './etapes';

type FicheActionOngletsProps = {
  fiche: FicheAction;
  isReadonly: boolean;
  isEditLoading: boolean;
  isFicheLoading: boolean;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionOnglets = ({
  fiche,
  isReadonly,
  isFicheLoading,
  isEditLoading,
  className,
  updateFiche,
}: FicheActionOngletsProps) => {
  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );
  return (
    <Tabs
      className={className}
      tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll"
    >
      {/* Indicateurs de suivi */}
      <Tab label="Indicateurs de suivi">
        <IndicateursTab
          isReadonly={isReadonly}
          isFicheLoading={isFicheLoading}
          fiche={fiche}
          updateFiche={updateFiche}
        />
      </Tab>

      {/* Étapes */}
      <Tab label="Étapes">
        <Etapes isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Notes de suivi */}
      <Tab label="Notes de suivi">
        <NotesDeSuiviTab isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Budget */}
      <Tab label="Budget">
        <BudgetTab
          isReadonly={isReadonly}
          fiche={fiche}
          updateFiche={updateFiche}
        />
      </Tab>

      {/* Fiches des plans liées */}
      <Tab label="Fiches des plans liées">
        <FichesLieesTab
          isReadonly={isReadonly}
          isFicheLoading={isFicheLoading}
          isEditLoading={isEditLoading}
          fiche={fiche}
        />
      </Tab>

      {/* Mesures des référentiels liées */}
      <Tab label="Mesures des référentiels liées">
        <ActionsLieesTab
          isReadonly={isReadonly}
          isEditLoading={isEditLoading}
          fiche={fiche}
          updateFiche={updateFiche}
        />
      </Tab>

      {/* Notes et documents */}
      <Tab label="Notes et documents ">
        <NotesEtDocumentsTab
          isReadonly={isReadonly}
          fiche={fiche}
          updateFiche={updateFiche}
        />
      </Tab>

      {widgetCommunsFlagEnabled ? (
        <Tab label="Services liés">
          <ServicesWidget projectId={fiche.id.toString()} isStagingEnv debug />
        </Tab>
      ) : undefined}
    </Tabs>
  );
};

export default FicheActionOnglets;
