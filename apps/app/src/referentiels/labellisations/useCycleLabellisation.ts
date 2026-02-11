import { useQuery } from '@tanstack/react-query';
import { useTRPC, useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  canStartAudit,
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  ReferentielId,
} from '@tet/domain/referentiels';
import { useIsAuditeur } from '../audits/useAudit';
import { useCarteIdentite } from '../personnalisations/PersoReferentielThematique/useCarteIdentite';
import { useLabellisationParcours } from './useLabellisationParcours';

// données du cycle de labellisation/audit actuel d'une collectivité
export type TCycleLabellisation = {
  parcours: ParcoursLabellisation | null;
  status: ParcoursLabellisationStatus;
  isAuditeur: boolean;
  isCOT: boolean;
  labellisable: boolean;
  peutDemanderEtoile: boolean;
  peutCommencerAudit: boolean;
  peutDemander1ereEtoileCOT: boolean;
};

/**
 * Renvoie les données de labellisation/audit de la collectivité courante
 */
export const useCycleLabellisation = (
  referentielId: ReferentielId
): TCycleLabellisation => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const isAuditeur = useIsAuditeur();
  const user = useUser();
  const identite = useCarteIdentite(collectiviteId);

  // charge les données du parcours
  const parcours = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });

  const { completude_ok, rempli, etoiles, conditionFichiers } = parcours || {};
  const status = parcours?.status || 'non_demandee';

  // vérifie si l'utilisateur courant peut commencer l'audit
  const peutCommencerAudit = canStartAudit(parcours, user.id).canRequest;

  // états dérivés
  const isCOT = Boolean(identite?.is_cot);

  const peutDemanderEtoileBase = Boolean(
    // pas d'audit ou de labellisation demandée
    status === 'non_demandee' &&
      // et le référentiel est rempli
      completude_ok &&
      // et tous les critères sont atteints
      rempli &&
      // et l'utilisateur a le droit requis
      hasCollectivitePermission('referentiels.mutate')
  );

  // cas spéciaux pour les COT pour la première étoile : pas besoin de déposer un fichier
  const peutDemander1ereEtoileCOT = Boolean(
    etoiles === 1 && isCOT && peutDemanderEtoileBase
  );

  // on peut demander une étoile si...
  // TODO: à mettre dans le backend et à tester unitairement
  const peutDemanderEtoile = Boolean(
    peutDemanderEtoileBase &&
      // Pour demander une labellisation, on doit avoir déposé un fichier même si on est un COT (sauf pour la première étoile)
      conditionFichiers?.atteint
  );

  // on peut soumettre une demande de labellisation si...
  const labellisable = peutDemanderEtoile && etoiles !== 1;

  return {
    parcours,
    status,
    isAuditeur,
    isCOT,
    peutDemanderEtoile,
    peutDemander1ereEtoileCOT,
    peutCommencerAudit,
    labellisable,
  };
};

// charge les documents de labellisation
export const usePreuvesLabellisation = (demande_id?: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.listPreuvesLabellisation.queryOptions(
      { demandeId: demande_id ?? 0 },
      { enabled: Boolean(demande_id) }
    )
  );
};
