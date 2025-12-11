import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert } from '@tet/ui';
import Link from 'next/link';

type SharedFicheLinkedResourcesAlertProps = {
  fiche: FicheWithRelations;
  currentCollectiviteId: number;
  sharedDataTitle: string;
  sharedDataDescription: string;
};

export const SharedFicheLinkedResourcesAlert = ({
  fiche,
  sharedDataTitle,
  sharedDataDescription,
  currentCollectiviteId,
}: SharedFicheLinkedResourcesAlertProps) => {
  if (!isFicheSharedWithCollectivite(fiche, currentCollectiviteId)) {
    return null;
  }

  return (
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
  );
};
