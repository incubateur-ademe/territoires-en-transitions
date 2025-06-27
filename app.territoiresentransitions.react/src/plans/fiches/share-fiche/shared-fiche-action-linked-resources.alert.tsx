import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { Alert } from '@/ui';
import Link from 'next/link';

type SharedFicheActionLinkedResourcesAlertProps = {
  fiche: Pick<Fiche, 'collectiviteNom' | 'sharedWithCollectivites'>;
  currentCollectiviteId: number;
  sharedDataTitle: string;
  sharedDataDescription: string;
};

const SharedFicheActionLinkedResourcesAlert = ({
  fiche,
  sharedDataTitle,
  sharedDataDescription,
  currentCollectiviteId,
}: SharedFicheActionLinkedResourcesAlertProps) => {
  return isFicheSharedWithCollectivite(fiche, currentCollectiviteId) ? (
    <>
      <h6 className="text-sm leading-4 text-primary-9 uppercase mb-4">
        {`${sharedDataTitle} à la collectivité de ${fiche.collectiviteNom} qui partage cette fiche`}
      </h6>
      <Alert
        rounded
        className="mb-4"
        title={
          <>
            <span>
              Cette fiche action vous a été partagée par la collectivité
              {` "${fiche.collectiviteNom}"`}.{` ${sharedDataDescription}`}
            </span>
            <span>
              Vous souhaitez des améliorations ?{' '}
              <Link
                href={'https://calendar.app.google/j5uQrkt13xLZRBSDA'}
                target={'_blank'}
                rel={'noopener noreferrer'}
              >
                Échangez avec nous
              </Link>{' '}
              - Votre avis façonne le produit.
            </span>
          </>
        }
      />
    </>
  ) : null;
};

export default SharedFicheActionLinkedResourcesAlert;
