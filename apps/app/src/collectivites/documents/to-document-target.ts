import { LabellisationDemande } from '@tet/domain/referentiels';
import { match } from 'ts-pattern';
import { DocumentRattache } from './bibliotheque/types';
import { DocumentTarget } from './document-target';

type DemandeTarget = Extract<DocumentTarget, { type: 'demandeLabellisation' }>;

const toDemandeTarget = (demande: LabellisationDemande): DemandeTarget => ({
  type: 'demandeLabellisation',
  collectiviteId: demande.collectiviteId,
  demandeId: demande.id,
  referentielId: demande.referentiel,
});

export const toDocumentTargets = (
  document: DocumentRattache
): DocumentTarget[] => {
  const { collectiviteId } = document;

  return match(document)
    .with({ preuveType: 'reglementaire' }, () => [
      { type: 'preuveReglementaire' as const, collectiviteId },
    ])
    .with({ preuveType: 'complementaire' }, () => [
      { type: 'mesure' as const, collectiviteId },
    ])
    .with({ preuveType: 'annexe' }, () => [{ type: 'ficheAction' as const }])
    .with({ preuveType: 'rapport' }, () => [{ type: 'rapportVisite' as const }])
    .with({ preuveType: 'labellisation' }, ({ demande }) => [
      toDemandeTarget(demande),
    ])
    .with({ preuveType: 'audit' }, ({ audit, demande }) => [
      { type: 'audit' as const, collectiviteId, auditId: audit.id },
      ...(demande ? [toDemandeTarget(demande)] : []),
    ])
    .exhaustive();
};
