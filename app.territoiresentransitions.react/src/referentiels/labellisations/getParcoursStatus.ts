import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { TCycleLabellisationStatus } from './useCycleLabellisation';

// détermine l'état consolidé du cycle
type TDemandeEtOuAudit = Pick<TLabellisationParcours, 'demande' | 'audit'>;

export const getParcoursStatus = (
  demandeEtOuAudit: TDemandeEtOuAudit | null
): TCycleLabellisationStatus => {
  if (!demandeEtOuAudit) {
    return 'non_demandee';
  }
  const { demande, audit } = demandeEtOuAudit;
  if (audit?.valide) {
    return 'audit_valide';
  }
  if (audit?.date_debut && !audit?.valide) {
    return 'audit_en_cours';
  }
  if (demande && !demande.en_cours) {
    return 'demande_envoyee';
  }
  return 'non_demandee';
};
