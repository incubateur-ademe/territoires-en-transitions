import { useHistory } from 'react-router-dom';

import { Button } from '@tet/ui';

import { ModuleIndicateursSelect } from '@tet/api/collectivites/tableau_de_bord.show/domain/module.schema';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { useFilteredIndicateurDefinitions } from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  TDBViewParam,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeTableauBordModuleUrl,
} from 'app/paths';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import { useCollectiviteId } from 'core-logic/hooks/params';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import Module from '../Module';
import { getQueryKey } from '../useModulesFetch';

type Props = {
  view: TDBViewParam;
  module: ModuleIndicateursSelect;
};

const ModuleIndicateurs = ({ view, module }: Props) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;
  const history = useHistory();

  const { data, isLoading } = useFilteredIndicateurDefinitions(
    module.options,
    false
  );

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoIndicateurVide className="w-16 h-16" />}
      trackingId="indicateurs"
      editModal={(openState) => (
        <ModalIndicateursSuiviPlan
          openState={openState}
          module={module}
          keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
        />
      )}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      footerButtons={
        <>
          <Button
            size="sm"
            onClick={() =>
              history.push(
                makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId: collectiviteId!,
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
                    indicateurView: getIndicateurGroup(definition.identifiant),
                    indicateurId: definition.id,
                    identifiantReferentiel: definition.identifiant,
                  })}
                  card={{ external: true }}
                  autoRefresh
                />
              )
          )}
      </div>
    </Module>
  );
};

export default ModuleIndicateurs;
