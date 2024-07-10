import {useState} from 'react';

import {Button, Input, ModalOpenState, Pagination, Select} from '@tet/ui';
import {
  FetchOptions,
  Filtre,
  Filtre as FiltreFicheActions,
} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';

import SpinnerLoader from 'ui/shared/SpinnerLoader';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/Module/ModuleFiltreBadges';

import {useFicheResumesFetch} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectivitePlanActionFicheUrl} from 'app/paths';

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
  filtres: Filtre;
  settingsModal: (openState: ModalOpenState) => React.ReactNode;
  maxNbOfCards?: number;
  onSettingsClick?: () => void;
};

const FichesActionListe = ({
  filtres,
  settingsModal,
  maxNbOfCards = 15,
  onSettingsClick,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [order, setOrder] = useState(orderByOptions[0]);

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();

  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  const ficheResumesOptions: FetchOptions = {
    filtre: {
      ...filtres,
      texteNomOuDescription: debouncedSearch,
    },
    page: currentPage,
    limit: maxNbOfCards,
  };

  const {data, isLoading} = useFicheResumesFetch({
    options: ficheResumesOptions,
  });

  const countTotal = data?.count || 0;

  return (
    <>
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
          {isLoading ? '--' : countTotal}
          {` `}
          {`action`}
          {countTotal > 1 ? 's' : ''}
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
        {/** Bouton d'édition des filtres du module + modale */}
        <Button
          variant="outlined"
          icon="equalizer-line"
          size="sm"
          onClick={() => {
            setIsSettingsOpen(true);
            onSettingsClick?.();
          }}
        />
        {isSettingsOpen &&
          settingsModal({isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen})}
      </div>
      {/** Liste des filtres appliqués */}
      <ModuleFiltreBadges filtre={filtres} />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      data?.data?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoExpert className="w-32 h-32" />
          <p className="text-primary-8">
            Aucune fiche action ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.data?.map(fiche => (
              <FicheActionCard
                key={fiche.id}
                ficheAction={fiche}
                isEditable
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectiviteId,
                    ficheResumesOptions,
                  ],
                ]}
                link={makeCollectivitePlanActionFicheUrl({
                  collectiviteId: collectiviteId!,
                  ficheUid: fiche.id.toString(),
                  planActionUid: fiche.plan_id?.toString()!,
                })}
              />
            ))}
          </div>
          <div className="flex mt-16">
            <Pagination
              className="mx-auto"
              selectedPage={currentPage}
              nbOfElements={countTotal}
              maxElementsPerPage={maxNbOfCards}
              onChange={page => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FichesActionListe;
