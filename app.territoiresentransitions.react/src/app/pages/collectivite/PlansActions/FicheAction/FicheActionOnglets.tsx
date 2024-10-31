import { Tab, Tabs } from '@tet/ui';
import BudgetTab from './Budget/BudgetTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import ActionsLieesTab from './ActionsLiees/ActionsLieesTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';
import { FicheAction } from '@tet/api/plan-actions';
import NotesDeSuiviTab from './NotesDeSuivi/NotesDeSuiviTab';

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

      {/* TODO: Tâches */}

      {/* Notes de suivi */}
      <Tab label="Notes de suivi">
        <NotesDeSuiviTab
          isReadonly={isReadonly}
          fiche={fiche}
          updateFiche={updateFiche}
        />
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

      {/* Actions des référentiels liées */}
      <Tab label="Actions des référentiels liées">
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
    </Tabs>
  );
};

export default FicheActionOnglets;
