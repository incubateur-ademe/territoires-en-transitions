import { PreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@tet/domain/referentiels';

/** Groupe les preuves du référentiel courant par id de demande ou d'audit. */
export const groupeParDemande = (
  preuves: PreuveAuditEtLabellisation[],
  referentielId: ReferentielId
): Record<string, PreuveAuditEtLabellisation[]> =>
  preuves.reduce((dict, preuve) => {
    const audit = preuve.preuveType === 'audit' ? preuve.audit : null;
    const referentiel = preuve.demande?.referentiel || audit?.referentielId;
    if (referentiel !== referentielId) {
      return dict;
    }

    const id = preuve.demande?.id || audit?.demandeId || audit?.id;
    if (!id) {
      return dict;
    }

    return {
      ...dict,
      [id]: [...(dict[id] || []), preuve],
    };
  }, {} as Record<string, PreuveAuditEtLabellisation[]>);
