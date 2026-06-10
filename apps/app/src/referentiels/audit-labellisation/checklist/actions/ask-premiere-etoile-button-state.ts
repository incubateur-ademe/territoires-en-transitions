import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
  StartNewAuditCycleRulesErrors,
} from '@tet/domain/referentiels';
import { isPremiereEtoileDemandeEnCours } from '../../premiere-etoile-demande-en-cours';

export type AskPremiereEtoileButtonState =
  | { kind: 'requestable' }
  | { kind: 'criteres-incomplets' }
  | { kind: 'demande-en-cours' }
  | { kind: 'autre-cycle-en-cours'; reason: StartNewAuditCycleRulesErrors };

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
  if (isPremiereEtoileDemandeEnCours(parcours)) {
    return { kind: 'demande-en-cours' };
  }
  const cycleAvailability = canStartNewAuditCycle(parcours);
  if (!cycleAvailability.canRequest) {
    return { kind: 'autre-cycle-en-cours', reason: cycleAvailability.reason };
  }
  if (canAskFirstStar) {
    return { kind: 'requestable' };
  }
  return { kind: 'criteres-incomplets' };
};
