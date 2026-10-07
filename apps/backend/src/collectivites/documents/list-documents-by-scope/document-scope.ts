import { ActionId, ReferentielId } from '@tet/domain/referentiels';

type CollectiviteReader = {
  collectiviteId: number;
  canReadConfidentiel: boolean;
};

export type DocumentScope = CollectiviteReader &
  (
    | { kind: 'complementaire'; referentielId: ReferentielId }
    | { kind: 'reglementaire'; referentielId: ReferentielId }
    | { kind: 'labellisation'; demandeId: number }
    | { kind: 'audit'; auditId: number }
    | { kind: 'mesure'; actionId: ActionId; withSubActions: boolean }
  );

export type DocumentScopeKind = DocumentScope['kind'];
