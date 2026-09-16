import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import { DocumentCard } from './document-card';
import {
  DocumentReglementaire,
  PreuveComplementaire,
  PreuveRapport,
} from './types';

export type ReferentielDocumentCardProps = {
  preuve: DocumentReglementaire | PreuveComplementaire | PreuveRapport;
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

  return (
    <DocumentCard document={props.preuve}>
      {identifier && <DocumentCard.Identifier value={identifier} />}
      {duplicateInformation && (
        <DocumentCard.Duplicate information={duplicateInformation} />
      )}
      <DocumentCard.Actions visibleWhen={canEdit}>
        <DocumentCard.Edit />
        <DocumentCard.Comment />
        <DocumentCard.Delete />
      </DocumentCard.Actions>
    </DocumentCard>
  );
};
