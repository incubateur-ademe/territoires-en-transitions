import {useHistory} from 'react-router-dom';

import {Button} from '@tet/ui';

import {useFiltreValuesFetch} from '@tet/api/dist/src/collectivites/shared/actions/filtre_values.fetch';
import {FiltreValues} from '@tet/api/dist/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {ModuleIndicateursSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {optionsToFilters} from '@tet/api/dist/src/indicateurs/fetchFilteredIndicateurs';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {getIndicateurGroup} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  TDBViewParam,
  makeCollectiviteIndicateursUrl,
  makeTableauBordModuleUrl,
} from 'app/paths';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import Module from '../Module';

type Props = {
  view: TDBViewParam;
  planIds?: number[];
  module: ModuleIndicateursSelect;
};

const ModuleIndicateurs = ({view, module, planIds}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const filtre = {
    plan_ids: planIds,
    ...optionsToFilters(module.options),
  };

  const {data, isLoading} = useFilteredIndicateurDefinitions(null, filtre);

  return (
    <Module
      title={module.titre}
      symbole={<PictoIndicateurVide />}
      editModal={openState => (
        <ModalIndicateursSuiviPlan openState={openState} module={module} />
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
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
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
