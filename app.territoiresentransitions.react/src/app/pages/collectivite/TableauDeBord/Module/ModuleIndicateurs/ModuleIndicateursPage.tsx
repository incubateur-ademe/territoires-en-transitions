import {useState} from 'react';

import {TDBViewParam, makeCollectiviteIndicateursUrl} from 'app/paths';
import ModulePage from '../ModulePage';
import {indicateursSuiviPlans} from 'app/pages/collectivite/TableauDeBord/Module/data';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {getIndicateurGroup} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Pagination} from 'ui/shared/Pagination';
import {Checkbox} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';

type Props = {
  view: TDBViewParam;
  plan_ids?: number[];
};

const ModuleIndicateursPage = ({view, plan_ids}: Props) => {
  const collectiviteId = useCollectiviteId();

  const {data} = useFilteredIndicateurDefinitions(null, {
  const {data, isLoading} = useFilteredIndicateurDefinitions(null, {
    plan_ids,
  });

  /** Nombre total d'indicateurs filtrés */
  const total = data?.length;

  /** Nombre d'indicateurs par page */
  const perPage = 9;

  /** Nombre total de pages */
  const nbOfPages = total ? Math.ceil(total / perPage) : 1;

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Liste filtrée des indicateurs à afficher */
  const currentDefs = data?.filter(
    (_, i) => Math.floor(i / perPage) + 1 === currentPage
  );

  /** Affiche ou cache les graphiques des cartes */
  const [displayGraphs, setDisplayGraphs] = useState(true);

  return (
    <ModulePage view={view} title={indicateursSuiviPlans.title}>
      {/** Paramètres de la liste */}
      <div className="flex items-center gap-8 mb-8 py-6 border-b border-primary-3">
        <Checkbox
          variant="switch"
          label="Afficher les graphiques"
          labelClassname="font-normal !text-grey-7"
          checked={displayGraphs}
          onChange={() => setDisplayGraphs(!displayGraphs)}
        />
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7">
          {isLoading ? '--' : total ? total : '0'}
          {` `}
          {`indicateur`}
          {total && total > 1 ? 's' : ''}
        </span>
      </div>
      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      currentDefs?.length === 0 ? (
        <div className="flex flex-col items-center m-auto">
          <PictoIndicateurVide />
          <p className="text-primary-8">
            Aucun indicateur ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste d'indicateurs */
        <>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentDefs?.map(definition => (
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
                hideChart={!displayGraphs}
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
