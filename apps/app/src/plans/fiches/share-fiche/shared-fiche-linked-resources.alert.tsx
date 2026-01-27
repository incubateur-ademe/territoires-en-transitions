import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { Alert, InlineLink } from '@tet/ui';
import { isFicheSharedWithCollectivite } from './share-fiche.utils';

type SharedFicheLinkedResourcesAlertProps = {
  fiche: Fiche;
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
        {`${sharedDataTitle} à la collectivité de ${fiche.collectiviteNom} qui partage cette action`}
      </h6>
      <Alert
        className="mb-4"
        title={
          <>
            <span>
              Cette action vous a été partagée par la collectivité
              {` "${fiche.collectiviteNom}"`}.{` ${sharedDataDescription}`}
            </span>
            <span>
              Vous souhaitez des améliorations ?{' '}
              <InlineLink
                href="https://calendar.app.google/j5uQrkt13xLZRBSDA"
                openInNewTab
              >
                Échangez avec nous
              </InlineLink>{' '}
              - Votre avis façonne le produit.
            </span>
          </>
        }
      />
    </>
  );
};
