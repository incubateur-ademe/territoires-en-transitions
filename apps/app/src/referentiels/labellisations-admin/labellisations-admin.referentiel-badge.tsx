import { referentielToShortName } from '@/app/app/labels';
import { ReferentielId } from '@tet/domain/referentiels';
import { Badge, BadgeProps } from '@tet/ui';

/**
 * Référentiel du dossier, en badge coloré : une collectivité peut avoir un
 * dossier par référentiel, il ne faut pas se tromper de ligne.
 */
export const ReferentielBadge = ({
  referentielId,
  size = 'sm',
}: {
  referentielId: ReferentielId;
  size?: BadgeProps['size'];
}) => (
  <Badge
    size={size}
    variant={'info'}
    title={referentielToShortName[referentielId]}
  />
);
