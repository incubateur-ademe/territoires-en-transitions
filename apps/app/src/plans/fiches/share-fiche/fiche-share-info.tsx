import { useCollectiviteId } from '@/api/collectivites';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheResume } from '@/domain/plans';
import { Notification, Tooltip } from '@/ui';

type FicheShareInfoProps = {
  fiche: FicheShareProperties;
};

export const SHARE_ICON = 'share-forward-fill';

export const getFicheActionShareIcon = (
  fiche: Pick<FicheResume, 'collectiviteId'>,
  collectiviteId: number
) => {
  return fiche.collectiviteId === collectiviteId ? 'team-fill' : SHARE_ICON;
};

export const ficheSharedSingularAndPluralText = (
  sharedWithCollectivites: NonNullable<
    FicheShareProperties['sharedWithCollectivites']
  >
) =>
  sharedWithCollectivites.length === 1
    ? `la collectivité ${sharedWithCollectivites[0].nom}`
    : `la collectivité ${sharedWithCollectivites[0].nom} et ${
        sharedWithCollectivites?.length - 1 === 1
          ? `1 autre`
          : `${sharedWithCollectivites?.length - 1} autres`
      }`;

export const getFicheActionShareText = (
  fiche: FicheShareProperties,
  collectiviteId: number
): string => {
  if (!fiche.sharedWithCollectivites?.length) {
    return '';
  }

  return fiche.collectiviteId === collectiviteId
    ? `Cette fiche est partagée en édition avec ${ficheSharedSingularAndPluralText(
        fiche.sharedWithCollectivites
      )}`
    : `Cette fiche vous est partagée en édition par la collectivité ${fiche.collectiviteNom}`;
};

const FicheActionShareInfoText = ({
  fiche,
  collectiviteId,
}: {
  fiche: FicheShareProperties;
  collectiviteId: number;
}) => {
  if (!fiche.sharedWithCollectivites?.length) {
    return null;
  }

  if (fiche.collectiviteId === collectiviteId) {
    return (
      <span>
        Cette fiche est partagée en édition avec{' '}
        <span className="font-extrabold">
          {ficheSharedSingularAndPluralText(fiche.sharedWithCollectivites)}
        </span>
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

  if (!sharedWithCollectivites || sharedWithCollectivites.length === 0) {
    return null;
  }

  return (
    <Tooltip
      label={`Partagée avec les collectivités : ${sharedWithCollectivites
        .map((c) => c.nom)
        .join(', ')}`}
    >
      <div className="flex items-start gap-2">
        <Notification
          variant="success"
          icon={getFicheActionShareIcon(fiche, collectiviteId)}
          size="xs"
          classname="h-6 w-8 justify-center"
        />
        <FicheActionShareInfoText
          fiche={fiche}
          collectiviteId={collectiviteId}
        />
      </div>
    </Tooltip>
  );
};

export default FicheShareInfo;
