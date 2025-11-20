import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@tet/domain/referentiels';

// groupe les preuves par référentiel
type TPreuvesParReferentiel = Record<
  ReferentielId,
  TPreuveAuditEtLabellisation[]
>;
const groupeParReferentiel = (
  preuves: TPreuveAuditEtLabellisation[]
): TPreuvesParReferentiel =>
  preuves.reduce((dict, preuve) => {
    const referentiel =
      preuve.demande?.referentiel || preuve.audit?.referentiel_id;
    if (!referentiel || referentiel === 'te' || referentiel === 'te-test') {
      return dict;
    }
    return {
      ...dict,
      [referentiel]: [...(dict[referentiel] || []), preuve],
    };
  }, {} as TPreuvesParReferentiel);

// groupe les preuves par id de demande ou d'audit
type TPreuvesParDemande = Record<string, TPreuveAuditEtLabellisation[]>;
const groupeParDemande = (
  preuves: TPreuveAuditEtLabellisation[]
): TPreuvesParDemande =>
  preuves.reduce((dict, preuve) => {
    const id =
      preuve.demande?.id || preuve.audit?.demande_id || preuve.audit?.id;
    if (!id) {
      return dict;
    }
    return {
      ...dict,
      [id]: [...(dict[id] || []), preuve],
    };
  }, {} as TPreuvesParDemande);

// groupe les preuves par référentiel et par demande
type TPreuvesParReferentielEtDemande = Record<
  string,
  Record<string, TPreuveAuditEtLabellisation[]>
>;
export const groupeParReferentielEtDemande = (
  preuves: TPreuveAuditEtLabellisation[]
): TPreuvesParReferentielEtDemande => {
  return Object.entries(groupeParReferentiel(preuves)).reduce(
    (dict, [referentiel, preuvesReferentiel]) => ({
      ...dict,
      [referentiel]: groupeParDemande(preuvesReferentiel),
    }),
    {} as TPreuvesParReferentielEtDemande
  );
};
