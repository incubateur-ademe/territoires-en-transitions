import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Notification, Tooltip } from '@tet/ui';

type FicheShareInfoProps = {
  fiche: FicheWithRelations;
};

export const SHARE_ICON = 'share-forward-fill';

export const getFicheActionShareIcon = (
  fiche: Pick<FicheWithRelations, 'collectiviteId'>,
  collectiviteId: number
) => {
  return fiche.collectiviteId === collectiviteId ? 'team-fill' : SHARE_ICON;
};

export const getFicheActionShareText = (
  fiche: FicheWithRelations,
  collectiviteId: number
): string => {
  if (!fiche.sharedWithCollectivites?.length) {
    return '';
  }

  return fiche.collectiviteId === collectiviteId
    ? `Cette fiche est partagée en édition avec ${
        fiche.sharedWithCollectivites?.length === 1
          ? `la collectivité ${fiche.sharedWithCollectivites[0].nom}`
          : `la collectivité ${fiche.sharedWithCollectivites[0].nom} et ${
              fiche.sharedWithCollectivites?.length - 1 === 1
                ? `1 autre`
                : `${fiche.sharedWithCollectivites?.length - 1} autres`
            }`
      }`
    : `Cette fiche vous est partagée en édition par la collectivité ${fiche.collectiviteNom}`;
};

export const FicheActionShareInfoText = ({
  fiche,
  collectiviteId,
}: {
  fiche: FicheWithRelations;
  collectiviteId: number;
}) => {
  if (!fiche.sharedWithCollectivites?.length) {
    return null;
  }

  if (fiche.collectiviteId === collectiviteId) {
    return (
      <span>
        Cette fiche est partagée en édition avec{' '}
        <Tooltip
          label={`Partagée avec les collectivités : ${fiche.sharedWithCollectivites
            .map((c) => c.nom)
            .join(', ')}`}
        >
          <span className="font-extrabold">
            {fiche.sharedWithCollectivites?.length === 1
              ? `la collectivité ${fiche.sharedWithCollectivites[0].nom}`
              : `la collectivité ${fiche.sharedWithCollectivites[0].nom} et ${
                  fiche.sharedWithCollectivites?.length - 1 === 1
                    ? `1 autre`
                    : `${fiche.sharedWithCollectivites?.length - 1} autres`
                }`}
          </span>
        </Tooltip>
      </span>
    );
  }

  return (
    <span>
      Cette fiche vous est partagée en édition par la collectivité{' '}
      <span className="font-extrabold">{fiche.collectiviteNom}</span>
    </span>
  );
};

const FicheShareInfo = ({ fiche }: FicheShareInfoProps) => {
  const { sharedWithCollectivites } = fiche;
  const collectiviteId = useCollectiviteId();

  return sharedWithCollectivites && sharedWithCollectivites.length > 0 ? (
    <div className="flex items-start gap-2">
      <Notification
        variant="success"
        icon={getFicheActionShareIcon(fiche, collectiviteId)}
        size="xs"
        classname="h-6 w-8 justify-center"
      />
      <FicheActionShareInfoText fiche={fiche} collectiviteId={collectiviteId} />
    </div>
  ) : null;
};

export default FicheShareInfo;
