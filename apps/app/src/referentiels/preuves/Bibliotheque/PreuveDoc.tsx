import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import CarteDocument from './CarteDocument';
import { MUTATION_ACTIONS } from './carte-document-action';
import { Preuve } from './types';

export type PreuveDocProps = {
  preuve: Preuve;
  readonly?: boolean;
  displayIdentifier?: boolean;
  duplicatedDocumentInformation?: DuplicatedDocumentInformation;
};

const PreuveDoc = (props: PreuveDocProps) => {
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
    <CarteDocument document={props.preuve}>
      <CarteDocument.Actions allowedActions={canEdit ? MUTATION_ACTIONS : []} />
      <CarteDocument.Title />
      {identifiant && <CarteDocument.Identifier identifiant={identifiant} />}
      <CarteDocument.Author />
      <CarteDocument.Duplicate
        information={props.duplicatedDocumentInformation}
      />
      <CarteDocument.Comment />
      {visitDate && <CarteDocument.VisitDate date={visitDate} />}
    </CarteDocument>
  );
};

export default PreuveDoc;
