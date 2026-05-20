import { appLabels } from '@/app/labels/catalog';
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
              <Link
                href={'https://calendar.app.google/j5uQrkt13xLZRBSDA'}
                target={'_blank'}
                rel={'noopener noreferrer'}
              >
                {appLabels.echangezAvecNous}
              </Link>{' '}
              {appLabels.votreAvisFaconneLeProduit}
            </span>
          </>
        }
      />
    </>
  );
};
