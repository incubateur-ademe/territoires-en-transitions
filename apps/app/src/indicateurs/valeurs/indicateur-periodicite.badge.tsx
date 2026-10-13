import { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { Badge, Tooltip } from '@tet/ui';
import {
  getIndicateurPeriodPresentation,
  getIndicateurPeriodiciteTooltip,
} from './indicateur-period-presentation';

export const IndicateurPeriodiciteBadge = ({
  periodicite,
  participationScore = false,
}: {
  periodicite: IndicateurPeriodicite;
  participationScore?: boolean;
}) => {
  const { label } = getIndicateurPeriodPresentation(periodicite);
  return (
    <Tooltip
      label={getIndicateurPeriodiciteTooltip(periodicite, participationScore)}
    >
      <span tabIndex={0} data-test="indicateurs.periodicite.badge">
        <Badge
          title={label}
          variant="standard"
          type="outlined"
          size="sm"
          className="rounded-full"
        />
      </span>
    </Tooltip>
  );
};
