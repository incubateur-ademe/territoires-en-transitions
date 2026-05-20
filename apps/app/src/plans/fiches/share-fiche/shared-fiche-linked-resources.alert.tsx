import { appLabels } from '@/app/labels/catalog';
import { Fiche } from '@/app/plans/fiches/data/use-get-fiche';
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
        {appLabels.fichePartageeTitreSection({
          title: sharedDataTitle,
          collectiviteNom: fiche.collectiviteNom ?? '',
        })}
      </h6>
      <Alert
        className="mb-4"
        title={
          <>
            <span>
              {appLabels.ficheActionPartageeParCollectivite({
                collectiviteNom: fiche.collectiviteNom ?? '',
                description: sharedDataDescription,
              })}
            </span>
            <span>
              {appLabels.vousSouhaitezDesAmeliorations}{' '}
              <InlineLink
                href="https://calendar.app.google/j5uQrkt13xLZRBSDA"
                openInNewTab
              >
                {appLabels.echangezAvecNous}
              </InlineLink>{' '}
              {appLabels.votreAvisFaconneLeProduit}
            </span>
          </>
        }
      />
    </>
  );
};
