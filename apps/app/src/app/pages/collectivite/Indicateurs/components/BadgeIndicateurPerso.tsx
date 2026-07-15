import { Badge } from '@tet/ui';
import { RiUserLine } from '@remixicon/react';

const BadgeIndicateurPerso = () => {
  return (
    <Badge
      title="Indicateur personnalisé"
      variant="success"
      type="outlined"
      size="xs"
      iconPosition="left"
      icon={<RiUserLine />}
    />
  );
};

export default BadgeIndicateurPerso;
