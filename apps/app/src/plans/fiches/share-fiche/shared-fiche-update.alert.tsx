import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { FicheShareProperties } from './fiche-share-properties.dto';

export const SharedFicheUpdateAlert = ({
  fiche,
}: {
  fiche: FicheShareProperties;
}) => {
  const collectiviteId = useCollectiviteId();

  if (!isFicheSharedWithCollectivite(fiche, collectiviteId)) {
    return null;
  }

  return (
    <>
      <Alert
        rounded
        state="warning"
        className="mb-4"
        title={`Attention vous éditez directement la fiche action de la collectivité "${fiche.collectiviteNom}" qui vous a partagé cette fiche en écriture`}
      />
    </>
  );
};
