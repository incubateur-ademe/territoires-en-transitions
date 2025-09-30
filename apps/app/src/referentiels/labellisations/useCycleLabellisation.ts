import { useCurrentCollectivite } from '@/api/collectivites';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { TPreuveLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { usePreuves } from '@/app/referentiels/preuves/usePreuves';
import { ReferentielId } from '@/domain/referentiels';
import { useIsAuditeur } from '../audits/useAudit';
import { useCarteIdentite } from '../personnalisations/PersoReferentielThematique/useCarteIdentite';
import { useLabellisationParcours } from './useLabellisationParcours';
import { usePeutCommencerAudit } from './usePeutCommencerAudit';

// données du cycle de labellisation/audit actuel d'une collectivité
export type TCycleLabellisation = {
  parcours: TLabellisationParcours | null;
  status: TCycleLabellisationStatus;
  isAuditeur: boolean;
  isCOT: boolean;
  labellisable: boolean;
  peutDemanderEtoile: boolean;
  peutCommencerAudit: boolean;
};

// état consolidé du cycle de labellisation/audit
export type TCycleLabellisationStatus =
  | 'non_demandee'
  | 'demande_envoyee'
  | 'audit_en_cours'
  | 'audit_valide';

/**
 * Renvoie les données de labellisation/audit de la collectivité courante
 */
export const useCycleLabellisation = (
  referentielId: ReferentielId
): TCycleLabellisation => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const isAuditeur = useIsAuditeur();
  const identite = useCarteIdentite(collectiviteId);

  // charge les données du parcours
  const parcours = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });

  const { completude_ok, rempli, etoiles } = parcours || {};

  // vérifie si l'utilisateur courant peut commencer l'audit
  const peutCommencerAudit = usePeutCommencerAudit({
    collectiviteId,
    referentielId,
  });

  // états dérivés
  const status = getParcoursStatus(parcours);
  const isCOT = Boolean(identite?.is_cot);

  // on peut demander une étoile si...
  const peutDemanderEtoile = Boolean(
    // pas d'audit ou de labellisation demandée
    status === 'non_demandee' &&
      // et le référentiel est rempli
      completude_ok &&
      // et tous les critères sont atteints
      rempli &&
      // et l'utilisateur a le droit requis
      !isReadOnly
  );

  // on peut soumettre une demande de labellisation si...
  const labellisable = peutDemanderEtoile && etoiles !== 1;

  return {
    parcours,
    status,
    isAuditeur,
    isCOT,
    peutDemanderEtoile,
    peutCommencerAudit,
    labellisable,
  };
};

// charge les documents de labellisation
export const usePreuvesLabellisation = (demande_id?: number) =>
  usePreuves({
    demande_id,
    disabled: !demande_id,
    preuve_types: ['labellisation'],
  }) as TPreuveLabellisation[];
// détermine l'état consolidé du cycle
type TDemandeEtOuAudit = Pick<TLabellisationParcours, 'demande' | 'audit'>;

export const getParcoursStatus = (
  demandeEtOuAudit: TDemandeEtOuAudit | null | undefined
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
