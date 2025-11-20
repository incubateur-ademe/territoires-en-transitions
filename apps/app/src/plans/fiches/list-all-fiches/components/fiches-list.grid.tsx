import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';

type Props = {
  collectivite: CollectiviteAccess;
  currentUserId: string;
  fiches: FicheWithRelationsAndCollectivite[];
  isLoading: boolean;
  displayEditionMenu: boolean;
  isGroupedActionsOn: boolean;
  onUnlink?: (ficheId: number) => void;
  selectedFicheIds: number[] | 'all';
  handleSelectFiche: (ficheId: number) => void;
};

export const FichesListGrid = ({
  collectivite,
  currentUserId,
  fiches,
  isLoading,
  displayEditionMenu,
  isGroupedActionsOn,
  onUnlink,
  handleSelectFiche,
  selectedFicheIds,
}: Props) => {
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
    <div className="grow">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fiches.map((fiche) => (
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            completion={fiche.completion}
            isEditable={displayEditionMenu}
            onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
            onSelect={
              isGroupedActionsOn ? () => handleSelectFiche(fiche.id) : undefined
            }
            isSelected={
              selectedFicheIds === 'all' ||
              !!selectedFicheIds?.includes(fiche.id)
            }
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
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};
