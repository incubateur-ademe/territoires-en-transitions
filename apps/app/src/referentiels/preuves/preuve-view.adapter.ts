import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { ReferentielId } from '@tet/domain/referentiels';
import { groupBy } from 'es-toolkit';
import { TDocumentAttendu, TPreuveReglementaire } from './Bibliotheque/types';

export type AuditFromView = Omit<TAuditEnCours, 'referentiel_id'> & {
  referentiel: ReferentielId;
};

export const toAuditEnCours = ({
  referentiel,
  ...audit
}: AuditFromView): TAuditEnCours => ({
  ...audit,
  referentiel_id: referentiel,
});

const hasDocument = (preuve: TPreuveReglementaire): boolean =>
  preuve.fichier !== null || preuve.lien !== null;

export const toDocumentsAttendus = (
  preuvesReglementaires: TPreuveReglementaire[]
): TDocumentAttendu[] =>
  Object.values(
    groupBy(
      preuvesReglementaires,
      ({ action, preuve_reglementaire }) =>
        `${action.action_id}/${preuve_reglementaire.id}`
    )
  ).map((preuves) => ({
    action: preuves[0].action,
    preuve_reglementaire: preuves[0].preuve_reglementaire,
    documents: preuves.filter(hasDocument),
  }));
