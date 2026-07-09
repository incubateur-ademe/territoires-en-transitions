import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge } from '@tet/ui';

export const CurrentCollectiviteBadge = () => {
  const currentCollectivite = useCurrentCollectivite();
  const { collectiviteNom, role } = currentCollectivite;

  return (
    <div className="shrink-0 flex border-[0.5px] border-info-3 rounded-md">
      <BadgeNiveauAcces
        collectivite={currentCollectivite}
        className="!rounded-r-none border-none"
      />
      <Badge
        title={collectiviteNom}
        variant={role === null ? 'new' : 'info'}
        type="outlined"
        uppercase={false}
        className="!rounded-l-none border-none"
        size="xs"
        trim={false}
      />
    </div>
  );
};
