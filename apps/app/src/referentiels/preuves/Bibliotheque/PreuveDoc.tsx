import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import CarteDocument from './CarteDocument';
import { MUTATION_ACTIONS } from './carte-document-action';
import { Preuve } from './types';

export type PreuveDocProps = {
  classComment?: string;
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

  return (
    <CarteDocument
      classComment={props.classComment}
      displayIdentifier={props.displayIdentifier}
      duplicatedDocumentInformation={props.duplicatedDocumentInformation}
      document={props.preuve}
      allowedActions={canEdit ? MUTATION_ACTIONS : []}
    />
  );
};

export default PreuveDoc;
