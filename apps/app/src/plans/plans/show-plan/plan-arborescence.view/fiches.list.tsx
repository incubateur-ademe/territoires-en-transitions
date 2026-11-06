import { FicheCard } from '@/app/plans/fiches/components/card/fiche.card';
import { FicheCardSkeleton } from '@/app/plans/fiches/components/card/fiche.skeleton';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { FicheSecteursBadge } from '@/app/plans/plans/secteurs-counts/fiche-secteurs.badge';
import { useListPlanFichesSecteursAVerifier } from '@/app/plans/plans/secteurs-counts/data/use-list-plan-fiches-secteurs-a-verifier';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useListFiches } from '../../../fiches/list-all-fiches/data/use-list-fiches';

type Props = {
  ficheIds: number[];
  axeId: number;
  planId?: number;
  collectivite: CollectiviteCurrent;
};

export const FichesList = ({
  ficheIds,
  axeId,
  planId,
  collectivite,
}: Props) => {
  const user = useUser();
  const { fiches: fichesSecteurs } = useListPlanFichesSecteursAVerifier(
    collectivite.collectiviteId,
    planId ?? 0,
    { enabled: planId !== undefined }
  );
  const secteursByFicheId = new Map(
    fichesSecteurs.map((fiche) => [fiche.ficheId, fiche])
  );
  const { fiches } = useListFiches(collectivite.collectiviteId, {
    filters: {
      axesId: [axeId],
    },
    queryOptions: {
      sort: [{ field: 'titre', direction: 'asc' }],
      limit: 'all',
    },
  });

  return (
    <div className={'grid grid-cols-2 gap-6 my-2'}>
      {ficheIds.map((ficheId, i) => {
        const fiche =
          (ficheId > 0 && fiches.find((f) => f.id === ficheId)) || null;
        if (!fiche) {
          return <FicheCardSkeleton key={i} />;
        }
      })}
      {fiches.map((fiche) => {
        const isReadonly =
          !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id) ||
          isFicheSharedWithCollectivite(fiche, collectivite.collectiviteId);
        const ficheSecteurs = secteursByFicheId.get(fiche.id);
        return (
          <FicheCard
            currentCollectivite={collectivite}
            currentUserId={user.id}
            key={fiche.id}
            ficheAction={fiche}
            isEditable={!isReadonly}
            isMoveable
            planId={planId}
            axeId={axeId}
            bottomBadge={
              ficheSecteurs && <FicheSecteursBadge fiche={ficheSecteurs} />
            }
            link={
              fiche.id
                ? makeCollectiviteActionUrl({
                    collectiviteId: fiche.collectiviteId,
                    ficheUid: fiche.id.toString(),
                    planId,
                  })
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
