import { ModuleFicheActionCountByStatusSelect } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { statutToColor } from '@tet/app/pages/collectivite/PlansActions/FicheAction/utils';
import { useFichesActionStatuts } from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleAvancementFichesAction/useFichesActionStatuts';
import { makeFichesActionUrlWithParams } from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleAvancementFichesAction/utils';
import { getQueryKey } from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModulesFetch';
import { useEventTracker } from '@tet/ui';
import BadgeStatut from 'app/pages/collectivite/PlansActions/components/BadgeStatut';
import Module, {
  ModuleDisplay,
} from 'app/pages/collectivite/TableauDeBord/components/Module';
import ModalAvancementFichesAction from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleAvancementFichesAction/ModalAvancementFichesAction';
import { TDBViewParam } from 'app/paths';
import { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Chart from 'ui/charts/Chart';
import PictoDocument from 'ui/pictogrammes/PictoDocument';
import { Statut } from '@tet/api/plan-actions';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionCountByStatusSelect;
};

/** Module pour afficher l'avancement des fiches action */
const ModuleAvancementFichesAction = ({ module }: Props) => {
  const collectivite = useCurrentCollectivite();

  const history = useHistory();

  const collectiviteId = collectivite?.collectivite_id;

  const trackEvent = useEventTracker('app/tdb/collectivite');

  const [display, setDisplay] = useState<ModuleDisplay>('row');

  const filtres = module.options.filtre;

  const { data, isLoading } = useFichesActionStatuts(
    Object.fromEntries(
      // Map les champs entre le type API et celui Backend
      Object.entries({
        cibles: filtres.cibles?.join(','),
        partenaire_tag_ids: filtres.partenaireIds?.join(','),
        pilote_tag_ids: filtres.personnePiloteIds?.join(','),
        pilote_user_ids: filtres.utilisateurPiloteIds?.join(','),
        service_tag_ids: filtres.servicePiloteIds?.join(','),
        plan_ids: filtres.planActionIds?.join(','),
        // Enlève les entrées avec valeur undefined
      }).filter(([_, value]) => value !== undefined && value.length > 0)
    )
  );

  const statutFiches = data?.par_statut;

  const fichesCount = statutFiches
    ? Object.values(statutFiches).reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  if (!collectiviteId) {
    return null;
  }

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      onSettingsClick={() =>
        trackEvent('tdb_modifier_filtres_avancement_actions', {
          collectivite_id: module.collectiviteId,
        })
      }
      editModal={
        collectivite?.niveau_acces === 'admin'
          ? (openState) => (
              <ModalAvancementFichesAction
                module={module}
                openState={openState}
                displaySettings={{
                  display,
                  setDisplay,
                }}
                keysToInvalidate={[getQueryKey(collectiviteId)]}
              />
            )
          : undefined
      }
      isLoading={isLoading}
      isEmpty={fichesCount === 0}
      className="!col-span-full xl:!col-span-4"
      displaySettings={{
        display,
        setDisplay,
      }}
    >
      {display === 'circular' && (
        <Chart
          donut={{
            chart: {
              data: statutFiches
                ? Object.entries(statutFiches)
                    .map(([statut, { count, valeur }]) => ({
                      id: statut,
                      value: count,
                      color: statutToColor[valeur],
                    }))
                    .filter(({ value }) => value > 0)
                : [],
              onClick: (statut) =>
                statut !== 'Sans statut' &&
                history.push(
                  makeFichesActionUrlWithParams(
                    collectiviteId,
                    filtres,
                    statut as Statut
                  )
                ),
              centeredElement: (
                <div className="flex flex-col items-center">
                  <span className="text-primary-9 text-2xl font-bold">
                    {fichesCount}
                  </span>
                  <span className="-mt-1 text-grey-6 text-lg font-medium">
                    action{`${fichesCount > 1 ? 's' : ''}`}
                  </span>
                </div>
              ),
              displayOutsideLabel: false,
            },
          }}
        />
      )}
      {display === 'row' && (
        <div className="flex flex-wrap gap-2">
          {statutFiches &&
            Object.entries(statutFiches).map(([statut, { valeur }], index) =>
              statut === 'Sans statut' ? (
                <Card statut={valeur} count={statutFiches[statut].count} />
              ) : (
                <Link
                  key={index}
                  to={makeFichesActionUrlWithParams(
                    collectiviteId,
                    filtres,
                    valeur
                  )}
                  className="bg-none rounded-xl hover:shadow"
                >
                  <Card statut={valeur} count={statutFiches[statut].count} />
                </Link>
              )
            )}
        </div>
      )}
    </Module>
  );
};

export default ModuleAvancementFichesAction;

type CardProps = {
  statut: Statut;
  count: number;
};

const Card = ({ statut, count }: CardProps) => (
  <div className="flex flex-col items-center shrink-0 gap-2 p-2 border border-primary-2 rounded-xl">
    <span className="text-3xl text-primary-9 font-bold">{count}</span>
    <BadgeStatut statut={statut} size="sm" />
  </div>
);
