import {useState} from 'react';

import {TDBViewParam, makeCollectivitePlanActionFicheUrl} from 'app/paths';

import {
  ModuleFicheActionsSelect,
  Slug,
} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Filtre as FiltreFicheActions} from '@tet/api/dist/src/fiche_actions/resumes.list/domain/fetch_options.schema';
import {Input, Select} from '@tet/ui';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {useFicheActionResumeFetch} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionResumeFetch';
import {useModuleFetch} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory} from 'react-router-dom';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import ModulePage from '../ModulePage';

type orderByOptionsType = {
  label: string;
  value: keyof FiltreFicheActions;
  direction: 'asc' | 'desc';
};

const orderByOptions: orderByOptionsType[] = [
  {
    label: 'Date de modification',
    value: 'modifiedSince',
    direction: 'desc',
  },
];

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

/** Page d'un module du tableau de bord plans d'action */
const ModuleFichesActionsPage = ({view, slug}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const {data: module, isLoading: isModuleLoading} = useModuleFetch(slug);

  const {data, isLoading} = useFicheActionResumeFetch({
    options: (module as ModuleFicheActionsSelect)?.options,
  });

  const [order, setOrder] = useState(orderByOptions[0]);

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();
  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  if (isModuleLoading || !module) {
    return null;
  }

  const total = data?.count;

  return (
    <ModulePage view={view} title={'Titre générique actions'}>
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
          <Select
            options={orderByOptions}
            onChange={value =>
              value && setOrder(orderByOptions.find(o => o.value === value)!)
            }
            values={order.value}
            customItem={v => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7">
          {isLoading ? '--' : total ? total : '0'}
          {` `}
          {`action`}
          {total && total > 1 ? 's' : ''}
        </span>
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={e => setSearch(e.target.value)}
          onSearch={v => setDebouncedSearch(v)}
          value={search}
          containerClassname="ml-auto w-full md:w-96"
          placeholder="Rechercher par nom ou description"
          displaySize="sm"
        />
      </div>
      {/** Liste des filtres appliqués */}
      <div className="flex gap-6 mb-8">TODO filtres</div>
      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      data?.data?.length === 0 ? (
        <div className="flex flex-col items-center m-auto">
          <PictoExpert />
          <p className="text-primary-8">
            Aucun indicateur ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste d'indicateurs */
        <>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.data?.map(fiche => (
              <FicheActionCard
                ficheAction={fiche}
                isEditable
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectiviteId,
                    module.options,
                  ],
                ]}
                link={
                  fiche.plans && fiche.plans[0] && fiche.plans[0].id
                    ? makeCollectivitePlanActionFicheUrl({
                        collectiviteId: collectiviteId!,
                        ficheUid: fiche.id!.toString(),
                        planActionUid: fiche.plans[0].id!.toString(),
                      })
                    : undefined
                }
              />
            ))}
          </div>
          {/* <div className="mx-auto mt-16">
            <Pagination
              selectedPage={currentPage}
              nbOfPages={nbOfPages}
              onChange={page => setCurrentPage(page)}
            />
          </div> */}
        </>
      )}
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
