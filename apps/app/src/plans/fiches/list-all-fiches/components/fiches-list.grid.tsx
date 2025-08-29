import { CurrentCollectivite } from '@/api/collectivites';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { ListFicheResumesOutput } from '@/app/plans/fiches/_data/types';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { EmptyCard, Pagination } from '@/ui';

type Props = {
  collectivite: CurrentCollectivite;
  fiches: ListFicheResumesOutput['data'];
  isLoading: boolean;
  displayEditionMenu: boolean;
  isGroupedActionsOn: boolean;
  onUnlink?: (ficheId: number) => void;
  selectedFicheIds: number[];
  handleSelectFiche: (ficheId: number) => void;
  pagination: {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    numberOfItemsPerPage: number;
    countTotal: number;
  };
};

export const FichesListGrid = ({
  collectivite,
  fiches,
  isLoading,
  displayEditionMenu,
  isGroupedActionsOn,
  onUnlink,
  handleSelectFiche,
  selectedFicheIds,
  pagination,
}: Props) => {
  const { currentPage, setCurrentPage, numberOfItemsPerPage, countTotal } =
    pagination;

  if (isLoading) {
    return (
      <div className="grow flex items-center justify-center">
        <SpinnerLoader className="w-8 h-8" />
      </div>
    );
  }

  if (fiches.length === 0) {
    return (
      <EmptyCard
        picto={(props) => <PictoExpert {...props} />}
        title="Aucune fiche action ne correspond à votre recherche"
        variant="transparent"
      />
    );
  }

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fiches.map((fiche) => (
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            isEditable={displayEditionMenu}
            onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
            onSelect={
              isGroupedActionsOn ? () => handleSelectFiche(fiche.id) : undefined
            }
            isSelected={!!selectedFicheIds?.includes(fiche.id)}
            link={
              fiche.plans?.[0]?.id
                ? makeCollectivitePlanActionFicheUrl({
                    collectiviteId: collectivite?.collectiviteId,
                    ficheUid: fiche.id.toString(),
                    planActionUid: fiche.plans?.[0]?.id.toString(),
                  })
                : makeCollectiviteFicheNonClasseeUrl({
                    collectiviteId: collectivite?.collectiviteId,
                    ficheUid: fiche.id.toString(),
                  })
            }
            currentCollectivite={collectivite}
          />
        ))}
      </div>
      <Pagination
        className="mx-auto mt-16"
        selectedPage={currentPage}
        nbOfElements={countTotal}
        maxElementsPerPage={numberOfItemsPerPage}
        idToScrollTo="app-header"
        onChange={setCurrentPage}
      />
    </div>
  );
};
