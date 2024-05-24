import {useHistory} from 'react-router-dom';

import {Button} from '@tet/ui';

import {
  TDBViewParam,
  makeCollectiviteIndicateursUrl,
  makeTableauBordModuleUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import Module from '../Module';
import {TDBModuleIndicateurs} from '../data';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {getIndicateurGroup} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';

type Props = {
  view: TDBViewParam;
  module: TDBModuleIndicateurs;
  plan_ids?: number[];
};

const ModuleIndicateurs = ({view, module, plan_ids}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const {data, isLoading} = useFilteredIndicateurDefinitions(null, {plan_ids});

  return (
    <Module
      title={module.title}
      symbole={module.symbole}
      editModal={openState => (
        <ModalIndicateursSuiviPlan openState={openState} />
      )}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      selectedFilters={['test']}
      footerButtons={
        <>
          <Button
            size="sm"
            onClick={() =>
              history.push(
                makeCollectiviteIndicateursUrl({
                  collectiviteId: collectiviteId!,
                  indicateurView: 'cles',
                })
              )
            }
          >
            Voir tous les indicateurs
          </Button>
          {data && data.length > 3 && (
            <Button
              variant="grey"
              size="sm"
              onClick={() =>
                history.push(
                  makeTableauBordModuleUrl({
                    collectiviteId: collectiviteId!,
                    view,
                    module: module.slug,
                  })
                )
              }
            >
              Afficher{' '}
              {data.length === 4
                ? '1 autre indicateur'
                : `les ${data.length - 3} autres indicateurs`}
            </Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
        {data &&
          data.map(
            (definition, index) =>
              index < 3 && (
                <IndicateurCard
                  key={definition.id}
                  definition={definition}
                  href={makeCollectiviteIndicateursUrl({
                    collectiviteId: collectiviteId!,
                    indicateurView: getIndicateurGroup(definition.id),
                    indicateurId: definition.id,
                  })}
                  card={{external: true}}
                />
              )
          )}
      </div>
    </Module>
  );
};

export default ModuleIndicateurs;
