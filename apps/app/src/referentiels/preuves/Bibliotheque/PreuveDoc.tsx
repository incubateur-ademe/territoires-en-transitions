import { useOptionalReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import CarteDocument from './CarteDocument';
import { TPreuve } from './types';

export type TPreuveDocProps = {
  classComment?: string;
  preuve: TPreuve;
  readonly?: boolean;
  displayIdentifier?: boolean;
  duplicatedDocumentInformation?: DuplicatedDocumentInformation;
};

const PreuveDoc = (props: TPreuveDocProps) => {
  const { hasCollectivitePermission, hasReferentielPermission } =
    useCurrentCollectivite();
  const referentielId = useOptionalReferentielId();
  const canMutate = referentielId
    ? hasReferentielPermission('referentiels.mutate', referentielId)
    : hasCollectivitePermission('referentiels.mutate');

  return (
    <CarteDocument
      classComment={props.classComment}
      displayIdentifier={props.displayIdentifier}
      duplicatedDocumentInformation={props.duplicatedDocumentInformation}
      document={props.preuve}
      isReadonly={!canMutate || props.readonly || false}
    />
  );
};

export default PreuveDoc;
