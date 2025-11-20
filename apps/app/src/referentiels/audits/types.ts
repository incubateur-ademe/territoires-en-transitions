import { LabellisationAudit } from '@tet/domain/referentiels';
import { ObjectToSnake } from 'ts-case-convert';

export type TAuditEnCours = ObjectToSnake<
  Pick<
    LabellisationAudit,
    | 'id'
    | 'collectiviteId'
    | 'demandeId'
    | 'dateDebut'
    | 'dateFin'
    | 'valide'
    | 'referentielId'
  >
>;
