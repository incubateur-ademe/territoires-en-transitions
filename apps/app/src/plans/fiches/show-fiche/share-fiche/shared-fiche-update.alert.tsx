import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert } from '@tet/ui';

export const SharedFicheUpdateAlert = ({
  fiche,
}: {
  fiche: FicheWithRelations;
}) => {
  const collectiviteId = useCollectiviteId();

  if (!isFicheSharedWithCollectivite(fiche, collectiviteId)) {
    return null;
  }

  return (
    <>
      <Alert
        state="warning"
        className="mb-4"
        title={`Attention vous éditez directement l'action de la collectivité "${fiche.collectiviteNom}" qui vous l'a partagée en écriture`}
      />
    </>
  );
};
