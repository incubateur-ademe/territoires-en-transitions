import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIsAuditeur} from '../Audit/useAudit';
import {useCarteIdentite} from '../PersoReferentielThematique/useCarteIdentite';
import {usePreuves} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {useLabellisationParcours} from './useLabellisationParcours';

// données du cycle de labellisation/audit actuel d'une collectivité
export type TCycleLabellisation = {
  parcours: TLabellisationParcours | null;
  preuves: TPreuveLabellisation[];
  status: TCycleLabellisationStatus;
  isAuditeur: boolean;
  isCOT: boolean;
  labellisable: boolean;
};

// état consolidé du cycle de labellisation/audit
type TCycleLabellisationStatus =
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

  // charge les documents de labellisation
  const preuves = usePreuves({
    demande_id: parcours?.demande?.id,
    preuve_types: ['labellisation'],
  }) as TPreuveLabellisation[];

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
    preuves,
    status,
    isAuditeur,
    isCOT,
    labellisable,
  };
};

// détermine l'état consolidé du cycle
const getParcoursStatus = (
  parcours: TLabellisationParcours | null
): TCycleLabellisationStatus => {
  if (!parcours) {
    return 'non_demandee';
  }
  const {demande, audit} = parcours;
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
