import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIsAuditeur} from '../Audit/useAudit';
import {useCarteIdentite} from '../PersoReferentielThematique/useCarteIdentite';
import {usePreuves} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {useLabellisationParcours} from './useLabellisationParcours';
import {getParcoursStatus} from './getParcoursStatus';
import {usePeutCommencerAudit} from './usePeutCommencerAudit';

// données du cycle de labellisation/audit actuel d'une collectivité
export type TCycleLabellisation = {
  parcours: TLabellisationParcours | null;
  status: TCycleLabellisationStatus;
  isAuditeur: boolean;
  isCOT: boolean;
  labellisable: boolean;
  peutCommencerAudit: boolean;
};

// état consolidé du cycle de labellisation/audit
export type TCycleLabellisationStatus =
  | 'non_demandee'
  | 'demande_envoyee'
  | 'audit_en_cours'
  | 'audit_valide';

/** Renvoie les données de labellisation/audit de la collectivité courante */
export const useCycleLabellisation = (
  referentiel: string | null
): TCycleLabellisation => {
  const collectivite_id = useCollectiviteId();
  const isAuditeur = useIsAuditeur();
  const identite = useCarteIdentite(collectivite_id);

  // charge les données du parcours
  const parcours = useLabellisationParcours({collectivite_id, referentiel});
  const {completude_ok, rempli} = parcours || {};

  // vérifie si l'utilisateur courant peut commencer l'audit
  const peutCommencerAudit = usePeutCommencerAudit();

  // états dérivés
  const status = getParcoursStatus(parcours);
  const isCOT = Boolean(identite?.is_cot);
  // on peut soumettre la demande de labellisation si...
  const labellisable = Boolean(
    // pas d'audit ou de labellisation demandée
    status === 'non_demandee' &&
      // et le référentiel est rempli
      completude_ok &&
      // et tous les critères sont atteints
      rempli
  );

  return {
    parcours,
    status,
    isAuditeur,
    isCOT,
    labellisable,
    peutCommencerAudit,
  };
};

// charge les documents de labellisation
export const usePreuvesLabellisation = (demande_id?: number) =>
  usePreuves({
    demande_id,
    preuve_types: ['labellisation'],
  }) as TPreuveLabellisation[];
