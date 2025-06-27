import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { Alert } from '@/ui';

type SharedFicheActionUpdateAlertProps = {
  fiche: Pick<Fiche, 'collectiviteNom' | 'sharedWithCollectivites'>;
};

const SharedFicheActionUpdateAlert = ({
  fiche,
}: SharedFicheActionUpdateAlertProps) => {
  const collectiviteId = useCollectiviteId();

  return isFicheSharedWithCollectivite(fiche, collectiviteId) ? (
    <>
      <Alert
        rounded
        state="warning"
        className="mb-4"
        title={`Attention vous éditez directement la fiche action de la collectivité "${fiche.collectiviteNom}" qui vous a partagé cette fiche en écriture`}
      />
    </>
  ) : null;
};

export default SharedFicheActionUpdateAlert;
