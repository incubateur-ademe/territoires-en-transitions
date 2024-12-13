import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
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
        currentCollectivite.readonly ||
        props.readonly ||
        false
      }
    />
  );
};

export default PreuveDoc;
