import {Filtre} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import ModalFiltresToutesLesFichesAction from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/ModalFiltresToutesLesFichesAction';
import FichesActionListe from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/FichesActionListe';
import {useState} from 'react';

const ToutesLesFichesAction = () => {
  const [filters, setFilters] = useState<Filtre>({});

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div>
        <h2 className="mb-0">Toutes les actions</h2>
      </div>
      <FichesActionListe
        filtres={filters}
        settingsModal={openState => (
          <ModalFiltresToutesLesFichesAction
            openState={openState}
            filters={filters}
            setFilters={filters => setFilters(filters)}
          />
        )}
      />
    </div>
  );
};

export default ToutesLesFichesAction;
