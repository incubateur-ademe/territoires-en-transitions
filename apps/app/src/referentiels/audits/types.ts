import { Audit } from '@/domain/referentiels';
import { ObjectToSnake } from 'ts-case-convert';

export type TAuditEnCours = ObjectToSnake<
  Pick<
    Audit,
    | 'id'
    | 'collectiviteId'
    | 'demandeId'
    | 'dateDebut'
    | 'dateFin'
    | 'valide'
    | 'referentielId'
  >
>;
