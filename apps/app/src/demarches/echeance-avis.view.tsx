import { appLabels } from '@/app/labels/catalog';
import { format } from 'date-fns';
import { cn, InfoTooltip } from '@tet/ui';
import type { EcheanceAvis, EcheanceAvisPhase } from './echeance-avis';

export const ECHEANCE_AVIS_COULEURS: Record<EcheanceAvisPhase, string> = {
  a_venir: 'text-primary-9',
  proche: 'text-error-1',
  hors_delai: 'text-error-1',
  close: 'text-grey-6',
};

export const EcheanceAvisMention = ({
  echeance,
  className,
}: {
  echeance: EcheanceAvis;
  className?: string;
}) =>
  echeance.phase === 'proche' ? (
    <span className={cn('font-semibold text-error-1', className)}>
      {appLabels.echeanceAvisJoursRestants({ jours: echeance.joursRestants })}
    </span>
  ) : null;

const getInfo = (echeance: EcheanceAvis): string | null => {
  if (echeance.phase === 'proche') {
    return appLabels.echeanceAvisJoursRestantsInfo({
      jours: echeance.joursRestants,
    });
  }
  if (echeance.phase === 'hors_delai') {
    return appLabels.echeanceAvisHorsDelaiInfo({
      date: format(echeance.dateButoir, 'dd/MM/yyyy'),
    });
  }
  return null;
};

export const EcheanceAvisInfo = ({ echeance }: { echeance: EcheanceAvis }) => {
  const info = getInfo(echeance);
  return info ? <InfoTooltip label={info} /> : null;
};
