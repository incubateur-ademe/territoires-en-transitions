import { useCurrentCollectivite } from '@tet/api/collectivites';
import CarteDocument from './CarteDocument';
import { TPreuve } from './types';

export type TPreuveDocProps = {
  classComment?: string;
  preuve: TPreuve;
  readonly?: boolean;
  displayIdentifier?: boolean;
};

const PreuveDoc = (props: TPreuveDocProps) => {
  const currentCollectivite = useCurrentCollectivite();
  return (
    <CarteDocument
      classComment={props.classComment}
      displayIdentifier={props.displayIdentifier}
      document={props.preuve}
      isReadonly={
        !currentCollectivite ||
        currentCollectivite.isReadOnly ||
        props.readonly ||
        false
      }
    />
  );
};

export default PreuveDoc;
