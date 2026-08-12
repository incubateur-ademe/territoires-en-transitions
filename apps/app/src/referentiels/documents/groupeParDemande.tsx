import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@tet/domain/referentiels';

/** Groupe les preuves du référentiel courant par id de demande ou d'audit. */
export const groupeParDemande = (
  preuves: TPreuveAuditEtLabellisation[],
  referentielId: ReferentielId
): Record<string, TPreuveAuditEtLabellisation[]> =>
  preuves.reduce((dict, preuve) => {
    const referentiel =
      preuve.demande?.referentiel || preuve.audit?.referentiel_id;
    if (referentiel !== referentielId) {
      return dict;
    }

    const id =
      preuve.demande?.id || preuve.audit?.demande_id || preuve.audit?.id;
    if (!id) {
      return dict;
    }

    return {
      ...dict,
      [id]: [...(dict[id] || []), preuve],
    };
  }, {} as Record<string, TPreuveAuditEtLabellisation[]>);
