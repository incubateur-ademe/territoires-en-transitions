import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import { DocumentCard } from './document-card';
import { MUTATION_ACTIONS } from './document-card/action';
import { Preuve } from './types';

export type ReferentielDocumentCardProps = {
  preuve: Preuve;
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

  const identifiant =
    props.displayIdentifier && 'action' in props.preuve
      ? props.preuve.action.identifiant
      : null;
  const visitDate =
    props.preuve.preuveType === 'rapport' ? props.preuve.rapport.date : null;

  return (
    <DocumentCard document={props.preuve}>
      <DocumentCard.Actions allowedActions={canEdit ? MUTATION_ACTIONS : []} />
      <DocumentCard.Title />
      {identifiant && <DocumentCard.Identifier identifiant={identifiant} />}
      <DocumentCard.Author />
      <DocumentCard.Duplicate
        information={props.duplicatedDocumentInformation}
      />
      <DocumentCard.Comment />
      {visitDate && <DocumentCard.VisitDate date={visitDate} />}
    </DocumentCard>
  );
};
