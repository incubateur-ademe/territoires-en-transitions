import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import { DocumentCard } from './document-card';
import {
  DocumentComplementaire,
  DocumentRapport,
  DocumentReglementaire,
} from './types';

export type ReferentielDocumentCardProps = {
  preuve: DocumentReglementaire | DocumentComplementaire | DocumentRapport;
  readonly?: boolean;
  displayIdentifier?: boolean;
  duplicatedDocumentInformation?: DuplicatedDocumentInformation;
};

export const ReferentielDocumentCard = (
  props: ReferentielDocumentCardProps
) => {
  const { hasCollectivitePermission, hasReferentielPermission } =
    useCurrentCollectivite();
  const referentielId = useOptionalReferentielId();
  const canMutate = referentielId
    ? hasReferentielPermission('referentiels.mutate', referentielId)
    : hasCollectivitePermission('referentiels.mutate');
  const canEdit = canMutate && !props.readonly;

  const identifier =
    props.displayIdentifier && 'action' in props.preuve
      ? props.preuve.action.identifiant
      : null;
  const duplicateInformation = props.duplicatedDocumentInformation;

  const actions = canEdit
    ? { edit: true, comment: true, remove: true }
    : undefined;

  return (
    <DocumentCard
      document={props.preuve}
      identifier={identifier}
      duplicate={duplicateInformation}
      actions={actions}
    />
  );
};
