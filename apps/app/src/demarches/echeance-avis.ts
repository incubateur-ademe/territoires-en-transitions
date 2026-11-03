import { computeAvisEcheanceReglementaire } from '@tet/domain/demarches';

export const JOURS_ALERTE_ECHEANCE_AVIS = 21;

const JOUR_MS = 24 * 60 * 60 * 1000;

export type EcheanceAvisPhase = 'a_venir' | 'proche' | 'hors_delai' | 'close';

export type EcheanceAvis = {
  date: Date;
  dateButoir: Date;
  phase: EcheanceAvisPhase;
  joursRestants: number;
};

export const getEcheanceAvis = ({
  transmittedAt,
  avisDeadlineAt,
  avisAttendu,
  nowMs,
}: {
  transmittedAt: string;
  avisDeadlineAt: string;
  avisAttendu: boolean;
  nowMs: number;
}): EcheanceAvis => {
  const date = computeAvisEcheanceReglementaire(new Date(transmittedAt));
  const dateButoir = new Date(avisDeadlineAt);
  const joursRestants = Math.ceil((date.getTime() - nowMs) / JOUR_MS);

  const phase: EcheanceAvisPhase =
    !avisAttendu || dateButoir.getTime() <= nowMs
      ? 'close'
      : date.getTime() < nowMs
      ? 'hors_delai'
      : joursRestants <= JOURS_ALERTE_ECHEANCE_AVIS
      ? 'proche'
      : 'a_venir';

  return { date, dateButoir, phase, joursRestants };
};
