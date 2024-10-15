import { TPreuve } from './types';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import CarteDocument from './CarteDocument';

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
        currentCollectivite.readonly ||
        props.readonly ||
        false
      }
    />
  );
};

export default PreuveDoc;
