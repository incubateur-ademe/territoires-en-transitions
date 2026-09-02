import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
  StartNewAuditCycleRulesErrors,
} from '@tet/domain/referentiels';
import { isPremiereEtoileDemandePending } from '../../premiere-etoile-demande-pending';

export type AskPremiereEtoileButtonState =
  | { kind: 'requestable' }
  | { kind: 'criteria-incomplete' }
  | { kind: 'request-pending' }
  | { kind: 'other-cycle-in-progress'; reason: StartNewAuditCycleRulesErrors };

export const getAskPremiereEtoileButtonState = ({
  canAskFirstStar,
  parcours,
}: {
  canAskFirstStar: boolean;
  parcours: Pick<
    ParcoursLabellisation,
    'status' | 'demande' | 'labellisation'
  > | null;
}): AskPremiereEtoileButtonState => {
  if (isPremiereEtoileDemandePending(parcours)) {
    return { kind: 'request-pending' };
  }
  const cycleAvailability = canStartNewAuditCycle(parcours);
  if (!cycleAvailability.canRequest) {
    return { kind: 'other-cycle-in-progress', reason: cycleAvailability.reason };
  }
  if (canAskFirstStar) {
    return { kind: 'requestable' };
  }
  return { kind: 'criteria-incomplete' };
};
