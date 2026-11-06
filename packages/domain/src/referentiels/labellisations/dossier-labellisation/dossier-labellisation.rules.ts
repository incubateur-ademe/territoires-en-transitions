import { createEnumObject } from '../../../utils';
import { LabellisationAudit } from '../labellisation-audit.schema';
import { LabellisationDemande } from '../labellisation-demande.schema';
import { isPremiereEtoileDemande } from '../request-labellisation/request-labellisation.rules';

/**
 * Dossier d'audit ou de labellisation administré par le programme TETE :
 * un audit (non fantôme) et la demande envoyée qui lui est liée.
 */
export const dossierLabellisationStatutValues = [
  'demande_envoyee',
  'premiere_etoile_a_valider',
  'audit_en_cours',
  'audit_valide',
  'clos',
] as const;

export const DossierLabellisationStatutEnum = createEnumObject(
  dossierLabellisationStatutValues
);

export type DossierLabellisationStatut =
  (typeof dossierLabellisationStatutValues)[number];

/** Les dossiers en cours : ce que la liste montre sans filtre posé. */
export const DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT = [
  'demande_envoyee',
  'premiere_etoile_a_valider',
  'audit_en_cours',
  'audit_valide',
] as const satisfies readonly DossierLabellisationStatut[];

export const dossierLabellisationDecisionValues = [
  // Audit validé par l'auditeur : crée la labellisation (étoile + date CRA) et clôt
  'labelliser',
  // Demande de 1ère étoile : crée la labellisation 1 étoile sans score et clôt
  'valider_premiere_etoile',
  // Clôt le dossier sans labellisation (audit COT, refus de 1ère étoile, abandon…)
  'clore',
] as const;

export const DossierLabellisationDecisionEnum = createEnumObject(
  dossierLabellisationDecisionValues
);

export type DossierLabellisationDecision =
  (typeof dossierLabellisationDecisionValues)[number];

type DossierForRules = {
  audit: Pick<LabellisationAudit, 'clos' | 'valide' | 'dateDebut'>;
  demande: Pick<LabellisationDemande, 'etoiles' | 'sujet'> | null;
};

export function getDossierLabellisationStatut({
  audit,
  demande,
}: DossierForRules): DossierLabellisationStatut {
  if (audit.clos) {
    return 'clos';
  }
  if (audit.valide) {
    return 'audit_valide';
  }
  if (audit.dateDebut) {
    return 'audit_en_cours';
  }
  if (isPremiereEtoileDemande(demande)) {
    return 'premiere_etoile_a_valider';
  }
  return 'demande_envoyee';
}

export function canDecideDossierLabellisation(
  dossier: DossierForRules,
  decision: DossierLabellisationDecision
): boolean {
  const statut = getDossierLabellisationStatut(dossier);
  switch (decision) {
    case 'labelliser':
      return (
        statut === 'audit_valide' &&
        (dossier.demande?.sujet === 'labellisation' ||
          dossier.demande?.sujet === 'labellisation_cot')
      );
    case 'valider_premiere_etoile':
      return statut === 'premiere_etoile_a_valider';
    case 'clore':
      return statut !== 'clos';
  }
}
