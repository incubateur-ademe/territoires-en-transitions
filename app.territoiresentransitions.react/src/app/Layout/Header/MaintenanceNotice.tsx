import {ControlledAlert as Alert} from '@tet/ui';
import {Maintenance} from '../useMaintenance';

/**
 * Affiche un bandeau d'information quand une maintenance est prévue ou en cours.
 */
export const MaintenanceNotice = ({
  maintenance,
}: {
  maintenance: Maintenance | null;
}) => {
  const {now, begins_at, ends_at} = maintenance || {};
  if (!now || !begins_at || !ends_at) return null;

  const ongoing = new Date(now) > new Date(begins_at);
  if (ongoing)
    return (
      <Alert
        fullPageWidth
        state="error"
        title={`Une mise en production est en cours. Merci de ne pas utiliser la plateforme 
        pour éviter toute perte d'informations.`}
      />
    );

  const formatedBeginsAt = formatDate(begins_at);
  const formatedEndsAt = formatDate(ends_at);
  return (
    <Alert
      fullPageWidth
      title={`Une mise en production est prévue ${
        formatedBeginsAt === formatedEndsAt
          ? `le ${formatedBeginsAt}`
          : `du ${formatedBeginsAt} au ${formatedEndsAt}`
      }. 
      Le fonctionnement de la plateforme pourra en être altéré sur ce laps de temps.`}
    />
  );
};

const formatDate = (s: string) =>
  new Date(s).toLocaleString('fr', {dateStyle: 'short'});
