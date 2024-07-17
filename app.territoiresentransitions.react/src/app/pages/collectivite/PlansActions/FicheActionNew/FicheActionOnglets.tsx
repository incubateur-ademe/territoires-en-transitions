import {Tab, Tabs} from '@tet/ui';
import {FicheAction} from '../FicheAction/data/types';
import BudgetTab from './Budget/BudgetTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import ActionsLieesTab from './ActionsLiees/ActionsLieesTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';

type FicheActionOngletsProps = {
  fiche: FicheAction;
  className?: string;
};

const FicheActionOnglets = ({fiche, className}: FicheActionOngletsProps) => {
  return (
    <Tabs
      className={className}
      tabsListClassName="lg:!justify-start lg:pl-0 lg:flex-nowrap lg:overflow-x-scroll"
    >
      {/* TODO: Tâches */}

      {/* Indicateurs de suivi */}
      <Tab label="Indicateurs de suivi">
        <IndicateursTab indicateurs={fiche.indicateurs} />
      </Tab>

      {/* TODO: Notes de suivi */}

      {/* Budget */}
      <Tab label="Budget">
        <BudgetTab
          budgetPrevisionnel={fiche.budget_previsionnel}
          financeurs={fiche.financeurs}
          financements={fiche.financements}
        />
      </Tab>

      {/* Fiches des plans liées */}
      <Tab label="Fiches des plans liées">
        <FichesLieesTab fiches={fiche.fiches_liees} />
      </Tab>

      {/* Actions des référentiels liées */}
      <Tab label="Actions des référentiels liées">
        <ActionsLieesTab actions={fiche.actions} />
      </Tab>

      {/* Notes et documents */}
      <Tab label="Notes et documents ">
        <NotesEtDocumentsTab notes={fiche.notes_complementaires} />
      </Tab>
    </Tabs>
  );
};

export default FicheActionOnglets;
