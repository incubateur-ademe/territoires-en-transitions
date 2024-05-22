import {useState} from 'react';

import {TDBViewParam, makeCollectiviteIndicateursUrl} from 'app/paths';
import ModulePage from '../ModulePage';
import {indicateursSuiviPlans} from 'app/pages/collectivite/TableauDeBord/Module/data';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {getIndicateurGroup} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Pagination} from 'ui/shared/Pagination';

type Props = {
  view: TDBViewParam;
  plan_ids?: number[];
};

const ModuleIndicateursPage = ({view, plan_ids}: Props) => {
  const collectiviteId = useCollectiviteId();

  const {data} = useFilteredIndicateurDefinitions(null, {
    plan_ids,
  });

  const perPage = 9;

  const nbOfPages = data ? Math.ceil(data.length / perPage) : 1;

  const [currentPage, setCurrentPage] = useState(1);

  const currentDefs = data?.filter(
    (_, i) => Math.floor(i / perPage) + 1 === currentPage
  );

  return (
    <ModulePage view={view} title={indicateursSuiviPlans.title}>
      {currentDefs && (
        <>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentDefs.map(definition => (
              <IndicateurCard
                key={definition.id}
                definition={definition}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId: collectiviteId!,
                  indicateurView: getIndicateurGroup(definition.id),
                  indicateurId: definition.id,
                })}
                className="hover:!bg-white"
                card={{external: true}}
              />
            ))}
          </div>
          <div className="mx-auto mt-16">
            <Pagination
              selectedPage={currentPage}
              nbOfPages={nbOfPages}
              onChange={page => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
