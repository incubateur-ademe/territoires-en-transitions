import { referentielToShortName } from '@/app/app/labels';
import { ReferentielId } from '@tet/domain/referentiels';
import { Badge, BadgeProps } from '@tet/ui';

/**
 * Référentiel du dossier, en badge coloré : une collectivité peut avoir un
 * dossier par référentiel, il ne faut pas se tromper de ligne.
 * CAE en bleu, ECi en rose.
 */
export const ReferentielBadge = ({
  referentielId,
  size = 'sm',
}: {
  referentielId: ReferentielId;
  size?: BadgeProps['size'];
}) =>
  referentielId === 'eci' ? (
    <Badge
      size={size}
      variant="custom"
      className="bg-pink-50 border-pink-600 text-pink-600"
      title={referentielToShortName[referentielId]}
    />
  ) : (
    <Badge
      size={size}
      variant="info"
      title={referentielToShortName[referentielId]}
    />
  );
