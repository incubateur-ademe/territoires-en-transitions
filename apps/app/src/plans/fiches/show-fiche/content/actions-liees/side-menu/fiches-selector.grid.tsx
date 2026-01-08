import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { FicheActionCard } from '../card/fiche-action.card';

type Props = {
  fiches?: FicheListItem[];
  selectedFiches: number[];
  onSelect: (fiche: FicheListItem) => void;
};

export const FichesSelectorGrid = (props: Props) => {
  const { fiches = [], selectedFiches, onSelect } = props;
  const collectivite = useCurrentCollectivite();
  const user = useUser();

  if (fiches.length === 0) {
    return (
      <div className="my-24 text-center text-sm text-grey-6">
        Aucune action ne correspond à votre recherche
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {fiches.map((fiche) => {
        const isSelected = selectedFiches?.some((f) => f === fiche.id) ?? false;
        return (
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            link={makeCollectiviteActionUrl({
              collectiviteId: collectivite.collectiviteId,
              ficheUid: fiche.id.toString(),
            })}
            onSelect={() => onSelect(fiche)}
            isSelected={isSelected}
            currentCollectivite={collectivite}
            currentUserId={user.id}
          />
        );
      })}
    </div>
  );
};
